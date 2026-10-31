#!/usr/bin/env bash
# ==============================================================================
# setup-mise.sh
#
# Idempotently installs and configures mise, developer toolchains,
# and a daily systemd user auto-upgrade timer.
#
# Usage:
#   setup-mise.sh           # Run setup and configure tools and timer
#   setup-mise.sh --dry-run # Check actions without modifying system
#   setup-mise.sh --help    # Show help and usage instructions
# ==============================================================================

set -euo pipefail

export PATH="$HOME/.local/bin:$HOME/.local/share/mise/shims:/usr/local/bin:/usr/bin:/bin:$PATH"

DRY_RUN=false

while [ $# -gt 0 ]; do
  case "$1" in
    --dry-run|-n)
      DRY_RUN=true
      ;;
    --help|-h)
      echo "Usage: $(basename "$0") [--dry-run|-n] [--help|-h]"
      echo ""
      echo "Idempotently configures mise, core developer toolchains (caddy, cloudflared, gh, node, portless, pnpm),"
      echo "enforces prefer_offline = true to prevent broken shims, and installs a daily systemd user auto-upgrade timer."
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      echo "Run '$(basename "$0") --help' for usage." >&2
      exit 1
      ;;
  esac
  shift
done

log() {
  echo "[$(date -Is)] $*"
}

# ------------------------------------------------------------------------------
# Step 1: Install mise to ~/.local/bin/mise if not present
# ------------------------------------------------------------------------------
log "Step 1: Checking mise installation..."

if ! command -v mise >/dev/null 2>&1 && [ ! -x "$HOME/.local/bin/mise" ]; then
  log "mise not found. Installing via https://mise.run..."
  if [ "$DRY_RUN" = true ]; then
    log "[Dry Run] Would run: curl -fsSL https://mise.run | sh"
  else
    curl -fsSL https://mise.run | sh
    export PATH="$HOME/.local/bin:$PATH"
  fi
else
  log "mise is already installed."
fi

if command -v mise >/dev/null 2>&1; then
  MISE_BIN="$(command -v mise)"
elif [ -x "$HOME/.local/bin/mise" ]; then
  MISE_BIN="$HOME/.local/bin/mise"
else
  MISE_BIN="$HOME/.local/bin/mise"
fi

# ------------------------------------------------------------------------------
# Step 2: Configure ~/.config/mise/config.toml idempotently
# ------------------------------------------------------------------------------
log "Step 2: Configuring ~/.config/mise/config.toml..."

MISE_CONFIG_DIR="$HOME/.config/mise"
MISE_CONFIG_FILE="$MISE_CONFIG_DIR/config.toml"

if [ "$DRY_RUN" = true ]; then
  if [ ! -d "$MISE_CONFIG_DIR" ]; then
    log "[Dry Run] Would create directory: $MISE_CONFIG_DIR"
  fi
  if [ ! -f "$MISE_CONFIG_FILE" ]; then
    log "[Dry Run] Would create $MISE_CONFIG_FILE with baseline settings and tools"
  else
    log "[Dry Run] Would ensure prefer_offline=true, self_update.auto=true, and tools in $MISE_CONFIG_FILE"
  fi
  log "[Dry Run] Would run: mise install"
else
  mkdir -p "$MISE_CONFIG_DIR"

  if [ ! -f "$MISE_CONFIG_FILE" ]; then
    log "Creating $MISE_CONFIG_FILE with recommended settings and tools..."
    cat << 'EOF' > "$MISE_CONFIG_FILE"
[settings]
prefer_offline = true

[settings.self_update]
auto = true

[tools]
caddy = "latest"
cloudflared = "latest"
gh = "latest"
node = "latest"
"npm:portless" = "latest"
pnpm = "latest"
EOF
  else
    log "Updating existing $MISE_CONFIG_FILE with required settings and tools..."
    "$MISE_BIN" settings set prefer_offline true
    "$MISE_BIN" settings set self_update.auto true
    "$MISE_BIN" use --global caddy@latest cloudflared@latest gh@latest node@latest npm:portless@latest pnpm@latest
  fi

  log "Running mise install to ensure configured tools are present..."
  "$MISE_BIN" install
fi

# ------------------------------------------------------------------------------
# Step 3: Create systemd user service and timer
# ------------------------------------------------------------------------------
log "Step 3: Configuring systemd user auto-upgrade service and timer..."

SYSTEMD_USER_DIR="$HOME/.config/systemd/user"
SERVICE_FILE="$SYSTEMD_USER_DIR/mise-upgrade.service"
TIMER_FILE="$SYSTEMD_USER_DIR/mise-upgrade.timer"

if [ "$MISE_BIN" = "$HOME/.local/bin/mise" ]; then
  SYSTEMD_MISE_BIN="%h/.local/bin/mise"
else
  SYSTEMD_MISE_BIN="$MISE_BIN"
fi

if [ "$DRY_RUN" = true ]; then
  log "[Dry Run] Would ensure directory exists: $SYSTEMD_USER_DIR"
  log "[Dry Run] Would create $SERVICE_FILE"
  log "[Dry Run] Would create $TIMER_FILE"
else
  mkdir -p "$SYSTEMD_USER_DIR"

  cat << EOF > "$SERVICE_FILE"
[Unit]
Description=Upgrade mise and managed toolchains
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
Environment="PATH=%h/.local/bin:%h/.local/share/mise/shims:/usr/local/bin:/usr/bin:/bin"
ExecStart=-$SYSTEMD_MISE_BIN self-update -y
ExecStart=$SYSTEMD_MISE_BIN upgrade
EOF

  cat << 'EOF' > "$TIMER_FILE"
[Unit]
Description=Daily mise toolchain auto-upgrade timer

[Timer]
OnCalendar=daily
Persistent=true
RandomizedDelaySec=1h

[Install]
WantedBy=timers.target
EOF
fi

# ------------------------------------------------------------------------------
# Step 4: Reload and enable systemd user timer
# ------------------------------------------------------------------------------
log "Step 4: Activating systemd user timer..."

if command -v systemctl >/dev/null 2>&1 && systemctl --user list-timers >/dev/null 2>&1; then
  if [ "$DRY_RUN" = true ]; then
    log "[Dry Run] Would run: systemctl --user daemon-reload"
    log "[Dry Run] Would run: systemctl --user enable --now mise-upgrade.timer"
  else
    systemctl --user daemon-reload
    systemctl --user enable --now mise-upgrade.timer
    log "mise-upgrade.timer successfully enabled and started."
  fi
else
  log "Notice: systemctl --user is unavailable or inactive in this environment. Skipping timer activation."
fi

log "mise setup complete!"
