# DAVe Testdaten-Generator

Webanwendung zum Erzeugen von **DAVe-Zähldaten-Testdateien (CSV)** für den Upload
in das DAVe-Datenportal. Man wählt die Zählstelle, die Zählart und konfiguriert
pro Fahrzeugkategorie (Pkw/Auto, Lkw, Lz, Bus, Krad, Rad, Fuß), wie die Zählwerte
je 15-Minuten-Intervall erzeugt werden.

Aufgebaut auf Basis der **it@M RefArch-Frontend-Vorlage**
([refarch-templates](https://github.com/it-at-m/refarch-templates)):
Vue 3 + Vuetify 3 + Pinia + vue-router + TypeScript + Vite + Vitest – analog zum
bestehenden `dave-frontend`.

## Funktionen

- **Zählstelle & Zählung**: Zählstellennummer, Zählart (alle 16 DAVe-Zählarten),
  Datum, Knotenarmnummer (1–8).
- **Zeitbereich**: frei wählbarer Intervallbereich (1–96) mit Presets
  (24h / 16h / 13h / 4h).
- **Segmente**: Pro Zählart werden die Felder `nach` (Zielknotenarm),
  `Strassenseite` und `Richtung` automatisch ein-/ausgeblendet und befüllt –
  gemäß [CSV-Spezifikation](https://github.com/it-at-m/dave/blob/main/docs/src/de/documentation-csv-for-upload.md).
  Jedes Segment erzeugt einen eigenen Block mit Intervallzeilen.
- **Werte je Kategorie** – vier Modi:
  - **Nicht gezählt** → Spalte bleibt leer
  - **Fester Wert** → konstanter Wert je Intervall
  - **Zufall (min–max)** → Zufallswert je Intervall
  - **Tageskurve** → realistischer Tagesverlauf (Morgen-/Abendspitze),
    skaliert auf einen Spitzenwert
- **Vorschau, Download** (`<Zählstelle>_<Datum>_Knotenarm_<Nr>.csv`),
  Kopieren in die Zwischenablage und optionales UTF-8 BOM.

## Erzeugtes Format

Semikolon-getrennt, UTF-8, LF-Zeilenenden:

```csv
Zählstellennummer;Zählart;Datum;Knotenarmnummer;;;;;;;
111310;FJS;2026-03-13;1;;;;;;;
Intervallnummer;nach;Strassenseite;Richtung;Pkw;Lkw;Lz;Bus;Krad;Rad;Fuss
1;;O;EIN;;;;;;5;7
...
```

Feldlogik je Zählart (`src/types/Zaehlart.ts`):

| Zählart        | nach            | Strassenseite | Richtung          |
| -------------- | --------------- | ------------- | ----------------- |
| FJS            | –               | Himmelsricht. | EIN/AUS           |
| QU             | –               | –             | Himmelsrichtung   |
| QJS            | Zielknotenarm   | Himmelsricht. | –                 |
| alle übrigen   | Zielknotenarm   | –             | –                 |

## Entwicklung

```bash
npm install
npm run dev          # Dev-Server auf http://localhost:8090
npm run test:unit    # Unit-Tests (Vitest)
npm run build        # Produktionsbuild
```

## Docker

Eigenständiger Betrieb (Multi-Stage-Build → nginx, Port 8090):

```bash
docker compose up --build -d        # → http://localhost:8090
docker compose down
```

### Kombiniert mit dem DAVe-Stack

`compose.dave-stack.yml` bindet den offiziellen DAVe-Stack
(`../dave-backend/stack/docker-compose.yml`) via `include` ein und ergänzt den
Generator. Aus diesem Verzeichnis:

```bash
# Infrastruktur (Elasticsearch, Kibana, Postgres, pgAdmin) + Generator:
docker compose -f compose.dave-stack.yml up -d

# zusätzlich DAVe-Backend + -Frontend mit Beispieldaten:
docker compose -f compose.dave-stack.yml --profile sample-stack up -d
```

| Dienst              | URL                     | Profil        |
| ------------------- | ----------------------- | ------------- |
| Testdaten-Generator | http://localhost:8090   | (immer)       |
| DAVe-Frontend (UI)  | http://localhost:8082   | sample-stack  |
| DAVe-Backend        | http://localhost:50001  | sample-stack  |
| Kibana              | http://localhost:5601   | (immer)       |
| pgAdmin             | http://localhost:5050   | (immer)       |

> **Hinweis:** Das DAVe-Backend braucht den Fingerprint des
> Elasticsearch-Zertifikats. Daher ist der volle Stack zweiphasig zu starten:
> erst Infrastruktur hochfahren, dann den Fingerprint per
> `docker exec elastic openssl x509 -noout -fingerprint -sha256 -in config/certs/elastic/elastic.crt`
> ermitteln, in `../dave-backend/stack/.env` als `ELASTICSEARCH_CERT_FINGERPRINT`
> (ohne Doppelpunkte) eintragen und anschließend mit `--profile sample-stack`
> starten. Der Generator selbst ist unabhängig davon nutzbar.

## Projektstruktur

```
src/
  components/generator/   # Formular-Bausteine (Zählstelle, Zeitbereich, Segmente, Kategorien)
  views/HomeView.vue      # Komposition + Vorschau/Download
  store/GeneratorStore.ts # Pinia-State der Konfiguration
  types/                  # Zaehlart, GeneratorConfig
  util/                   # csvGenerator, intervals, valueProfiles, download
  plugins/                # vuetify, pinia, router (RefArch-Konvention)
```
# dave-testdaten-generator
# dave-testdaten-generator
