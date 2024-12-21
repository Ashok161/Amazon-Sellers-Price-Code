Here's the content formatted specifically for a `README.md` file:

```markdown
# Profitability Calculator API

## Prerequisites

1. **Node.js**  
   Ensure you have Node.js installed on your machine. You can download it from [Node.js Official Website](https://nodejs.org/).

2. **Google Cloud Service Account**  
   - Create a Google Cloud account if you don’t have one.
   - Create a new project in Google Cloud.
   - Set up a Service Account for your project.
   - Download the Service Account JSON key file.

3. **Google Cloud JSON Key**  
   - Create an `.env` file in the `server` folder and include the following variables:
     ```env
     GOOGLE_SERVICE_ACCOUNT_EMAIL="your-service-account@your-project.iam.gserviceaccount.com"
     GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nABCDEF...\n-----END PRIVATE KEY-----\n"
     GOOGLE_SHEET_ID="1o_yM63Grl_QB6lpuXE3spbrMeCs-hIMXCVyghj8FmV0"
     PORT=5000
     ```

---

## Folder Structure

root
│
├── client                   # Frontend files
│   ├── src                  # Frontend source code
│   │   ├── components       # React components
│   │   └── ...              # Additional client-side code
│   ├── package.json         # Client package manifest
│   ├── vite.config.ts       # Vite configuration
│   └── index.html           # Main HTML file
│
├── server                   # Backend files
│   ├── controllers          # Logic for API endpoints
│   │   └── profitabilityCalculatorController.js
│   ├── routes               # Route definitions
│   │   └── profitabilityCalculatorRoutes.js
│   ├── services             # Helper services
│   │   └── feeStructureService.js
│   ├── .env                 # Environment variables (Google Cloud details)
│   ├── server.js            # Main server entry point
│   └── package.json         # Server package manifest
│
├── .gitignore               # Git ignore file
├── README.md                # This file
└── ...
```


## Setup

1. **Clone the repository**  
   ```bash
   git clone <repository-url>
   cd <repository-folder>
   ```

2. **Install dependencies**  
   Navigate to the `client` and `server` directories and run the following:
   ```bash
   cd client
   npm install
   cd ../server
   npm install
   ```

3. **Set up Google Cloud credentials**  
   - Place the `.env` file in the `server` folder with the required credentials.

4. **Run the server**  
   Start the backend server:  
   ```bash
   cd server
   npm start
   ```

5. **Run the client**  
   Start the frontend application:  
   ```bash
   cd client
   npm run dev
   ```

---

## Notes

- Ensure you have adequate permissions on the Google Cloud project for the operations required.
- If deploying to a server, ensure the `.env` file and Service Account JSON file are securely stored.
- The backend runs on `http://localhost:5000`, and the frontend runs on `http://localhost:3000` by default.
```

