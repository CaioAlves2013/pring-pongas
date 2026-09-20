#!/usr/bin/env bash
set -u
url="https://pring-pongas-8437pl6kq-caioalves.vercel.app"
for i in $(seq 1 36); do
  body=$(curl -L -sS --max-time 10 "$url" || true)
  code=$(printf '%s' "$body" | grep -o '<title>[^<]*</title>' | head -1 || true)
  echo "attempt=$i title=$code"
  if printf '%s' "$body" | grep -q '<title>Pring Pongas</title>'; then
    exit 0
  fi
  sleep 10
done
exit 1
