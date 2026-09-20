#!/usr/bin/env bash
# تشغيل شاشة المواقيت بوضع Kiosk على جهاز لينكس موصول بالتلفاز.
# الاستخدام: bash scripts/kiosk.sh [URL]
set -euo pipefail

URL="${1:-http://localhost:8080}"

# منع اطفاء الشاشة وحافظة الشاشة — الشاشة يجب ان تبقى مضاءة دائما
xset s off || true
xset -dpms || true
xset s noblank || true

# اخفاء مؤشر الفأرة بعد ثانية من السكون
command -v unclutter >/dev/null && unclutter -idle 1 -root &

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
exec "$BROWSER" \
  --kiosk \
  --noerrdialogs \
  --disable-infobars \
  --disable-session-crashed-bubble \
  --disable-features=TranslateUI \
  --autoplay-policy=no-user-gesture-required \
  --check-for-update-interval=31536000 \
  --incognito \
  "$URL"
