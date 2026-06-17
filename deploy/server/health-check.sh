#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/common.sh"

COMPONENT="${1:-frontend}"
ROOT_DIR="${2:-/home/director-video-service-cloud}"
SITE_URL="${3:-https://qqxxkj.com}"
BACKEND_HEALTH_URL="${4:-http://127.0.0.1:8000/api/user/current-user/}"

cd "$ROOT_DIR"
docker compose ps

case "$COMPONENT" in
  frontend)
    inspect_container_state "director-video-frontend"
    expect_http_code "$SITE_URL" 200 301 302
    ;;
  all)
    inspect_container_state "director-video-frontend"
    inspect_container_state "director-video-backend"
    inspect_container_state "director-video-scheduler"
    inspect_container_state "director-video-mysql"
    inspect_container_state "director-video-redis"
    inspect_container_state "director-video-rabbitmq"
    expect_http_code "$SITE_URL" 200 301 302
    expect_http_code "$BACKEND_HEALTH_URL" 200 401
    ;;
  *)
    echo "[health] 不支持的检查范围: $COMPONENT"
    exit 1
    ;;
esac
