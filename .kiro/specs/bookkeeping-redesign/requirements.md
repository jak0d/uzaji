# Requirements Document

## Introduction

This feature involves redesigning the existing Phase 1 of Uzaji.com into a flexible, modular bookkeeping foundation that serves both general small businesses and specialized legal firms. The redesign focuses on creating an intuitive, workflow-based financial tracking interface while maintaining the current local-first, offline-first PWA architecture with IndexedDB storage, client-side encryption, and Service Worker functionality.

## Requirements

### Requirement 1

**User Story:** As a first-time user, I want to be guided through business type selection during onboarding, so that I receive a customized interface appropriate for my business needs.

#### Acceptance Criteria

1. WHEN a user logs in for the first time THEN the system SHALL display a mandatory setup screen with the message "Welcome to Uzaji! What type of business do you run?"
2. WHEN the setup screen is displayed THEN the system SHALL provide exactly two business type options: "General Small Business (Retail, Consulting, Services, etc.)" and "Legal Firm (Lawyers, Paralegals, Legal Services)"
3. WHEN a user selects a business type THEN the system SHALL configure the default UI settings based on their selection
4. WHEN a user attempts to skip the business type selection THEN the system SHALL prevent progression until a selection is made

### Requirement 2

**User Story:** As a business owner, I want a dynamic financial command center dashboard, so that I can quickly understand my business's financial status at a glance.

#### Acceptance Criteria

1. WHEN a user accesses the main dashboard THEN the system SHALL display a header with "Welcome back, [Business Name]!" and the current date
2. WHEN the dashboard loads THEN the system SHALL display a Primary Metrics Bar with the following real-time figures from IndexedDB: Net Income (Revenue - Expenses), Total Revenue, Total Expenses, Cash/Bank Balance, Accounts Receivable (initially 0), and Accounts Payable (initially 0)
3. WHEN any transaction is recorded THEN the system SHALL update all relevant dashboard metrics in real-time
4. WHEN the dashboard is displayed THEN the system SHALL show a Quick Actions Section with large, clickable buttons for "Record New Transaction", "Create New Invoice" (disabled with 'Coming in Pro' tooltip), and "Record New Bill" (disabled with 'Coming in Pro' tooltip)
5. WHEN the dashboard loads THEN the system SHALL display a Recent Activity Feed showing the last 5 transactions with Date, Description, and color-coded Amount (green for income, red for expenses)

### Requirement 3

**User Story:** As a business owner, I want a unified and guided transaction workflow, so that I can quickly and accurately record financial transactions without confusion.

#### Acceptance Criteria

1. WHEN a user clicks "Record New Transaction" THEN the system SHALL open a full-screen modal or dedicated page asking "What would you like to record?"
2. WHEN the transaction type selection is displayed THEN the system SHALL provide two clear options: "Record Income / Sale" and "Record Expense / Purchase"
3. WHEN a user selects "Record Income / Sale" THEN the system SHALL display an Income Form with fields for Date, Amount, Description, Customer (optional text), Product/Service Sold (selectable from list), Deposit To Account (single default), and Attach File option
4. WHEN a user selects "Record Expense / Purchase" THEN the system SHALL display an Expense Form with fields for Date, Amount, Description, Vendor (optional text), Expense Category (user-definable), Paid From Account, and Attach File option
5. WHEN a transaction form is completed and submitted THEN the system SHALL save the data to IndexedDB and update the dashboard metrics
6. WHEN a user attaches a file to a transaction THEN the system SHALL store the file reference with the transaction record

### Requirement 4

**User Story:** As a business owner, I want a redesigned navigation sidebar, so that I can easily access different sections of the application and understand what features are available.

#### Acceptance Criteria

1. WHEN the application loads THEN the system SHALL display a persistent left sidebar with navigation options
2. WHEN the sidebar is displayed THEN the system SHALL include the following navigation items: Dashboard, Transactions, Sales, Purchases, Products & Services, and Settings
3. WHEN a user clicks "Dashboard" THEN the system SHALL navigate to the main dashboard view
4. WHEN a user clicks "Transactions" THEN the system SHALL display a unified table of all recorded transactions
5. WHEN a user clicks "Sales" THEN the system SHALL display a page showing "Invoicing and Payment Tracking coming in Pro"
6. WHEN a user clicks "Purchases" THEN the system SHALL display a page showing "Bill management coming in Pro"
7. WHEN a user clicks "Products & Services" THEN the system SHALL display a simple interface to add and edit business items
8. WHEN a user clicks "Settings" THEN the system SHALL allow editing of Business Profile and management of Expense Categories

### Requirement 5

**User Story:** As a business owner, I want the redesigned system to maintain all existing technical capabilities, so that I don't lose any current functionality or data integrity.

#### Acceptance Criteria

1. WHEN the redesign is implemented THEN the system SHALL maintain the existing IndexedDB data storage structure
2. WHEN the redesign is implemented THEN the system SHALL preserve all client-side encryption functionality
3. WHEN the redesign is implemented THEN the system SHALL maintain the Service Worker for offline functionality
4. WHEN the redesign is implemented THEN the system SHALL continue to function as a local-first, offline-first PWA
5. WHEN existing data is present THEN the system SHALL display it correctly in the new interface without data loss
6. WHEN the application is offline THEN the system SHALL continue to function with full transaction recording capabilities

### Requirement 6

**User Story:** As a business owner, I want customizable expense categories and product/service management, so that I can tailor the system to my specific business needs.

#### Acceptance Criteria

1. WHEN a user accesses expense category management THEN the system SHALL allow adding, editing, and deleting custom expense categories
2. WHEN a user records an expense THEN the system SHALL allow selection from user-defined expense categories
3. WHEN a user accesses Products & Services management THEN the system SHALL allow adding, editing, and deleting business items
4. WHEN a user records income THEN the system SHALL allow selection from the defined products/services list
5. WHEN categories or products are modified THEN the system SHALL update existing transaction references appropriately