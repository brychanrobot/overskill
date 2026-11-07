#!/usr/bin/env bash
# ==============================================================================
# sync-agy-plugins.sh
# 
# Generalized smart poller for Antigravity (AGY) plugins.
# Discovers all installed plugins in ~/.gemini/config/plugins/ that were cloned
# from a git remote, queries the upstream remote HEAD commit via git ls-remote,
# and automatically updates only those plugins with new commits on GitHub.
# Supports desktop installations and headless Antigravity Cloud VMs.
#
# Usage:
#   sync-agy-plugins.sh           # Run sync check and update changed plugins
#   sync-agy-plugins.sh --dry-run # Check for updates without installing
# ==============================================================================

set -euo pipefail

export PATH="$HOME/.gemini/bin:$HOME/.local/bin:/usr/local/bin:/usr/bin:/bin:$PATH"
export GIT_CONFIG_PARAMETERS="'core.fsmonitor=false' 'safe.directory=*'"
export GIT_CONFIG_COUNT=2
export GIT_CONFIG_KEY_0="core.fsmonitor"
export GIT_CONFIG_VALUE_0="false"
export GIT_CONFIG_KEY_1="safe.directory"
export GIT_CONFIG_VALUE_1="*"

PLUGINS_DIR="${AGY_PLUGINS_DIR:-$HOME/.gemini/config/plugins}"
LOG_FILE="${AGY_SYNC_LOG:-$HOME/.gemini/logs/plugins-sync.log}"
DRY_RUN=false

for arg in "$@"; do
  case "$arg" in
    --dry-run|-n)
      DRY_RUN=true
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

# Locate agy CLI executable if available
AGY_BIN=""
if command -v agy >/dev/null 2>&1; then
  AGY_BIN=$(command -v agy)
elif [ -x "$HOME/.gemini/bin/agy" ]; then
  AGY_BIN="$HOME/.gemini/bin/agy"
fi

sync_skills_and_agents() {
  local src_dir="$1"
  if [ -d "$src_dir/skills" ]; then
    mkdir -p "$HOME/.gemini/skills"
    # shellcheck disable=SC2086
    cp -rfL "$src_dir/skills"/* "$HOME/.gemini/skills/" 2>/dev/null || true
  fi
  if [ -d "$src_dir/agents" ]; then
    mkdir -p "$HOME/.gemini/agents"
    # shellcheck disable=SC2086
    cp -rfL "$src_dir/agents"/* "$HOME/.gemini/agents/" 2>/dev/null || true
  fi
}

has_missing_skills_or_agents() {
  local src_dir="$1"
  if [ -d "$src_dir/skills" ]; then
    for item in "$src_dir/skills"/*; do
      [ -e "$item" ] || continue
      local base
      base=$(basename "$item")
      if [ ! -e "$HOME/.gemini/skills/$base" ]; then
        return 0
      fi
    done
  fi
  if [ -d "$src_dir/agents" ]; then
    for item in "$src_dir/agents"/*; do
      [ -e "$item" ] || continue
      local base
      base=$(basename "$item")
      if [ ! -e "$HOME/.gemini/agents/$base" ]; then
        return 0
      fi
    done
  fi
  return 1
}

if [ ! -d "$PLUGINS_DIR" ]; then
  log "Plugins directory not found: $PLUGINS_DIR. Exiting."
  exit 0
fi

updated_count=0
checked_count=0
pending_count=0
failed_count=0
unreachable_count=0

for plugin_path in "$PLUGINS_DIR"/*; do
  [ -d "$plugin_path" ] || continue
  plugin_name=$(basename "$plugin_path")

  # Only inspect plugins installed from a git remote (contains .git)
  if [ -d "$plugin_path/.git" ]; then
    repo_url=$(git -c safe.directory="*" -C "$plugin_path" remote get-url origin 2>/dev/null || echo "")
    [ -n "$repo_url" ] || continue

    checked_count=$((checked_count + 1))
    local_sha=$(git -c safe.directory="*" -C "$plugin_path" rev-parse HEAD 2>/dev/null || echo "")
    remote_sha=$(git -c safe.directory="*" ls-remote "$repo_url" HEAD 2>/dev/null | awk '{print $1}' || true)

    # If offline or remote unreachable, skip cleanly
    if [ -z "$remote_sha" ]; then
      log "Warning: Could not resolve remote HEAD for [$plugin_name] ($repo_url)."
      unreachable_count=$((unreachable_count + 1))
      continue
    fi

    if [ "$remote_sha" != "$local_sha" ]; then
      pending_count=$((pending_count + 1))
      log "Update available for [$plugin_name]: ${local_sha:0:8} -> ${remote_sha:0:8} ($repo_url)"
      if [ "$DRY_RUN" = true ]; then
        if [ -n "$AGY_BIN" ]; then
          log "[Dry Run] Would run: $AGY_BIN plugin install $repo_url"
        else
          log "[Dry Run] Would clone $repo_url and update [$plugin_name] directly (fallback mode)"
        fi
      else
        installed=false
        if [ -n "$AGY_BIN" ]; then
          log "Reinstalling [$plugin_name] from $repo_url using agy CLI..."
          if "$AGY_BIN" plugin install "$repo_url" >> "$LOG_FILE" 2>&1; then
            installed=true
            log "Successfully updated [$plugin_name] via agy CLI."
            # Sync skills and agents if target directories exist or in cloud fallback mode
            if [ -d "$HOME/.gemini/skills" ] || [ -d "$HOME/.gemini/agents" ]; then
              sync_skills_and_agents "$plugin_path"
            fi
          else
            log "Warning: 'agy plugin install' failed (possible FUSE/chmod constraint). Falling back to direct clone..."
          fi
        fi

        if [ "$installed" = false ]; then
          log "Updating [$plugin_name] via direct git clone fallback..."
          tmp_dir=$(mktemp -d)
          trap 'rm -rf "$tmp_dir"' EXIT
          trap 'rm -rf "$tmp_dir"; exit 130' INT
          trap 'rm -rf "$tmp_dir"; exit 143' TERM
          if git -c safe.directory="*" clone --no-hardlinks --depth 1 "$repo_url" "$tmp_dir" >> "$LOG_FILE" 2>&1; then
            if cp -rf "$tmp_dir"/. "$plugin_path"/ >> "$LOG_FILE" 2>&1 || cp -r "$tmp_dir"/. "$plugin_path"/ >> "$LOG_FILE" 2>&1; then
              sync_skills_and_agents "$tmp_dir"
              installed=true
              log "Successfully updated [$plugin_name] to ${remote_sha:0:8} via fallback sync."
            else
              log "ERROR: Failed to copy updated files into [$plugin_path]."
            fi
          else
            log "ERROR: Failed to clone and update [$plugin_name] from $repo_url."
          fi
          rm -rf "$tmp_dir"
          trap - EXIT INT TERM
        fi

        if [ "$installed" = true ]; then
          updated_count=$((updated_count + 1))
        else
          failed_count=$((failed_count + 1))
        fi
      fi
    else
      # remote_sha == local_sha
      if [ -z "$AGY_BIN" ]; then
        if has_missing_skills_or_agents "$plugin_path"; then
          if [ "$DRY_RUN" = true ]; then
            log "[Dry Run] Would populate missing skills/agents for [$plugin_name] into ~/.gemini/{skills,agents}"
          else
            log "Populating missing skills and agents for [$plugin_name] into ~/.gemini/{skills,agents}..."
            sync_skills_and_agents "$plugin_path"
          fi
        fi
      fi
    fi
  fi
done

if [ "$DRY_RUN" = true ]; then
  log "Dry run complete: $checked_count plugin(s) checked ($pending_count update(s) available, $unreachable_count unreachable)."
elif [ "$failed_count" -gt 0 ]; then
  log "Sync finished with errors: $updated_count plugin(s) updated, $failed_count failed out of $checked_count checked."
  exit 1
elif [ "$updated_count" -gt 0 ]; then
  if [ "$unreachable_count" -gt 0 ]; then
    log "Sync complete with warnings: $updated_count plugin(s) updated, $unreachable_count unreachable out of $checked_count checked."
  else
    log "Sync complete: $updated_count plugin(s) updated out of $checked_count checked."
  fi
elif [ "$unreachable_count" -gt 0 ]; then
  log "Sync check incomplete: $unreachable_count of $checked_count plugin(s) unreachable."
else
  log "All $checked_count plugin(s) up to date (0 updates needed)."
fi
