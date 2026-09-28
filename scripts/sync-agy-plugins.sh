#!/usr/bin/env bash
# ==============================================================================
# sync-agy-plugins.sh
# 
# Generalized smart poller for Antigravity (AGY) plugins.
# Discovers all installed plugins in ~/.gemini/config/plugins/ that were cloned
# from a git remote, queries the upstream remote HEAD commit via git ls-remote,
# and automatically updates only those plugins with new commits on GitHub.
#
# Usage:
#   sync-agy-plugins.sh           # Run sync check and update changed plugins
#   sync-agy-plugins.sh --dry-run # Check for updates without installing
# ==============================================================================

set -euo pipefail

export PATH="$HOME/.gemini/bin:$HOME/.local/bin:/usr/local/bin:/usr/bin:/bin:$PATH"
export GIT_CONFIG_PARAMETERS="'core.fsmonitor=false'"

PLUGINS_DIR="${AGY_PLUGINS_DIR:-$HOME/.gemini/config/plugins}"
LOG_FILE="${AGY_SYNC_LOG:-$HOME/.gemini/logs/plugins-sync.log}"
DRY_RUN=false

for arg in "$@"; do
  case "$arg" in
    --dry-run|-n)
      DRY_RUN=true
      shift
      ;;
    --help|-h)
      echo "Usage: $(basename "$0") [--dry-run] [--help]"
      echo "Scans $PLUGINS_DIR for git-cloned plugins and updates any with remote changes."
      exit 0
      ;;
  esac
done

log() {
  local msg="[$(date -Is)] $*"
  echo "$msg"
  if [ "$DRY_RUN" = false ]; then
    mkdir -p "$(dirname "$LOG_FILE")" 2>/dev/null || true
    echo "$msg" >> "$LOG_FILE" 2>/dev/null || true
  fi
}

if [ ! -d "$PLUGINS_DIR" ]; then
  log "Plugins directory not found: $PLUGINS_DIR. Exiting."
  exit 0
fi

updated_count=0
checked_count=0

for plugin_path in "$PLUGINS_DIR"/*; do
  [ -d "$plugin_path" ] || continue
  plugin_name=$(basename "$plugin_path")

  # Only inspect plugins installed from a git remote (contains .git)
  if [ -d "$plugin_path/.git" ]; then
    repo_url=$(git -C "$plugin_path" remote get-url origin 2>/dev/null || echo "")
    [ -n "$repo_url" ] || continue

    checked_count=$((checked_count + 1))
    local_sha=$(git -C "$plugin_path" rev-parse HEAD 2>/dev/null || echo "")
    remote_sha=$(git ls-remote "$repo_url" HEAD 2>/dev/null | awk '{print $1}')

    # If offline or remote unreachable, skip cleanly
    if [ -z "$remote_sha" ]; then
      log "Warning: Could not resolve remote HEAD for [$plugin_name] ($repo_url)."
      continue
    fi

    if [ "$remote_sha" != "$local_sha" ]; then
      log "Update available for [$plugin_name]: ${local_sha:0:8} -> ${remote_sha:0:8} ($repo_url)"
      if [ "$DRY_RUN" = true ]; then
        log "[Dry Run] Would run: agy plugin install $repo_url"
      else
        log "Reinstalling [$plugin_name] from $repo_url..."
        if "$HOME/.gemini/bin/agy" plugin install "$repo_url" >> "$LOG_FILE" 2>&1; then
          log "Successfully updated [$plugin_name] to ${remote_sha:0:8}."
          updated_count=$((updated_count + 1))
        else
          log "ERROR: Failed to update [$plugin_name]."
        fi
      fi
    fi
  fi
done

if [ "$updated_count" -gt 0 ]; then
  log "Sync complete: $updated_count plugin(s) updated out of $checked_count checked."
fi
