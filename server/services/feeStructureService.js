require('dotenv').config();
const { GoogleSpreadsheet } = require('google-spreadsheet');

exports.getFeeStructure = async () => {
  try {
    // 1. Initialize the doc with your Google Sheet ID (NOT the full URL!)
    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID);

    // 2. Authenticate
    await doc.useServiceAccountAuth({
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    });

    // 3. Load the spreadsheet info
    await doc.loadInfo();

    // We assume:
    //   Sheet 0 => "Referral fees"
    //   Sheet 1 => "Closing fees"
    //   Sheet 2 => "Weight handling fees"
    //   Sheet 3 => "Other fees"

    // ------------------ SHEET 1: Referral fees ------------------
    const sheetReferral = doc.sheetsByIndex[0]; // "Referral fees"
    const rowsReferral = await sheetReferral.getRows();
    const referralFees = rowsReferral.map((r) => ({
      category: r['Category'] || '',
      priceRangeInr: r['Price Range (INR)'] || '',       // e.g. "<= 500", "> 500", "All"
      referralFeePercentage: r['Referral Fee Percentage'] || '' // e.g. "6.50%", "8.50%"
    }));

    // ------------------ SHEET 2: Closing fees -------------------
    const sheetClosing = doc.sheetsByIndex[1]; // "Closing fees"
    const rowsClosing = await sheetClosing.getRows();
    const closingFees = rowsClosing.map((r) => ({
      priceRange: r['Price Range (₹)'] || '',          // e.g. "0-250", "251-500", etc.
      fbaNormal: r['FBA Normal'] || '',
      fbaException: r['FBA Exception'] || '',
      easyShipStandard: r['Easy Ship (Standard)'] || '',
      selfShip: r['Self Ship'] || '',
      sellerFlex: r['Seller Flex'] || '',
    }));

    // --------------- SHEET 3: Weight handling fees --------------
    const sheetWeight = doc.sheetsByIndex[2]; // "Weight handling fees"
    const rowsWeight = await sheetWeight.getRows();
    const weightHandlingFees = rowsWeight.map((r) => ({
      serviceLevel: r['Service Level'] || '',  // e.g. "Easy Ship Standard Size - Premium"
      weightRange: r['Weight Range'] || '',    // e.g. "First 500g", "Additional kg after 5kg", etc.
      local: r['Local'] || '',                 // e.g. "₹43"
      regional: r['Regional'] || '',
      national: r['National'] || '',
      ixd: r['IXD'] || '',
    }));

    // ---------------- SHEET 4: Other fees ------------------------
    const sheetOthers = doc.sheetsByIndex[3]; // "Others fees"
    const rowsOthers = await sheetOthers.getRows();
    const othersFees = rowsOthers.map((r) => ({
      feeType: r['Fee Type'] || '',    // e.g. "Pick & Pack Fee", "Storage Fee", etc.
      category: r['Category'] || '',   // e.g. "Standard Size", "Oversize/Heavy & Bulky"
      rate: r['Rate'] || '',           // e.g. "₹14"
    }));

    // Return one object with all arrays
    return {
      referralFees,
      closingFees,
      weightHandlingFees,
      othersFees,
    };

  } catch (error) {
    console.error('Error fetching fee structure:', error);
    throw error;
  }
};
