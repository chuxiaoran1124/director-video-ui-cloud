#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/common.sh"

ROOT_DIR="${1:-/home/director-video-service-cloud}"
RELEASE_DIR="${2:-}"
DIST_ARCHIVE="${3:-}"
REPO_DIR="$ROOT_DIR/director-video-ui-cloud"
COMPOSE_FILE="$ROOT_DIR/docker-compose.yml"
HTML_DIR="$ROOT_DIR/nginx/html"
BACKUP_ROOT="$ROOT_DIR/backups"
STAMP="$(date +%Y%m%d%H%M%S)"
BACKUP_DIR="$BACKUP_ROOT/$STAMP"

if [[ -z "$RELEASE_DIR" || ! -d "$RELEASE_DIR" ]]; then
  echo "[deploy] 缺少前端源码发布目录"
  exit 1
fi
if [[ -z "$DIST_ARCHIVE" || ! -f "$DIST_ARCHIVE" ]]; then
  echo "[deploy] 缺少前端静态包"
  exit 1
fi

mkdir -p "$BACKUP_DIR"

echo "[deploy] 开始替换前端源码目录"
if [[ -d "$REPO_DIR" ]]; then
  mv "$REPO_DIR" "$BACKUP_DIR/frontend-source"
fi
mv "$RELEASE_DIR" "$REPO_DIR"

echo "[deploy] 开始替换 nginx 静态资源目录"
if [[ -d "$HTML_DIR" ]]; then
  mv "$HTML_DIR" "$BACKUP_DIR/nginx-html"
fi
mkdir -p "$HTML_DIR"
unzip -oq "$DIST_ARCHIVE" -d "$HTML_DIR"

echo "[deploy] 确保前端容器使用宿主机静态目录"
python3 - "$COMPOSE_FILE" <<'PY'
from pathlib import Path
import sys

path = Path(sys.argv[1])
text = path.read_text(encoding='utf-8')
volume_line = '      - ./nginx/html:/usr/share/nginx/html:ro\n'
if volume_line in text:
    raise SystemExit(0)

marker = '    ports:\n      - "127.0.0.1:8000:8080"\n'
replacement = marker + '    volumes:\n' + volume_line
if marker not in text:
    raise SystemExit('frontend compose marker not found')

path.write_text(text.replace(marker, replacement, 1), encoding='utf-8')
PY

echo "[deploy] 确保生产 Nginx 允许 300MB 训练视频上传"
python3 - "$ROOT_DIR/nginx/default.conf" "$ROOT_DIR/nginx/host-nginx.conf" "/etc/nginx/nginx.conf" <<'PY'
from pathlib import Path
import re
import sys

for file_name in sys.argv[1:]:
    path = Path(file_name)
    if not path.exists():
        continue
    text = path.read_text(encoding="utf-8")
    if "client_max_body_size" in text:
        new_text = re.sub(r"client_max_body_size\s+\S+;", "client_max_body_size 300m;", text)
    else:
        new_text = text.replace("server_name _;\n", "server_name _;\n\n    client_max_body_size 300m;\n", 1)
    if new_text != text:
        path.write_text(new_text, encoding="utf-8")
PY
if command -v nginx >/dev/null 2>&1; then
  nginx -t && systemctl reload nginx || echo "[deploy] 宿主机 Nginx 未能自动 reload，请手动检查"
fi

echo "[deploy] 开始刷新前端容器"
print_repo_revision "$REPO_DIR"
cd "$ROOT_DIR"
docker compose up -d --no-build --force-recreate frontend
inspect_container_state "director-video-frontend"
echo "[backup] $BACKUP_DIR"
