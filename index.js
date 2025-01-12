const express = require("express");
const { poolPromise, sql } = require("./dbConfig");
const quickbooksRoutes = require('./api/quickbooks/accounting');

const app = express();
const PORT = 5000;

// Use QuickBooks routes
app.use('/quickbooks', quickbooksRoutes);

app.get("/api/sales/dealers", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT * FROM sales.dealer");
    res.json(result.recordset);
  } catch (err) {
    console.error("Error fetching data:", err);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
