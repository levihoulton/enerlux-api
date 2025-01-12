require('dotenv').config();
const sql = require("mssql");

const devConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  port: parseInt(process.env.DB_PORT, 10) || 1433,
  database: process.env.DB_DATABASE,
  options: {
    encrypt: true, // Ensure encryption is enabled
    trustServerCertificate: true, // Allow self-signed certificates
    enableArithAbort: true,       // For query cancellation on arithmetic errors
  },
};

const prodConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  port: parseInt(process.env.DB_PORT, 10) || 1433,
  database: process.env.DB_DATABASE,
  options: {
    encrypt: true, // Enable encryption for production
    enableArithAbort: true,
  },
};

const config = process.env.NODE_ENV === "production" ? prodConfig : devConfig;

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then((pool) => {
    console.log("Connected to SQL Server");
    return pool;
  })
  .catch((err) => {
    console.error("Database connection failed: ", err);
    throw err;
  });

module.exports = {
  sql,
  poolPromise,
};
