require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Import routes
const profitabilityCalculatorRoutes = require('./routes/profitabilityCalculatorRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Mount the routes at /api/v1/profitability-calculator
// The "router.get('/fee-structure')" in the routes file => GET /api/v1/profitability-calculator/fee-structure
app.use('/api/v1/profitability-calculator', profitabilityCalculatorRoutes);

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
