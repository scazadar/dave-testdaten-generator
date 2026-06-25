#!/bin/sh
# Seedet die DAVe-Sample-Daten in Postgres, nachdem das dave-backend healthy ist
# (= Flyway-Migration abgeschlossen, Tabellen existieren). Ausgeführt vom Service
# "sample-seed" in compose.dave-stack.yml.
#
# Quelle: /seed/sample-data.sql (Kopie der image-internen sample-data.sql, passend
# zur ES-Zählstelle 92301). Enthält Zeitintervalle, PKW-Einheiten und
# Hochrechnungsfaktoren. Ohne diesen Seed liefert u.a. /pkw-einheit/latest 404.
#
# Die SQL nutzt unqualifizierte Tabellennamen -> search_path via PGOPTIONS auf
# das DAVe-Schema dave_ng setzen. Da die Datensätze feste IDs ohne ON CONFLICT
# haben, wird nur geseedet, wenn die Tabelle noch leer ist (idempotent über
# Neustarts hinweg).
set -e
export PGPASSWORD="${PGPASSWORD:-1234}"
PSQL="psql -h postgres -U dave -d dave-db -v ON_ERROR_STOP=1"

CNT=$($PSQL -tAc "SELECT count(*) FROM dave_ng.zeitintervall" | tr -d '[:space:]')
if [ "$CNT" = "0" ]; then
  echo "Seede Sample-Daten (Zeitintervalle / PKW-Einheiten / Hochrechnungsfaktoren)..."
  PGOPTIONS="-c search_path=dave_ng" $PSQL -f /seed/sample-data.sql
  echo "Sample-Daten geseedet."
else
  echo "Daten bereits vorhanden (zeitintervall=$CNT) - Seed uebersprungen."
fi
