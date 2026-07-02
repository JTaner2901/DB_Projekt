// server.js
// ------------------------------------------------------------
// Die REST-API: nimmt Anfragen von Angular entgegen, spricht mit
// der Datenbank und antwortet mit JSON.
// ------------------------------------------------------------

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();
app.use(cors());
app.use(express.json()); // wichtig fuer POST: liest JSON aus dem Request-Body

const PORT = process.env.PORT || 3000;

// ---- Test-Endpunkt ----
app.get('/', (req, res) => {
  res.send('Capture Frames API läuft ✔');
});

// ============================================================
//  LESEN
// ============================================================

// Alle Kategorien
app.get('/api/categories', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Kategorie ORDER BY Name');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Datenbankfehler' });
  }
});

// Alle Fotos (mit Name des Fotografen)
app.get('/api/photos', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.photo_Id, p.Titel, p.Beschreibung, p.Datum, p.Location,
             b.Benutzername
      FROM Photo p
      JOIN Benutzer b ON p.user_Id = b.user_Id
      ORDER BY p.Datum DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Datenbankfehler' });
  }
});

// ============================================================
//  SCHREIBEN
// ============================================================

// Ein neues Foto hochladen (Metadaten + optional Einstellungen + Kategorien).
// Erwartet JSON im Body, z.B.:
// {
//   "user_Id": 1, "Kamera_Id": 1, "Titel": "...", "Beschreibung": "...",
//   "Datum": "2026-02-10", "Location": "Bremen",
//   "kategorien": [1, 3],
//   "einstellungen": { "Blende": 1.8, "Shutterspeed": "1/250", "ISO": 100,
//                      "Brennweite": 50, "Aufloesung": "6000x4000", "Objektiv": "50mm" }
// }
app.post('/api/photos', async (req, res) => {
  const {
    user_Id, Kamera_Id, Titel, Beschreibung, Datum, Location,
    kategorien, einstellungen,
  } = req.body;

  // Einfache Validierung der Pflichtfelder ("prüfen" aus der Aufgabe)
  if (!user_Id || !Titel || !Datum) {
    return res.status(400).json({ error: 'user_Id, Titel und Datum sind Pflicht' });
  }

  // Eine Verbindung aus dem Pool holen, um darauf eine Transaktion zu fahren
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction(); // ab hier: alles oder nichts

    // 1) Das Foto selbst einfügen
    const [result] = await conn.query(
      `INSERT INTO Photo (user_Id, Kamera_Id, Titel, Beschreibung, Datum, Location)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [user_Id, Kamera_Id || null, Titel, Beschreibung || null, Datum, Location || null]
    );
    const photoId = result.insertId; // die von MySQL vergebene neue photo_Id

    // 2) Kameraeinstellungen (falls mitgeschickt)
    if (einstellungen) {
      const e = einstellungen;
      await conn.query(
        `INSERT INTO Kamera_Einstellungen
           (Photo_Id, Blende, Shutterspeed, ISO, Brennweite, Aufloesung, Objektiv)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [photoId, e.Blende || null, e.Shutterspeed || null, e.ISO || null,
         e.Brennweite || null, e.Aufloesung || null, e.Objektiv || null]
      );
    }

    // 3) Kategorien verknüpfen (M:N über die Verbindungstabelle)
    if (Array.isArray(kategorien)) {
      for (const katId of kategorien) {
        await conn.query(
          'INSERT INTO Photo_Kategorie (photo_Id, KategorieID) VALUES (?, ?)',
          [photoId, katId]
        );
      }
    }

    await conn.commit(); // alles hat geklappt -> dauerhaft speichern
    res.status(201).json({ photo_Id: photoId, message: 'Foto gespeichert' });
  } catch (err) {
    await conn.rollback(); // irgendwas ging schief -> alles zurücknehmen
    console.error(err);
    res.status(500).json({ error: 'Speichern fehlgeschlagen' });
  } finally {
    conn.release(); // Verbindung immer zurück in den Pool geben
  }
});

// ---- Server starten ----
app.listen(PORT, () => {
  console.log(`Backend läuft auf http://localhost:${PORT}`);
});