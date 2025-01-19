require('dotenv').config();
const mysql = require('mysql2/promise'); // Use mysql2/promise for promises

// Create a connection pool with SSL options
const pool = mysql.createPool({
  host: process.env.DB_SERVER,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: parseInt(process.env.DB_PORT, 10) || 3306, // Default MySQL port
  ssl: {
    rejectUnauthorized: true, // Ensure the certificate is valid
  },
});

module.exports = {
  pool,
};

