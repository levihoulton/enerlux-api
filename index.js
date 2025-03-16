const express = require("express");
const quickbooksRoutes = require('./api/quickbooks/accounting');
const app = express();

// ✅ Middleware should be here before defining routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.ENVIRONMENT === 'sandbox' ? 5000 : 8080;

// Use QuickBooks routes
app.use('/quickbooks', quickbooksRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
