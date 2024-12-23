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
    const {
      productCategory,
      sellingPrice,
      weight,
      shippingMode,
      serviceLevel,
      productSize,
      location
    } = req.body;

    const {
      referralFees,
      closingFees,
      weightHandlingFees,
      othersFees
    } = await feeStructureService.getFeeStructure();

    // Calculate referral fee
    const referralFeePercentage = findReferralFeePercentage(
      referralFees,
      productCategory,
      sellingPrice
    );
    const referralFee = (sellingPrice * referralFeePercentage) / 100;

    // Calculate closing fee
    const closingFeeValue = findClosingFee(
      closingFees,
      sellingPrice,
      shippingMode,
      serviceLevel
    );

    // Calculate weight handling fee
    const weightHandlingFeeValue = findWeightHandlingFee(
      weightHandlingFees,
      shippingMode,
      serviceLevel,
      weight,
      location
    );

    // Calculate pick & pack fee
    const pickAndPackFeeValue = findPickAndPackFee(
      othersFees,
      productSize
    );

    // Calculate total fees and net earnings
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

// Helper functions
function findReferralFeePercentage(referralFees, category, sellingPrice) {
  const row = referralFees.find((r) => {
    if (r.category !== category) return false;
    const priceRange = (r.priceRangeInr || '').trim();

    if (priceRange === 'All') {
      return true;
    } else if (priceRange === '<= 500' && sellingPrice <= 500) {
      return true;
    } else if (priceRange === '> 500' && sellingPrice > 500) {
      return true;
    }
    return false;
  });

  if (!row) return 0;
  const valStr = (row.referralFeePercentage || '').replace('%', '');
  return parseFloat(valStr) || 0;
}

function findClosingFee(closingFees, sellingPrice, shippingMode, serviceLevel) {
  const priceRangeRow = closingFees.find((r) => {
    const range = (r.priceRange || '').trim();
    return isPriceInRange(range, sellingPrice);
  });

  if (!priceRangeRow) return 0;

  if (shippingMode === 'Easy Ship' && serviceLevel === 'Standard') {
    return parseFeeString(priceRangeRow.easyShipStandard || '0');
  } else if (shippingMode === 'FBA') {
    return parseFeeString(priceRangeRow[`${shippingMode} ${serviceLevel}`] || '0');
  } else if (shippingMode === 'Self Ship') {
    return parseFeeString(priceRangeRow.selfShip || '0');
  } else if (shippingMode === 'Seller Flex') {
    return parseFeeString(priceRangeRow.sellerFlex || '0');
  }
  return 0;
}

function findWeightHandlingFee(weightFees, shippingMode, serviceLevel, weight, location) {
  const row = weightFees.find((r) => {
    const level = (r.serviceLevel || '').toLowerCase();
    if (!level.includes(shippingMode.toLowerCase())) return false;
    if (!level.includes(serviceLevel.toLowerCase())) return false;

    if (weight <= 0.5 && r.weightRange === 'First 500g') {
      return true;
    } else if (weight > 0.5 && weight <= 1 && r.weightRange === 'Additional 500g up to 1kg') {
      return true;
    } else if (weight > 1 && weight <= 5 && r.weightRange === 'Additional kg after 1kg') {
      return true;
    } else if (weight > 5 && r.weightRange === 'Additional kg after 5kg') {
      return true;
    }
    return false;
  });

  if (!row) return 0;

  if (location === 'Local') {
    return parseFeeString(row.local || '0');
  } else if (location === 'Regional') {
    return parseFeeString(row.regional || '0');
  } else if (location === 'National') {
    return parseFeeString(row.national || '0');
  }
  return 0;
}

function findPickAndPackFee(othersFees, productSize) {
  const row = othersFees.find(
    (r) => r.feeType === 'Pick & Pack Fee' && r.category === productSize
  );
  if (!row) return 0;
  return parseFeeString(row.rate || '0');
}

function isPriceInRange(rangeStr, price) {
  const parts = rangeStr.split('-');
  if (parts.length === 2) {
    const min = parseFloat(parts[0]) || 0;
    const max = parseFloat(parts[1]) || 999999;
    return price >= min && price <= max;
  }
  return false;
}

function parseFeeString(feeStr) {
  return parseFloat(feeStr.replace(/[₹,]/g, '')) || 0;
}
