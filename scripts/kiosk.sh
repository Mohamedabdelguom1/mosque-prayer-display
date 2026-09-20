#!/usr/bin/env bash
# تشغيل شاشة المواقيت بوضع Kiosk على جهاز لينكس موصول بالتلفاز.
# الاستخدام: bash scripts/kiosk.sh [URL]
set -euo pipefail

URL="${1:-http://localhost:8080}"

# ننتظر خادم الملفات فقد يبدأ المتصفح قبله عند الاقلاع
HOSTPORT="${URL#*://}"
HOSTPORT="${HOSTPORT%%/*}"
HOST="${HOSTPORT%%:*}"
PORT="${HOSTPORT##*:}"
[ "$PORT" = "$HOST" ] && PORT=80

for _ in $(seq 1 60); do
  if (exec 3<>"/dev/tcp/$HOST/$PORT") 2>/dev/null; then
    exec 3>&- 2>/dev/null || true
    break
  fi
  sleep 1
done

# منع اطفاء الشاشة وحافظة الشاشة — الشاشة يجب ان تبقى مضاءة دائما
xset s off || true
xset -dpms || true
xset s noblank || true

# اخفاء مؤشر الفأرة بعد ثانية من السكون
if command -v unclutter >/dev/null; then
  unclutter -idle 1 -root &
fi

# اختيار المتصفح المتاح
BROWSER=""
for candidate in chromium-browser chromium google-chrome; do
  if command -v "$candidate" >/dev/null; then BROWSER="$candidate"; break; fi
done
if [ -z "$BROWSER" ]; then
  echo "لم يُعثر على متصفح Chromium. ثبّته بـ: sudo apt install chromium-browser" >&2
  exit 1
fi

# --autoplay-policy يسمح بتشغيل الاذان بلا تفاعل مسبق
exec "$BROWSER"   --kiosk   --noerrdialogs   --disable-infobars   --disable-session-crashed-bubble   --disable-features=TranslateUI   --autoplay-policy=no-user-gesture-required   --check-for-update-interval=31536000   --incognito   "$URL"
