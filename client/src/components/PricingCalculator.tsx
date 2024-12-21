import React, { useState } from 'react';
import { Calculator } from 'lucide-react';
import { PricingFormData } from '../types'; // <-- Make sure this type matches your form fields

// Example categories array. Adjust to your actual category list.
const categories = [
  'Automotive - Helmets & Riding Gloves',
  'Automotive - Tyres & Rims',
  'Automotive Vehicles',
  'Baby - Hardlines',
  'Baby - Strollers',
  'Baby - Diapers',
  'Books'
];

export default function PricingCalculator() {
  const [formData, setFormData] = useState<PricingFormData>({
    productCategory: categories[0],
    sellingPrice: 0,
    weight: 0.5,
    shippingMode: 'Easy Ship',
    serviceLevel: 'Standard',
    productSize: 'Standard',
    location: 'Local'
  });

  // We'll store the final calculated fees from the server here
  const [results, setResults] = useState<{
    referralFee: number;
    weightHandlingFee: number;
    closingFee: number;
    pickAndPackFee: number;
    totalFees: number;
    netEarnings: number;
  } | null>(null);

  // Async function to call the backend endpoint
  const handleCalculate = async () => {
    try {
      // POST the entire formData to your Node.js/Express server
      const response = await fetch('http://localhost:5000/api/v1/profitability-calculator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      console.log('Profitability Result:', data);

      // The server likely returns something like:
      // {
      //   "breakdown": {
      //     "referralFee": 10,
      //     "weightHandlingFee": 10.0,
      //     "closingFee": 5.0,
      //     "pickAndPackFee": 20
      //   },
      //   "totalFees": 45,
      //   "netEarnings": 200
      // }
      // We'll map that structure into our results state so that
      // the existing UI references (results.referralFee, etc.) remain valid.
      setResults({
        referralFee: data.breakdown?.referralFee ?? 0,
        weightHandlingFee: data.breakdown?.weightHandlingFee ?? 0,
        closingFee: data.breakdown?.closingFee ?? 0,
        pickAndPackFee: data.breakdown?.pickAndPackFee ?? 0,
        totalFees: data.totalFees ?? 0,
        netEarnings: data.netEarnings ?? 0
      });
    } catch (err) {
      console.error('Error calculating profitability:', err);
    }
  };

  // Update formData state whenever inputs change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'sellingPrice' || name === 'weight'
        ? parseFloat(value)
        : value
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center gap-3 mb-8">
            <Calculator className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Amazon Pricing Calculator</h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* LEFT SIDE: Input Fields */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Category
                </label>
                <select
                  name="productCategory"
                  value={formData.productCategory}
                  onChange={handleInputChange}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Selling Price (₹)
                </label>
                <input
                  type="number"
                  name="sellingPrice"
                  value={formData.sellingPrice}
                  onChange={handleInputChange}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  name="weight"
                  value={formData.weight}
                  onChange={handleInputChange}
                  step="0.1"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Shipping Mode
                  </label>
                  <select
                    name="shippingMode"
                    value={formData.shippingMode}
                    onChange={handleInputChange}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option>Easy Ship</option>
                    <option>FBA</option>
                    <option>Self Ship</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Service Level
                  </label>
                  <select
                    name="serviceLevel"
                    value={formData.serviceLevel}
                    onChange={handleInputChange}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option>Premium</option>
                    <option>Advanced</option>
                    <option>Standard</option>
                    <option>Basic</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Size
                  </label>
                  <select
                    name="productSize"
                    value={formData.productSize}
                    onChange={handleInputChange}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option>Standard</option>
                    <option>Heavy & Bulky</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <select
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option>Local</option>
                    <option>Regional</option>
                    <option>National</option>
                    <option>IXD</option>
                  </select>
                </div>
              </div>

              {/* BUTTON to trigger the API call */}
              <button
                onClick={handleCalculate}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                Calculate Fees
              </button>
            </div>

            {/* RIGHT SIDE: Display Results */}
            {results && (
              <div className="bg-gray-50 p-6 rounded-lg">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Fee Breakdown</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Referral Fee:</span>
                    <span className="font-medium">₹{results.referralFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Weight Handling Fee:</span>
                    <span className="font-medium">₹{results.weightHandlingFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Closing Fee:</span>
                    <span className="font-medium">₹{results.closingFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pick &amp; Pack Fee:</span>
                    <span className="font-medium">₹{results.pickAndPackFee.toFixed(2)}</span>
                  </div>
                  <div className="h-px bg-gray-200 my-4"></div>
                  <div className="flex justify-between text-lg font-semibold">
                    <span className="text-gray-900">Total Fees:</span>
                    <span className="text-blue-600">₹{results.totalFees.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold">
                    <span className="text-gray-900">Net Earnings:</span>
                    <span className="text-green-600">₹{results.netEarnings.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
