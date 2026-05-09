#!/bin/zsh

# Stop script on first error (equivalent to $ErrorActionPreference = 'Stop')
set -e

# Get the directory where the script is located
root=$(dirname "$0")

# Construct the path to the server script
# '..' moves up one level, then into Server/scripts/
serverScript="$root/../Server/scripts/serve-app.mjs"

# Execute the node command
if node "$serverScript" --root 'maintenance-app' --title 'Maintenance App' --preferred-port 3004 --open; then
    : # No-op if successful
else
    # Catch block equivalent
    echo "Maintenance launcher failed: $?" >&2
fi

# Finally block: Keep terminal open if not running inside VS Code
if [[ "$TERM_PROGRAM" != "vscode" ]]; then
    echo "Press Enter to close this window"
    read -r
fi
