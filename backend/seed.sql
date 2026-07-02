-- seed.sql
-- Optionale Testdaten, damit /api/photos sofort etwas zurueckgibt.
-- In MySQL Workbench ausfuehren (Blitz-Symbol), nachdem das Schema
-- angelegt wurde. user_Id=1 und Kamera_Id=1 stimmen, weil die Tabellen
-- frisch sind und AUTO_INCREMENT bei 1 beginnt.

USE Erste_Datenbank;

INSERT INTO Benutzer (Email, Benutzername, Passwort, Location, Registrierungsdatum)
VALUES ('anna@example.com', 'anna_foto', 'platzhalter', 'Bremen', '2026-01-15');

INSERT INTO Kamera (Hersteller, Modell)
VALUES ('Canon', 'EOS R6');

INSERT INTO Photo (user_Id, Kamera_Id, Titel, Beschreibung, Datum, Location)
VALUES
  (1, 1, 'Sonnenuntergang am Deich', 'Abendstimmung in Bremen', '2026-02-01', 'Bremen'),
  (1, 1, 'Altstadtgasse',            'Enge Gasse im Schnoor',   '2026-02-03', 'Bremen');

-- Ordne das erste Foto der Kategorie "Natur" zu (KategorieID 1),
-- das zweite "Architektur" (KategorieID 2):
INSERT INTO Photo_Kategorie (photo_Id, KategorieID) VALUES (1, 1), (2, 2);
