#!/usr/bin/env bash
set -u
url="https://pring-pongas-3pevo3oco-caioalves.vercel.app"
for i in $(seq 1 36); do
  body=$(curl -L -sS --max-time 10 "$url" || true)
  title=$(printf '%s' "$body" | grep -o '<title>[^<]*</title>' | head -1 || true)
  echo "attempt=$i title=$title"
  if printf '%s' "$body" | grep -q '<title>Pring Pongas</title>'; then exit 0; fi
  sleep 10
done
exit 1
