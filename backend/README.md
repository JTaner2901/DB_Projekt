# Capture Frames – Backend (REST-API)

Node.js + Express + MySQL. Verbindet die MySQL-Datenbank mit dem Angular-Frontend.

## Einrichten

```bash
cd backend
npm install
```

Dann die Zugangsdaten anlegen:

```bash
cp .env.example .env
```

In der `.env` das MySQL-Passwort (und ggf. den Benutzer) eintragen.

## Starten

```bash
npm run dev      # startet neu bei jeder Änderung
# oder
npm start
```

Danach im Browser testen: <http://localhost:3000/api/categories>

## Endpunkte

- `GET /api/categories` – alle Kategorien
- `GET /api/photos` – alle Fotos mit Fotografen-Namen

## Hinweis

Die Datei `.env` enthält das Passwort und wird **nicht** ins Repo hochgeladen.
