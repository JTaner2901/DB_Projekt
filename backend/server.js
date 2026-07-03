// server.js
// ------------------------------------------------------------
// Die REST-API: nimmt Anfragen von Angular entgegen, spricht mit
// der Datenbank und antwortet mit JSON.
// ------------------------------------------------------------

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db');
const multer = require('multer');
const path = require('path');

// Multer-Konfiguration: WOHIN und WIE Dateien gespeichert werden
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

const app = express();
app.use(cors());
app.use(express.json()); // wichtig fuer POST: liest JSON aus dem Request-Body
app.use('/uploads', express.static('uploads'));
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
      SELECT p.photo_Id, p.Titel, p.Beschreibung, p.Datum, p.Location, p.Bildpfad,
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

// Genau ein Foto mit Details auslesen
app.get('/api/photos/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(`
        SELECT p.photo_Id, p.Titel, p.Beschreibung, p.Datum, p.Location, p.Bildpfad,
               b.Benutzername       
        FROM Photo p  
        JOIN Benutzer b ON p.user_Id = b.user_Id
        WHERE p.photo_Id = ?
    `, [req.params.id]);
    
    // Wir senden nur das erste Ergebnis (das gesuchte Foto) zurück
    res.json(rows[0]); 
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Datenbankfehler' });
  }
});

//ein Foto für Profilseite eines nutzers | persönliches Album eines bestimmten Nutzers

app.get('/api/users/:id/photos', async (req, res) => {
  try {
    const [rows] = await pool.query(`
        SELECT p.photo_Id, p.Titel, p.Beschreibung, p.Datum, p.Location,
               b.Benutzername       
        FROM Photo p  
        JOIN Benutzer b ON p.user_Id = b.user_Id
        WHERE p.user_Id = ? 
    `, [req.params.id]);
    
    // Wir senden das komplette Array (alle Fotos dieses Users) zurück
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
app.post('/api/photos', upload.single('bild'), async (req, res) => {   // ← Zeile 1: geändert
  const { user_Id, Kamera_Id, Titel, Beschreibung, Datum, Location } = req.body;  // ← Zeile 2: gekürzt

  const bildpfad = req.file ? req.file.path : null;                              // ← NEU
  const kategorien = req.body.kategorien ? JSON.parse(req.body.kategorien) : [];  // ← NEU (ersetzt altes kategorien aus req.body)
  const einstellungen = req.body.einstellungen ? JSON.parse(req.body.einstellungen) : null; // ← NEU

  if (!user_Id || !Titel || !Datum) {
    return res.status(400).json({ error: 'user_Id, Titel und Datum sind Pflicht' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.query(
      `INSERT INTO Photo (user_Id, Kamera_Id, Titel, Beschreibung, Datum, Location, Bildpfad)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [user_Id, Kamera_Id || null, Titel, Beschreibung || null, Datum, Location || null, bildpfad]
    );
    const photoId = result.insertId;

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