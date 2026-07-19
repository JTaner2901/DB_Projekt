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
  const bcrypt = require('bcrypt');
  const { WebSocketServer } = require('ws');

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

  // Genau ein Foto mit ALLEN Details auslesen (Kamera, Einstellungen, Kategorien)
  app.get('/api/photos/:id', async (req, res) => {
    try {
      const [rows] = await pool.query(`
          SELECT p.photo_Id, p.Titel, p.Beschreibung, p.Datum, p.Location, p.Bildpfad,
                b.Benutzername,
                k.Hersteller, k.Modell,
                ke.Blende, ke.Shutterspeed, ke.ISO, ke.Brennweite, ke.Aufloesung, ke.Objektiv
          FROM Photo p
          JOIN Benutzer b ON p.user_Id = b.user_Id
          LEFT JOIN Kamera k ON p.Kamera_Id = k.Kamera_Id
          LEFT JOIN Kamera_Einstellungen ke ON p.photo_Id = ke.Photo_Id
          WHERE p.photo_Id = ?
      `, [req.params.id]);

      if (!rows[0]) {
        return res.status(404).json({ error: 'Foto nicht gefunden' });
      }

      const foto = rows[0];

      // Kategorien separat holen (bei mehreren Kategorien pro Foto würde ein
      // direkter JOIN die Zeile sonst vervielfachen)
      const [kategorien] = await pool.query(`
        SELECT kat.Name
        FROM Kategorie kat
        JOIN Photo_Kategorie pk ON kat.KategorieID = pk.KategorieID
        WHERE pk.photo_Id = ?
      `, [req.params.id]);

      foto.Kategorien = kategorien.map(k => k.Name);

      res.json(foto);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Datenbankfehler' });
    }
  });

  // Ein Benutzerprofil auslesen (ohne Passwort!)
  app.get('/api/users/:id', async (req, res) => {
    try {
      const [rows] = await pool.query(
        `SELECT user_Id, Benutzername, Email, Location, Profilbild, Beschreibung, Registrierungsdatum
        FROM Benutzer WHERE user_Id = ?`,
        [req.params.id]
      );
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Benutzer nicht gefunden' });
      }
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
  app.post('/api/photos', upload.single('bild'), async (req, res) => {
    const { user_Id, Kamera_Id, Titel, Beschreibung, Datum, Location } = req.body;

    const bildpfad = req.file ? req.file.path : null;
    const kategorien = req.body.kategorien ? JSON.parse(req.body.kategorien) : [];
    const einstellungen = req.body.einstellungen ? JSON.parse(req.body.einstellungen) : null;

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

  // ============================================================
  //  AUTHENTIFIZIERUNG
  // ============================================================

  app.post('/api/auth/register', async (req, res) => {
    const { Email, Benutzername, Passwort, Location } = req.body;

    if (!Email || !Benutzername || !Passwort) {
      return res.status(400).json({ error: 'Email, Benutzername und Passwort sind Pflicht' });
    }

    try {
      const passwortHash = await bcrypt.hash(Passwort, 10);

      const [result] = await pool.query(
        `INSERT INTO Benutzer (Email, Benutzername, Passwort, Location, Registrierungsdatum)
        VALUES (?, ?, ?, ?, CURDATE())`,
        [Email, Benutzername, passwortHash, Location || null]
      );

      res.status(201).json({ user_Id: result.insertId, message: 'Registrierung erfolgreich' });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'Diese Email ist bereits registriert' });
      }
      console.error(err);
      res.status(500).json({ error: 'Registrierung fehlgeschlagen' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    const { Email, Passwort } = req.body;

    if (!Email || !Passwort) {
      return res.status(400).json({ error: 'Email und Passwort sind Pflicht' });
    }

    try {
      const [rows] = await pool.query('SELECT * FROM Benutzer WHERE Email = ?', [Email]);

      if (rows.length === 0) {
        return res.status(401).json({ error: 'Email oder Passwort falsch' });
      }

      const benutzer = rows[0];
      const passwortStimmt = await bcrypt.compare(Passwort, benutzer.Passwort);

      if (!passwortStimmt) {
        return res.status(401).json({ error: 'Email oder Passwort falsch' });
      }

      res.json({
        user_Id: benutzer.user_Id,
        Benutzername: benutzer.Benutzername,
        Email: benutzer.Email,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Login fehlgeschlagen' });
    }
  });

  // ============================================================
  //  KOMMENTARE
  // ============================================================

  // Einen Kommentar zu einem Foto schreiben
  // POST /api/photos/5/comments   Body: { "user_Id": 1, "Text": "Tolles Foto!" }
  app.post('/api/photos/:id/comments', async (req, res) => {
    const photoId = req.params.id;
    const { user_Id, Text } = req.body;

    if (!user_Id || !Text) {
      return res.status(400).json({ error: 'user_Id und Text sind Pflicht' });
    }

    try {
      const [result] = await pool.query(
        'INSERT INTO Kommentar (user_Id, photo_Id, Text) VALUES (?, ?, ?)',
        [user_Id, photoId, Text]
      );
      res.status(201).json({ kommentar_Id: result.insertId, message: 'Kommentar gespeichert' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Kommentar konnte nicht gespeichert werden' });
    }
  });

  // Alle Kommentare zu einem Foto anzeigen (mit Namen des Autors)
  // GET /api/photos/5/comments
  app.get('/api/photos/:id/comments', async (req, res) => {
    try {
      const [rows] = await pool.query(`
        SELECT k.kommentar_Id, k.Text, k.Datum, b.Benutzername
        FROM Kommentar k
        JOIN Benutzer b ON k.user_Id = b.user_Id
        WHERE k.photo_Id = ?
        ORDER BY k.Datum ASC
      `, [req.params.id]);
      res.json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Datenbankfehler' });
    }
  });

  // ============================================================
  //  LIKES
  // ============================================================

  // Like umschalten: liken, falls noch nicht geliked -- entliken, falls schon geliked
  // POST /api/photos/5/like   Body: { "user_Id": 1 }
  app.post('/api/photos/:id/like', async (req, res) => {
    const photoId = req.params.id;
    const { user_Id } = req.body;

    if (!user_Id) {
      return res.status(400).json({ error: 'user_Id ist Pflicht' });
    }

    try {
      // 1) Prüfen, ob dieser Nutzer dieses Foto schon geliked hat
      const [existing] = await pool.query(
        'SELECT * FROM Likes WHERE user_Id = ? AND photo_Id = ?',
        [user_Id, photoId]
      );

      if (existing.length > 0) {
        // Schon geliked -> Like wieder entfernen
        await pool.query(
          'DELETE FROM Likes WHERE user_Id = ? AND photo_Id = ?',
          [user_Id, photoId]
        );
      } else {
        // Noch nicht geliked -> Like hinzufügen
        await pool.query(
          'INSERT INTO Likes (user_Id, photo_Id) VALUES (?, ?)',
          [user_Id, photoId]
        );
      }

      // 2) Aktuelle Gesamtzahl der Likes für dieses Foto zählen
      const [countRows] = await pool.query(
        'SELECT COUNT(*) AS anzahl FROM Likes WHERE photo_Id = ?',
        [photoId]
      );
      broadcast({
        type: 'like-update',
        photo_Id: Number(photoId),
        likes: countRows[0].anzahl,
      });

      res.json({
        liked: existing.length === 0,  // true = gerade geliked, false = gerade entliked
        likes: countRows[0].anzahl,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Like konnte nicht verarbeitet werden' });
    }
  });

  // Alle Fotos, optional gefiltert nach Kategorie
  // GET /api/photos oder /api/photos?kategorie=1
app.get('/api/photos', async (req, res) => {
  const { kategorie } = req.query;
  try {
    let sql = `
      SELECT p.photo_Id, p.Titel, p.Beschreibung, p.Datum, p.Location, p.Bildpfad,
            b.Benutzername,
            (SELECT COUNT(*) FROM Likes l WHERE l.photo_Id = p.photo_Id) AS likes
      FROM Photo p
      JOIN Benutzer b ON p.user_Id = b.user_Id
    `;
    const params = [];
    if (kategorie) {
      sql += ' JOIN Photo_Kategorie pk ON p.photo_Id = pk.photo_Id WHERE pk.KategorieID = ?';
      params.push(kategorie);
    }
    sql += ' ORDER BY p.Datum DESC';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Datenbankfehler' });
  }
});


  app.get('/api/photos/:id/likes', async (req, res) => {
  const { user_Id } = req.query;
  try {
    const [countRows] = await pool.query(
      'SELECT COUNT(*) AS anzahl FROM Likes WHERE photo_Id = ?',
      [req.params.id]
    );

    let liked = false;
    if (user_Id) {
      const [likedRows] = await pool.query(
        'SELECT 1 FROM Likes WHERE user_Id = ? AND photo_Id = ?',
        [user_Id, req.params.id]
      );
      liked = likedRows.length > 0;
    }

    res.json({ likes: countRows[0].anzahl, liked });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Datenbankfehler' });
  }
});

  // ---- Server starten ----
  const server = app.listen(PORT, () => {
    console.log(`Backend läuft auf http://localhost:${PORT}`);
  });

  // WebSocket-Server auf demselben Server/Port laufen lassen (kein neuer Port!)
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    console.log('Neuer WebSocket-Client verbunden. Aktuell verbunden:', wss.clients.size);

    ws.on('close', () => {
      console.log('WebSocket-Client getrennt. Noch verbunden:', wss.clients.size);
    });
  });

  // Hilfsfunktion: schickt eine Nachricht an ALLE gerade verbundenen Clients.
  // readyState === WebSocket.OPEN stellt sicher, dass wir nicht an eine
  // Verbindung senden, die gerade dabei ist sich zu schließen.
  function broadcast(nachricht) {
    const text = JSON.stringify(nachricht);
    wss.clients.forEach((client) => {
      if (client.readyState === client.OPEN) {
        client.send(text);
      }
    });
  }