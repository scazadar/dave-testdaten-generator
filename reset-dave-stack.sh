#!/usr/bin/env bash
#
# Setzt den DAVe-Sample-Stack komplett zurück und baut ihn frisch auf:
#   1. Stoppt den Stack und löscht ALLE Volumes (Elasticsearch + Postgres).
#   2. Startet Infrastruktur + Testdaten-Generator.
#   3. Trägt den (neu erzeugten) Elasticsearch-Zertifikat-Fingerprint in
#      ../dave-backend/stack/.env ein.
#   4. Legt den Elasticsearch-Index "zaehlstelle-ng" an (für Flyway-Migration V12).
#   5. Startet Backend, Frontend und Portale (Profil sample-stack) inkl. Seed.
#   6. Wartet auf den Sample-Seed und verifiziert das Ergebnis.
#
# Aufruf:  ./reset-dave-stack.sh
#
# Achtung: Schritt 1 löscht alle lokalen DAVe-Daten unwiderruflich.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE=(docker compose -f "$SCRIPT_DIR/compose.dave-stack.yml")
STACK_ENV="$SCRIPT_DIR/../dave-backend/stack/.env"
ES_URL="https://localhost:9200"
ES_AUTH="elastic:changeme"

log()  { printf '\n\033[1;36m==> %s\033[0m\n' "$1"; }
fail() { printf '\033[1;31mFEHLER: %s\033[0m\n' "$1" >&2; exit 1; }

wait_healthy() {
  local name="$1" tries="${2:-60}"
  for _ in $(seq 1 "$tries"); do
    [ "$(docker inspect -f '{{.State.Health.Status}}' "$name" 2>/dev/null)" = "healthy" ] && return 0
    sleep 3
  done
  fail "$name wurde nicht healthy"
}

log "1/6  Stack stoppen + alle Volumes löschen"
"${COMPOSE[@]}" --profile sample-stack down -v

log "2/6  Infrastruktur + Generator starten"
"${COMPOSE[@]}" up -d
wait_healthy elastic

log "3/6  ES-Zertifikat-Fingerprint in .env eintragen"
FP=$(docker exec elastic openssl x509 -noout -fingerprint -sha256 \
       -in config/certs/elastic/elastic.crt | sed 's/.*=//; s/://g')
[ -n "$FP" ] || fail "Fingerprint konnte nicht ermittelt werden"
sed -i "s/^ELASTICSEARCH_CERT_FINGERPRINT=.*/ELASTICSEARCH_CERT_FINGERPRINT=$FP/" "$STACK_ENV"
echo "Fingerprint: $FP"

log "4/6  Elasticsearch-Index zaehlstelle-ng anlegen"
curl -ks -u "$ES_AUTH" -X PUT "$ES_URL/zaehlstelle-ng" >/dev/null && echo "ok"

log "5/6  Backend, Frontend, Portale + Sample-Seed starten"
"${COMPOSE[@]}" --profile sample-stack up -d
wait_healthy dave-backend 80

log "6/6  Auf Sample-Seed warten und verifizieren"
docker wait dave-sample-seed >/dev/null 2>&1 || true
docker logs dave-sample-seed 2>&1 | tail -3
ZI=$(docker exec postgres psql -U dave -d dave-db -tAc \
       "SELECT count(*) FROM dave_ng.zeitintervall" | tr -d '[:space:]')
PKW=$(curl -s -o /dev/null -w '%{http_code}' \
       http://localhost:8083/api/dave-backend-service/pkw-einheit/latest)
echo "Zeitintervalle: ${ZI:-0}   /pkw-einheit/latest: HTTP $PKW"
[ "$PKW" = "200" ] || fail "/pkw-einheit/latest liefert HTTP $PKW (erwartet 200)"

log "Fertig ✔   Frontend :8082  Generator :8090  Admin :8083  Selfservice :8084"
