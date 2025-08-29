# Uzaji - Smart Business Bookkeeping

Secure, offline-first bookkeeping designed for small businesses. Your financial data is encrypted client-side and stored locally, ensuring complete privacy and security.

## ✨ Features

Uzaji is a powerful, offline-first bookkeeping application with a focus on security and privacy. It offers a comprehensive suite of tools for businesses of all sizes.

### Core Features
- **Privacy First & Offline Ready**: Your data is encrypted client-side and stored locally for complete privacy and offline access.
- **Dashboard**: Get a real-time overview of your business's financial health.
- **Transaction Management**: Track income, expenses, and attach files securely.
- **Products & Services**: Manage your offerings for streamlined invoicing.

### Uzaji Pro Features
- **Professional Invoicing**: Create, send, and manage the full lifecycle of customer invoices.
- **Bill Management**: Track and manage vendor bills to stay on top of your payables.
- **Banking Module**: Manage multiple bank/cash accounts and record transfers between them.
- **Core Financial Reports**: Generate essential reports like Profit & Loss, Balance Sheet, and Trial Balance.
- **Client File Tracker (for Legal Firms)**: A specialized module for law firms to manage client and case-file financials.

### AI-Powered Insights & Advanced Reporting
- **AI Financial Assistant**: Get AI-driven insights into your business.
- **Cash Flow Forecasting**: Predict future cash flow based on historical data.
- **Anomaly Detection**: Receive alerts for duplicate transactions or unusual spending patterns.
- **Advanced Reports**: Dive deeper with reports like 'Sales by Customer' and 'Expenses by Category'.

## Supabase Setup

To enable online backup and authentication, follow these steps:

### 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in to your account
3. Click "New Project"
4. Choose your organization and enter project details
5. Wait for the project to be created

### 2. Configure Environment Variables

1. In your Supabase dashboard, go to **Settings > API**
2. Copy your **Project URL** and **anon/public key**
3. Create a `.env` file in your project root (copy from `.env.example`)
4. Add your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Run Database Migration

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the contents of `supabase/migrations/create_backup_tables.sql`
3. Paste and run the SQL to create the necessary tables and security policies

### 4. Configure Authentication

1. Go to **Authentication > Settings** in your Supabase dashboard
2. Enable **Email** authentication
3. Disable **Email confirmations** for easier testing (optional)
4. In **URL Configuration**, add your site URL:
   - Site URL: `http://localhost:5173` (for development)
   - Redirect URLs: `http://localhost:5173` (for development)

### 5. Optional: Configure Google OAuth

1. Go to **Authentication > Providers** in your Supabase dashboard
2. Enable **Google** provider
3. Add your Google OAuth credentials
4. Add authorized redirect URIs in your Google Cloud Console

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Security Features

- **End-to-End Encryption**: Your data is encrypted using your account credentials
- **Automatic Encryption**: Backups are automatically encrypted without password prompts
- **Local Storage**: All data is stored locally on your device
- **Secure Cloud Sync**: Data is encrypted before being sent to Supabase
- **Row Level Security**: Database policies ensure users can only access their own data
- **No Data Mining**: We never access or analyze your financial data

## Data Privacy

- Your financial data is encrypted client-side before being stored
- Encryption keys are derived from your account credentials
- Even if someone gains access to the database, your data remains encrypted
- You maintain full control over your data with local storage and encrypted backups

## Offline Support

- The app works completely offline
- Data is stored locally using IndexedDB
- Optional cloud sync when you need it
- Automatic sync queue for when you come back online

## License

This project is licensed under the MIT License.