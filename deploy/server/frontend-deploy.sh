#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/common.sh"

ROOT_DIR="${1:-/home/director-video-service-cloud}"
REPO_DIR="$ROOT_DIR/director-video-ui-cloud"

echo "[deploy] 开始重建前端容器"
print_repo_revision "$REPO_DIR"
compose_up_services "$ROOT_DIR" frontend
inspect_container_state "director-video-frontend"
