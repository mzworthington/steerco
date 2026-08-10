#!/usr/bin/env bash
# Rasterize design-pack SVGs into app/public (requires librsvg: brew install librsvg).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DP="$ROOT/design-pack"
PUB="$ROOT/app/public"

command -v rsvg-convert >/dev/null || {
  echo "✗ rsvg-convert not found. Install with: brew install librsvg" >&2
  exit 1
}

mkdir -p "$PUB/assets" "$PUB/icons"

cp "$DP/favicon.svg" "$PUB/favicon.svg"
cp "$DP/mark.svg" "$PUB/assets/logo.svg"
cp "$DP/mark-dark.svg" "$PUB/assets/logo-dark.svg"
cp "$DP/grid.svg" "$PUB/assets/grid.svg"

rsvg-convert -w 32 -h 32 "$DP/favicon.svg" -o "$PUB/favicon.png"
rsvg-convert -w 500 -h 500 "$DP/mark.svg" -o "$PUB/assets/logo.png"
rsvg-convert -w 500 -h 500 "$DP/mark-dark.svg" -o "$PUB/assets/logo-dark.png"
rsvg-convert -w 180 -h 180 "$DP/mark-dark.svg" -o "$PUB/icons/apple-touch-icon.png"
rsvg-convert -w 192 -h 192 "$DP/mark-dark.svg" -o "$PUB/icons/pwa-192x192.png"
rsvg-convert -w 512 -h 512 "$DP/mark-dark.svg" -o "$PUB/icons/pwa-512x512.png"
rsvg-convert -w 1200 -h 630 "$DP/social-share.svg" -o "$PUB/assets/social-share.png"

# Preview copies beside sources
rsvg-convert -w 64 -h 64 "$DP/favicon.svg" -o "$DP/favicon.png"
rsvg-convert -w 500 -h 500 "$DP/mark.svg" -o "$DP/mark.png"
rsvg-convert -w 500 -h 500 "$DP/mark-dark.svg" -o "$DP/mark-dark.png"
rsvg-convert -w 1200 -h 630 "$DP/social-share.svg" -o "$DP/social-share.png"

echo "✓ Synced design-pack → app/public"
