#!/usr/bin/env bash
# Create a new GitHub repo from this template, then brand it (interactive prompts).
#
# Usage (ArchLens-style one-liner):
#   curl -fsSL https://raw.githubusercontent.com/mzworthington/react-cloudflare-template/main/scripts/create.sh | bash
#
# Prefer `| bash` (not `| sh`): needs bash features such as `pipefail`.
# Prompts read from /dev/tty so they work when the script is piped from curl.
#
# Non-interactive:
#   curl -fsSL …/create.sh | bash -s -- --name "My App" --slug my-app \
#     --description "…" --topics "react,cloudflare,typescript"
if [ -z "${BASH_VERSION:-}" ]; then
  echo "error: run this script with bash, e.g.:" >&2
  echo "  curl -fsSL https://raw.githubusercontent.com/mzworthington/react-cloudflare-template/main/scripts/create.sh | bash" >&2
  exit 1
fi
set -euo pipefail

TEMPLATE_REF="${TEMPLATE_REF:-mzworthington/react-cloudflare-template}"
NAME=""
SLUG=""
DESCRIPTION=""
TOPICS=""
TAGLINE=""
ORIGIN=""
PRIVATE=0
SKIP_DEV_ENV=0
# Track whether optional prompts were answered via flags (skip TTY ask).
DESCRIPTION_SET=0
TOPICS_SET=0

usage() {
  cat <<EOF
Create a new project from ${TEMPLATE_REF}.

Usage:
  create.sh [options]

Options:
  --name <text>         Display / brand name
  --slug <kebab>        Repo + Pages project id (default: derived from --name)
  --description <text>  GitHub repo + site meta description (optional)
  --topics <list>       Comma-separated GitHub topics (optional)
  --tagline <text>      Home hero supporting sentence
  --origin <url>        Public https origin (no trailing slash)
  --private             Create a private GitHub repo (default: public)
  --skip-dev-env        Do not run bin/setup-dev-env.sh after customize
  -h, --help            Show this help

Environment:
  TEMPLATE_REF   GitHub owner/repo to use as the template (default: ${TEMPLATE_REF})

When flags are omitted, the script prompts on the terminal.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --name) NAME="${2:-}"; shift 2 ;;
    --slug) SLUG="${2:-}"; shift 2 ;;
    --description) DESCRIPTION="${2:-}"; DESCRIPTION_SET=1; shift 2 ;;
    --topics) TOPICS="${2:-}"; TOPICS_SET=1; shift 2 ;;
    --tagline) TAGLINE="${2:-}"; shift 2 ;;
    --origin) ORIGIN="${2:-}"; shift 2 ;;
    --private) PRIVATE=1; shift ;;
    --skip-dev-env) SKIP_DEV_ENV=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

slugify() {
  echo "$1" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//; s/-+/-/g'
}

prompt() {
  # $1=var name, $2=prompt, $3=optional default
  local var_name="$1" label="$2" default="${3:-}" reply=""
  if [[ ! -e /dev/tty ]]; then
    echo "✗ No terminal available for prompts; pass --name / --slug flags instead." >&2
    exit 1
  fi
  if [[ -n "$default" ]]; then
    read -r -p "${label} [${default}]: " reply </dev/tty
    reply="${reply:-$default}"
  else
    while [[ -z "$reply" ]]; do
      read -r -p "${label}: " reply </dev/tty
      [[ -n "$reply" ]] || echo "  (required)" >&2
    done
  fi
  printf -v "$var_name" '%s' "$reply"
}

if [[ -z "$NAME" ]]; then
  echo "→ Create a project from ${TEMPLATE_REF}"
  echo
  prompt NAME "App name"
fi

if [[ -z "$SLUG" ]]; then
  prompt SLUG "Repo slug (kebab-case)" "$(slugify "$NAME")"
fi

if ! [[ "$SLUG" =~ ^[a-z0-9]([a-z0-9-]*[a-z0-9])?$ ]]; then
  echo "✗ --slug must be kebab-case (a-z, 0-9, hyphens): got '$SLUG'" >&2
  exit 1
fi

if [[ "$DESCRIPTION_SET" != "1" && -e /dev/tty && -z "${CI:-}" ]]; then
  read -r -p "Description (optional, Enter to skip): " DESCRIPTION </dev/tty || true
fi

if [[ "$TOPICS_SET" != "1" && -e /dev/tty && -z "${CI:-}" ]]; then
  read -r -p "Topics (optional, comma-separated, Enter to skip): " TOPICS </dev/tty || true
fi

if [[ -z "$ORIGIN" && -e /dev/tty && -z "${CI:-}" ]]; then
  read -r -p "Public origin https://… (optional, Enter for https://example.com): " ORIGIN </dev/tty || true
fi

# Normalize topics: commas/spaces → unique tokens for gh --add-topic.
topic_args=()
if [[ -n "$TOPICS" ]]; then
  seen="|"
  # Append trailing comma so the final field is always read.
  while IFS= read -r -d ',' raw || [[ -n "${raw:-}" ]]; do
    topic="$(printf '%s' "$raw" | tr '[:upper:]' '[:lower:]' | sed -E 's/^[[:space:]]+//; s/[[:space:]]+$//; s/[[:space:]]+/-/g; s/[^a-z0-9-]//g; s/-+/-/g; s/^-+//; s/-+$//')"
    [[ -n "$topic" ]] || continue
    case "$seen" in
      *"|${topic}|"*) continue ;;
    esac
    seen+="${topic}|"
    topic_args+=(--add-topic "$topic")
  done <<< "${TOPICS},"
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "✗ GitHub CLI (gh) is required. Install: https://cli.github.com/" >&2
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "✗ gh is not authenticated. Run: gh auth login" >&2
  exit 1
fi

if [[ -e "$SLUG" ]]; then
  echo "✗ ./${SLUG} already exists in $(pwd)" >&2
  exit 1
fi

create_args=("$SLUG" --template "$TEMPLATE_REF" --clone)
if [[ "$PRIVATE" == "1" ]]; then
  create_args+=(--private)
else
  create_args+=(--public)
fi
[[ -n "$DESCRIPTION" ]] && create_args+=(--description "$DESCRIPTION")

echo
echo "→ Creating GitHub repo from template"
echo "   template:    ${TEMPLATE_REF}"
echo "   name:        ${NAME}"
echo "   slug:        ${SLUG}"
echo "   visibility:  $([[ "$PRIVATE" == "1" ]] && echo private || echo public)"
[[ -n "$DESCRIPTION" ]] && echo "   description: ${DESCRIPTION}"
if ((${#topic_args[@]} > 0)); then
  echo "   topics:      ${TOPICS}"
fi

gh repo create "${create_args[@]}"

cd "$SLUG"

if ((${#topic_args[@]} > 0)); then
  echo "→ Setting repository topics"
  gh repo edit "${topic_args[@]}"
fi

init_args=(--name "$NAME" --slug "$SLUG")
[[ -n "$DESCRIPTION" ]] && init_args+=(--description "$DESCRIPTION")
[[ -n "$TAGLINE" ]] && init_args+=(--tagline "$TAGLINE")
[[ -n "$ORIGIN" ]] && init_args+=(--origin "$ORIGIN")

bin/init-project.sh "${init_args[@]}"

if [[ "$SKIP_DEV_ENV" != "1" ]]; then
  if [[ -e /dev/tty && -z "${CI:-}" ]]; then
    reply="Y"
    read -r -p "Run bin/setup-dev-env.sh now? [Y/n]: " reply </dev/tty || true
    reply="${reply:-Y}"
    if [[ "$reply" =~ ^[Yy]$ ]]; then
      bin/setup-dev-env.sh
      echo
      echo "✓ Ready. Start the app:"
      echo "    cd ${SLUG} && cd app && pnpm dev"
      exit 0
    fi
  fi
fi

echo
echo "Next:"
echo "  cd ${SLUG}"
echo "  bin/setup-dev-env.sh"
echo "  cd app && pnpm dev"
