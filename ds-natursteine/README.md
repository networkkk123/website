# DS Natursteine — Webseite mit Admin-Dashboard

Eine vollständige Webseite mit einem privaten, passwortgeschützten Admin-Bereich,
in dem Sie selbst Produkte, Portfolio-Fotos und Bewertungen verwalten können —
ganz ohne Programmierkenntnisse. Besucher kontaktieren Sie per WhatsApp oder
über ein Kontaktformular, das Ihnen eine E-Mail schickt. Es gibt keinen
Warenkorb und keine Online-Zahlung — das ist Absicht.

## Was ist enthalten?

- Öffentliche Webseite (Produkte, Portfolio, Bewertungen, Kontaktformular)
- Privater Admin-Bereich unter `/admin` zum Verwalten aller Inhalte
- Kontaktformular, das Ihnen eine E-Mail schickt (über Ihr eigenes E-Mail-Konto)
- WhatsApp-Buttons an mehreren Stellen
- Speicherung in einer einfachen Datei (keine komplizierte Datenbank-Installation nötig)

## Schritt 1 — Lokal testen (optional, aber empfohlen)

Sie brauchen [Node.js](https://nodejs.org) (Version 18 oder neuer).

```bash
npm install
cp .env.example .env
npm run hash-password
```

Das letzte Kommando fragt nach einem Passwort und gibt Ihnen eine Zeile wie
`ADMIN_PASSWORD_HASH=...` aus. Fügen Sie diese in Ihre `.env`-Datei ein, dazu
einen `ADMIN_USERNAME` Ihrer Wahl. Dann:

```bash
npm start
```

Die Seite läuft jetzt unter `http://localhost:3000`, der Admin-Bereich unter
`http://localhost:3000/admin`.

## Schritt 2 — Hosting einrichten

**Empfehlung: [Render](https://render.com)** — einfach, zuverlässig, unterstützt
Node.js direkt, und Sie können diesem Projekt eine "Festplatte" (Persistent
Disk) zuweisen, damit Ihre Produkte, Fotos und Bewertungen auch nach einem
Neustart erhalten bleiben. Kosten: ab ca. 7 $/Monat für einen "Starter"-Webdienst
plus ca. 1 $/Monat für 1 GB Speicherplatz. (Andere Anbieter wie Railway oder ein
eigener Server funktionieren ebenso — wichtig ist nur: Node.js-Unterstützung
und ein dauerhafter Speicherort für Dateien.)

So geht's bei Render:

1. Erstellen Sie ein kostenloses Konto auf render.com.
2. Laden Sie dieses Projekt zu einem **GitHub-Repository** hoch (Render zieht
   den Code von dort). Falls Sie GitHub nicht kennen: Render zeigt beim
   Erstellen eines neuen "Web Service" eine Anleitung dafür.
3. In Render: **New → Blueprint**, und wählen Sie Ihr Repository. Render
   erkennt automatisch die Datei `render.yaml` in diesem Projekt und richtet
   den Webdienst inklusive Festplatte korrekt ein.
   (Alternativ ohne Blueprint: **New → Web Service**, Build-Befehl `npm install`,
   Start-Befehl `npm start`, und unter "Disks" manuell eine 1 GB-Festplatte
   mit Mount-Pfad `/var/data` hinzufügen.)
4. Tragen Sie unter **Environment** diese Variablen ein (siehe `.env.example`
   für Erklärungen):
   - `ADMIN_USERNAME` und `ADMIN_PASSWORD_HASH` (mit `npm run hash-password`
     lokal erzeugt)
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` (siehe Schritt 3)
   - `SESSION_SECRET` (bei Verwendung der Blueprint-Datei wird das automatisch generiert)
5. Render baut und startet die Seite. Sie erhalten eine Adresse wie
   `ds-natursteine.onrender.com`.
6. **Eigene Domain verbinden:** In den Render-Einstellungen unter "Custom
   Domains" Ihre Domain (z. B. dsnaturstein.de) eintragen und die DNS-Einträge
   bei Ihrem Domain-Anbieter entsprechend setzen.

## Schritt 3 — E-Mail-Versand für das Kontaktformular

Das Kontaktformular verschickt E-Mails über ein normales E-Mail-Konto, das
Sie bereits besitzen — es muss kein neuer Dienst angelegt werden.

**Mit Gmail:**
1. Zweistufige Bestätigung in Ihrem Google-Konto aktivieren (falls noch nicht
   geschehen).
2. Ein "App-Passwort" erstellen: https://myaccount.google.com/apppasswords
3. In den Umgebungsvariablen setzen:
   - `SMTP_HOST=smtp.gmail.com`
   - `SMTP_PORT=587`
   - `SMTP_USER=ihre@gmail.com`
   - `SMTP_PASS=` (das App-Passwort, NICHT Ihr normales Passwort)

**Mit GMX, Web.de, IONOS oder Outlook:** funktioniert genauso — die
SMTP-Adresse Ihres Anbieters finden Sie über eine kurze Suche nach
"[Anbieter] SMTP Einstellungen".

Solange `SMTP_HOST` nicht gesetzt ist, funktioniert die Seite weiterhin —
Anfragen werden dann nur in den Server-Protokollen vermerkt, aber nicht
per E-Mail verschickt. Praktisch zum Testen, aber vor dem echten Start
unbedingt einrichten.

## Schritt 4 — Inhalte eintragen

Nach dem ersten Login unter `/admin` (mit dem Benutzernamen/Passwort aus
Schritt 1):

1. Gehen Sie zu **Einstellungen** und tragen Sie Ihre echte WhatsApp-Nummer,
   E-Mail-Adresse, Öffnungszeiten und Social-Media-Links ein.
2. Laden Sie unter **Portfolio** Ihre eigenen Projektfotos hoch — diese
   ersetzen dann die Start-Beispielfotos.
3. Passen Sie unter **Produkte** Preise und Beschreibungen an.
4. Tragen Sie unter **Bewertungen** echte Kundenstimmen ein.

Die Start-Fotos (Produkte, Portfolio, Hero-Bild) zeigen vorerst auf Fotos von
Ihrer alten Webseite, damit die Seite nicht leer aussieht. Sobald Sie eigene
Fotos hochladen, werden diese direkt von Ihrem eigenen Server ausgeliefert —
zuverlässiger und unabhängig von der alten Webseite.

## Sicherheit

- Ändern Sie das Admin-Passwort sofort nach dem ersten Login-Test
  (`npm run hash-password` erneut ausführen, neuen Hash in die
  Umgebungsvariablen eintragen).
- Die `.env`-Datei (bzw. die Umgebungsvariablen bei Render) niemals mit
  anderen teilen oder öffentlich in GitHub hochladen — `.gitignore` schließt
  `.env` standardmäßig aus.
- Es gibt nur einen Admin-Zugang. Falls mehrere Personen Zugriff brauchen,
  am besten ein gemeinsames, aber sicheres Passwort verwenden und bei
  Bedarf melden, dann kann das System um mehrere Konten erweitert werden.

## Projektstruktur

```
server.js              Startpunkt des Servers
routes/public.js        Startseite & Kontaktformular
routes/admin.js          Admin-Login & Verwaltung
middleware/auth.js       Login-Schutz für den Admin-Bereich
middleware/upload.js     Bild-Uploads
db/store.js               Speicherung (einfache JSON-Datei statt SQL-Datenbank)
utils/mailer.js           E-Mail-Versand für das Kontaktformular
views/                      Seitenvorlagen (öffentlich & Admin)
public/                    CSS, JavaScript, hochgeladene Bilder
```
