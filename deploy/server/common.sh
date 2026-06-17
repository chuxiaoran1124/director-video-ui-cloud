#!/usr/bin/env bash
set -euo pipefail

compose_up_services() {
  local compose_dir="$1"
  shift
  cd "$compose_dir"
  docker compose up -d --build "$@"
  docker compose ps "$@"
}

print_repo_revision() {
  local repo_dir="$1"
  cd "$repo_dir"
  echo "[git] branch=$(git branch --show-current || true)"
  echo "[git] commit=$(git rev-parse --short HEAD)"
}

inspect_container_state() {
  local container_name="$1"
  if ! docker inspect "$container_name" >/dev/null 2>&1; then
    echo "[health] 容器不存在: $container_name"
    return 1
  fi

  local state
  state="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$container_name")"
  echo "[health] $container_name => $state"
}

expect_http_code() {
  local url="$1"
  shift
  local expected_codes=("$@")
  local response_file
  response_file="$(mktemp)"

  local http_code
  http_code="$(curl -ksS -o "$response_file" -w '%{http_code}' "$url" || true)"

  for expected in "${expected_codes[@]}"; do
    if [[ "$http_code" == "$expected" ]]; then
      echo "[health] $url => $http_code"
      rm -f "$response_file"
      return 0
    fi
  done

  echo "[health] $url => $http_code"
  cat "$response_file" || true
  rm -f "$response_file"
  return 1
}
