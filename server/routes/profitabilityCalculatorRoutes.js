const express = require('express');
const router = express.Router();
const profitabilityCalculatorController = require('../controllers/profitabilityCalculatorController');

// GET /api/v1/profitability-calculator/fee-structure
router.get('/fee-structure', profitabilityCalculatorController.getFeeStructure);

// POST /api/v1/profitability-calculator
router.post('/', profitabilityCalculatorController.calculateProfitability);

module.exports = router;
