#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
case "${1:-}" in
  setup|dev|build|start|format|lint|test) exec ./make.sh "$@" ;;
  *) echo 'Usage: ./make.sh {setup|dev|build|start|format|lint|test}' >&2; exit 1 ;;
esac
