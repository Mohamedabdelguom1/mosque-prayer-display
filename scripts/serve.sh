#!/usr/bin/env bash
# يخدم مجلد dist محليا. لا يحتاج انترنت ولا حزما اضافية.
# الاستخدام: bash scripts/serve.sh [PORT]
set -euo pipefail

PORT="${1:-8080}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)/dist"

if [ ! -f "$ROOT/index.html" ]; then
  echo "مجلد dist غير موجود. شغّل اولا: npm run build" >&2
  exit 1
fi

cd "$ROOT"
exec python3 -m http.server "$PORT" --bind 127.0.0.1
