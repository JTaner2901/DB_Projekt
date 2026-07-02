// db.js
// ------------------------------------------------------------
// Baut die Verbindung zur MySQL-Datenbank auf.
// Wir nutzen einen "Connection Pool": mehrere wiederverwendbare
// Verbindungen, damit nicht bei jeder Anfrage neu verbunden wird.
// ------------------------------------------------------------

const mysql = require('mysql2/promise');
require('dotenv').config(); // liest die Werte aus der .env-Datei

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

module.exports = pool;
