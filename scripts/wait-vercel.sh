#!/usr/bin/env bash
set -u
url="https://pring-pongas-korma7exd-caioalves.vercel.app"
for i in $(seq 1 30); do
  code=$(curl -L -sS -o /tmp/pring-pongas-vercel.html -w '%{http_code}' --max-time 10 "$url" || true)
  echo "attempt=$i http=$code"
  if [ "$code" = "200" ]; then
    grep -o "Pring Pongas" /tmp/pring-pongas-vercel.html | head -1 || true
    exit 0
  fi
  sleep 10
done
exit 1
