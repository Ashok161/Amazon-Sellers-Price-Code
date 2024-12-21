// feeCalculators.ts
// ----------------------------------------------------------------------
// This module demonstrates how to fetch the fee structure from the backend
// and then perform the calculations client-side (instead of using data/fees.ts).
// ----------------------------------------------------------------------

import { PricingFormData } from '../types';

// 1. Fetch the entire fee structure from the server
async function fetchFeeStructure() {
  // Make sure your server is running on port 5000
  const response = await fetch('http://localhost:5000/api/v1/profitability-calculator/fee-structure');
  if (!response.ok) {
    throw new Error(`Failed to fetch fee structure: ${response.statusText}`);
  }
  return response.json(); // This should return an array of fee rows
}

// 2. Calculate total fees
//    We do it locally using the same logic we had in data/fees.ts, but
//    now we pass the dynamic "feeStructure" we got from the backend.
export async function calculateTotalFees(formData: PricingFormData) {
  // Step A: fetch fee data from the server (Google Sheets)
  const feeStructure = await fetchFeeStructure();

  const {
    productCategory,
    sellingPrice,
    weight,
    shippingMode,
    serviceLevel,
    productSize,
    location
  } = formData;

  // Step B: find referralFee row
  const referralFeeRow = feeStructure.find(
    (row: any) => row.category === productCategory
  );
  const referralFeePct = referralFeeRow ? parseFloat(referralFeeRow.referralFee) : 0;
  const referralFee = (sellingPrice * referralFeePct) / 100;

  // Step C: weight handling fee
  const weightHandlingFee = calculateWeightHandlingFee(
    feeStructure,
    shippingMode,
    location,
    weight
  );

  // Step D: closing fee
  const closingFee = calculateClosingFee(feeStructure, sellingPrice);

  // Step E: pick & pack fee
  const pickAndPackFee = calculatePickAndPackFee(
    feeStructure,
    shippingMode,
    productSize
  );

  // Step F: total / net
  const totalFees = referralFee + weightHandlingFee + closingFee + pickAndPackFee;
  const netEarnings = sellingPrice - totalFees;

  return {
    referralFee,
    weightHandlingFee,
    closingFee,
    pickAndPackFee,
    totalFees,
    netEarnings
  };
}

// ------------------- HELPER FUNCTIONS -------------------
function calculateWeightHandlingFee(
  feeStructure: any[],
  shippingMode: string,
  location: string,
  weight: number
): number {
  const row = feeStructure.find(
    (r) => r.mode === shippingMode && r.location === location
  );
  if (!row) return 0;
  const costPerKg = parseFloat(row.costPerKg) || 0;
  return weight * costPerKg;
}

function calculateClosingFee(
  feeStructure: any[],
  sellingPrice: number
): number {
  const bracketRow = feeStructure.find((r) => {
    if (!r.closingFeeRangeMin || !r.closingFeeRangeMax) return false;
    const min = parseFloat(r.closingFeeRangeMin);
    const max = parseFloat(r.closingFeeRangeMax);
    return sellingPrice >= min && sellingPrice <= max;
  });

  if (!bracketRow) return 0;
  return parseFloat(bracketRow.closingFeeAmount) || 0;
}

function calculatePickAndPackFee(
  feeStructure: any[],
  shippingMode: string,
  productSize: string
): number {
  const row = feeStructure.find(
    (r) => r.mode === shippingMode && r.size === productSize
  );
  if (!row) return 0;
  return parseFloat(row.pickAndPackFee) || 0;
}
