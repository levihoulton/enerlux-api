require('dotenv').config();
const sql = require('mssql');

// Configure the database connection pool
const pool = new sql.ConnectionPool({
  user: process.env.DB_USER, // Database username
  password: process.env.DB_PASSWORD, // Database password
  server: process.env.DB_SERVER, // Database server address
  database: process.env.DB_DATABASE, // Database name
  port: parseInt(process.env.DB_PORT, 10) || 1433, // Default SQL Server port
  options: {
    encrypt: true, // For Azure SQL, encryption is required
    trustServerCertificate: false, // Set to true if you are using a self-signed certificate
  },
});

// Connect to the database and export the pool
const connectPool = async () => {
  try {
    await pool.connect();
    console.log('Connected to SQL Server');
  } catch (err) {
    console.error('Database connection failed:', err);
    throw err;
  }
};

module.exports = {
  pool,
  connectPool,
};
