const feeStructureService = require('../services/feeStructureService');

exports.getFeeStructure = async (req, res) => {
  try {
    const allFees = await feeStructureService.getFeeStructure();
    return res.status(200).json(allFees);
  } catch (error) {
    console.error('Error in getFeeStructure:', error.message);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.calculateProfitability = async (req, res) => {
  try {
    // Extract user input from request
    const {
      productCategory,
      sellingPrice,
      weight,
      shippingMode,
      serviceLevel,
      productSize,
      location
    } = req.body;

    // 1. Get all 4 sheets of data
    const {
      referralFees,
      closingFees,
      weightHandlingFees,
      othersFees
    } = await feeStructureService.getFeeStructure();

    // 2. Calculate the referral fee
    //    For example, find a row in "referralFees" that matches:
    //      row.category === productCategory
    //      row.priceRangeInr = "<= 500" or "> 500" (or "All")
    const referralFeePercentage = findReferralFeePercentage(
      referralFees,
      productCategory,
      sellingPrice
    );
    const referralFee = (sellingPrice * referralFeePercentage) / 100;

    // 3. Calculate the closing fee
    //    We'll guess the user might be "Easy Ship (Standard)" if shippingMode === "Easy Ship" + serviceLevel === "Standard"
    const closingFeeValue = findClosingFee(
      closingFees,
      sellingPrice,
      shippingMode,
      serviceLevel
    );

    // 4. Calculate the weight handling fee
    const weightHandlingFeeValue = findWeightHandlingFee(
      weightHandlingFees,
      shippingMode,
      serviceLevel,
      weight,
      location
    );

    // 5. Calculate pick & pack from "othersFees"
    //    e.g., "Pick & Pack Fee", "Standard Size" => "₹14"
    const pickAndPackFeeValue = findPickAndPackFee(
      othersFees,
      productSize // e.g. "Standard Size" or "Oversize/Heavy & Bulky"
    );

    // Summation
    const totalFees = referralFee + closingFeeValue + weightHandlingFeeValue + pickAndPackFeeValue;
    const netEarnings = sellingPrice - totalFees;

    return res.status(200).json({
      breakdown: {
        referralFee,
        weightHandlingFee: weightHandlingFeeValue,
        closingFee: closingFeeValue,
        pickAndPackFee: pickAndPackFeeValue
      },
      totalFees,
      netEarnings
    });
  } catch (error) {
    console.error('Error in calculateProfitability:', error.message);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

// --------------------- HELPER FUNCTIONS ---------------------
// Each function deals with data from one sheet
// You must adapt the logic to your actual columns & pricing rules.

function findReferralFeePercentage(referralFees, category, sellingPrice) {
  // E.g. match "Automotive - Helmets & Riding Gloves"
  // Then see if Price Range (INR) = "<= 500", "> 500", "All"
  const row = referralFees.find((r) => {
    if (r.category !== category) return false;
    const priceRange = (r.priceRangeInr || '').trim(); // e.g. "<= 500"

    if (priceRange === 'All') {
      return true;
    } else if (priceRange === '<= 500' && sellingPrice <= 500) {
      return true;
    } else if (priceRange === '> 500' && sellingPrice > 500) {
      return true;
    }
    return false;
  });

  if (!row) return 0; // Not found
  // "Referral Fee Percentage" might have a % sign, e.g. "6.50%"
  const valStr = (row.referralFeePercentage || '').replace('%', '');
  return parseFloat(valStr) || 0;
}

function findClosingFee(closingFees, sellingPrice, shippingMode, serviceLevel) {
  // For example, if shippingMode === "Easy Ship" and serviceLevel === "Standard",
  // we might look for the column "Easy Ship (Standard)" in your sheet.
  // Then figure out which "Price Range (₹)" row to match (like "0-250", "251-500", "501-1000").
  const priceRangeRow = closingFees.find((r) => {
    const range = (r.priceRange || '').trim(); // e.g. "251-500"
    return isPriceInRange(range, sellingPrice);
  });

  if (!priceRangeRow) return 0;

  // Now pick the correct column depending on shipping mode + service level
  // This is one approach:
  if (shippingMode === 'Easy Ship' && serviceLevel === 'Standard') {
    // e.g. "Easy Ship (Standard)"
    return parseFeeString(priceRangeRow.easyShipStandard || '0');
  }
  // or if shippingMode === 'FBA' => maybe "FBA Normal" or "FBA Exception"?
  // etc. Adapt as needed...
  return 0;
}

function findWeightHandlingFee(weightFees, shippingMode, serviceLevel, weight, location) {
  // For example, if shippingMode === "Easy Ship", productSize === "Standard",
  // we might look for a row with "Easy Ship Standard Size - Standard".
  // Then see if "Weight Range" is "First 500g" if weight <= 0.5.
  // Then pick the correct location column (e.g. "Local", "Regional", "National").
  const row = weightFees.find((r) => {
    const level = (r.serviceLevel || '').toLowerCase(); 
    // e.g. "easy ship standard size - standard"
    if (!level.includes('easy ship')) return false;
    if (!level.includes('standard size')) return false;
    if (!level.includes(serviceLevel.toLowerCase())) return false;

    // Next, check "weight range"
    if (weight <= 0.5 && r.weightRange === 'First 500g') {
      return true;
    }
    // For bigger weights, you'd match "Additional 500g", "Additional kg", etc.
    return false;
  });

  if (!row) return 0;

  // Now pick the correct location column (Local/Regional/National/IXD).
  if (location === 'Local') {
    return parseFeeString(row.local || '0');
  } else if (location === 'Regional') {
    return parseFeeString(row.regional || '0');
  } else if (location === 'National') {
    return parseFeeString(row.national || '0');
  }
  // etc.
  return 0;
}

function findPickAndPackFee(othersFees, productSize) {
  // We look for row.feeType === "Pick & Pack Fee"
  // and row.category === e.g. "Standard Size" or "Oversize/Heavy & Bulky"
  const row = othersFees.find(
    (r) => r.feeType === 'Pick & Pack Fee' && r.category === productSize
  );
  if (!row) return 0;
  return parseFeeString(row.rate || '0');
}

// --- Utility to parse a "price range" string like "251-500" ---
function isPriceInRange(rangeStr, price) {
  // e.g. "0-250", "251-500", "501-1000"
  const parts = rangeStr.split('-');
  if (parts.length === 2) {
    const min = parseFloat(parts[0]) || 0;
    const max = parseFloat(parts[1]) || 999999;
    return price >= min && price <= max;
  }
  return false;
}

// --- Utility to parse a "₹" string or remove a "%" sign, etc. ---
function parseFeeString(feeStr) {
  // e.g. "₹25" => "25"
  // remove "₹", any commas, etc.
  return parseFloat(feeStr.replace(/[₹,]/g, '')) || 0;
}
