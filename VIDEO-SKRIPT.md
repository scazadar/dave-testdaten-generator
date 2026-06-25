# Video-Skript: DAVe Testdaten-Generator (≈ 3 Minuten)

Format: Screencast mit Sprecher-Voiceover. Spalten: **Zeit | Bild/Aktion | Sprechertext**.
Vorbereitung: Stack läuft (`./reset-dave-stack.sh`), Browser-Tabs offen auf
:8090 (Generator), :8083 (Admin-Portal), :8084 (Selfservice-Portal).

---

## 0:00 – 0:25 · Intro & Problem
**Bild:** Titelkarte „DAVe Testdaten-Generator", dann kurzer Schwenk über das DAVe-Datenportal.
**Sprecher:**
> „DAVe ist das Verkehrszähldaten-Portal der Stadt München. Wer das System testen oder
> entwickeln will, braucht realistische Zähldaten – und genau die von Hand zu erzeugen ist
> mühsam und fehleranfällig. Dafür gibt es jetzt den Testdaten-Generator."

## 0:25 – 0:50 · Was ist das Tool?
**Bild:** Startseite des Generators (http://localhost:8090).
**Sprecher:**
> „Eine schlanke Vue-3-Anwendung. Man wählt Zählstelle, Zählart, Datum und Knotenarm,
> legt je Fahrzeugkategorie fest, wie gezählt wird – fester Wert, Zufall oder eine
> realistische Tageskurve – und erhält fertige Zähldaten. Alle 16 DAVe-Zählarten werden
> unterstützt."

## 0:50 – 1:30 · Konfiguration (Live-Demo)
**Bild:** Formular ausfüllen: Zählstellennummer eingeben, Zählart „Standardzählung",
Datum wählen; bei den Kategorien Pkw auf „Tageskurve", Lkw auf „fest", Rad auf „Zufall"
stellen. Live-Vorschau der CSV rechts zeigen.
**Sprecher:**
> „Ich lege eine neue Zählung an: Zählstellennummer, Zählart, Datum. Für die Pkw nehme ich
> eine Tageskurve mit morgendlicher und abendlicher Spitze, Lkw ein fester Wert, Radverkehr
> zufällig. Die Vorschau zeigt sofort die generierte CSV – im exakten DAVe-Upload-Format:
> Semikolon-getrennt, mit den zwei Metazeilen und 96 Viertelstunden-Intervallen."

## 1:30 – 2:05 · Direkt an DAVe senden (Kern-Feature)
**Bild:** Button **„An DAVe senden"** klicken → Erfolgs-Alert mit Zählstellennummer/Zählung-ID.
**Sprecher:**
> „Statt die CSV manuell hochzuladen, kann das Tool die Daten direkt ans DAVe-Backend
> schicken. Ein Klick auf ‚An DAVe senden' legt Zählstelle und Zählung an – die Daten landen
> sofort in Elasticsearch und Postgres."

## 2:05 – 2:35 · Ergebnis in den Portalen
**Bild:** Ins Admin-Portal (:8083) wechseln, Suche/Karte zeigt die neue Zählung; kurz ins
Selfservice-Portal (:8084).
**Sprecher:**
> „Und genau so taucht die Zählung als offene Zählung im Admin-Portal und im
> Selfservice-Portal auf – mit den Zeitreihen, die wir eben generiert haben. Kein Umweg über
> Dateien, kein manueller Import."

## 2:35 – 2:55 · Stack & Reproduzierbarkeit
**Bild:** Terminal: `./reset-dave-stack.sh` anstoßen, kurz die hochfahrenden Container zeigen.
**Sprecher:**
> „Das Ganze läuft als Docker-Stack: Generator, DAVe-Backend, beide Portale plus
> Infrastruktur. Ein einziges Skript setzt die Datenbank zurück, baut alles neu auf und
> spielt Beispieldaten ein – reproduzierbar in einem Befehl."

## 2:55 – 3:00 · Outro
**Bild:** Titelkarte mit den URLs (Generator :8090, Admin :8083, Selfservice :8084).
**Sprecher:**
> „Der DAVe Testdaten-Generator – Testdaten in Sekunden statt Stunden."

---

### Aufnahme-Tipps
- 1080p, Browser auf ~125 % Zoom für Lesbarkeit.
- Mauszeiger-Hervorhebung für Klicks aktivieren.
- Sprechtempo ~150 Wörter/Min → der Text passt in die Zeitfenster.
- Optional Hintergrundmusik dezent (-25 dB) unter dem Voiceover.
