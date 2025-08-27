# Design Document

## Overview

This design document outlines the comprehensive redesign of Uzaji.com's Phase 1 bookkeeping application. The redesign transforms the existing interface into a flexible, modular foundation that serves both general small businesses and legal firms through an intuitive, workflow-based approach while maintaining the robust local-first, offline-first PWA architecture.

The redesign focuses on three core areas:
1. **User-Centric Onboarding** - Guided business type selection for customized experiences
2. **Dynamic Dashboard Redesign** - Real-time financial command center with actionable insights
3. **Unified Transaction Workflow** - Streamlined, guided transaction recording process

## Architecture

### Current Architecture Preservation
The redesign maintains the existing technical foundation:
- **React 18.3.1** with TypeScript for type-safe component development
- **IndexedDB** via the `idb` library for local data persistence
- **Client-side encryption** for data security
- **Service Worker** for offline functionality
- **Vite PWA plugin** for progressive web app capabilities
- **Tailwind CSS** for responsive styling
- **React Router DOM** for navigation

### New Architectural Components

#### 1. Business Configuration System
```typescript
interface BusinessConfig {
  type: 'general' | 'legal';
  name: string;
  setupComplete: boolean;
  defaultCategories: string[];
  uiPreferences: {
    dashboardLayout: 'standard' | 'legal';
    transactionFields: string[];
    reportTypes: string[];
  };
}
```

#### 2. Enhanced Dashboard State Management
```typescript
interface DashboardState {
  metrics: {
    netIncome: number;
    totalRevenue: number;
    totalExpenses: number;
    cashBalance: number;
    accountsReceivable: number; // Phase 2
    accountsPayable: number;    // Phase 2
  };
  recentTransactions: Transaction[];
  quickActions: QuickAction[];
  businessConfig: BusinessConfig;
}
```

#### 3. Transaction Workflow Engine
```typescript
interface TransactionWorkflow {
  type: 'income' | 'expense';
  steps: WorkflowStep[];
  validation: ValidationRule[];
  completion: CompletionAction[];
}
```

## Components and Interfaces

### 1. Onboarding Components

#### BusinessTypeSelector Component
```typescript
interface BusinessTypeSelectorProps {
  onBusinessTypeSelect: (type: 'general' | 'legal') => void;
  onSetupComplete: (config: BusinessConfig) => void;
}
```

**Features:**
- Mandatory business type selection modal
- Visual business type cards with descriptions
- Setup wizard for business name and initial configuration
- Automatic UI configuration based on selection

#### OnboardingWizard Component
```typescript
interface OnboardingWizardProps {
  businessType: 'general' | 'legal';
  onComplete: (config: BusinessConfig) => void;
}
```

**Features:**
- Multi-step setup process
- Business name collection
- Default category setup
- Initial account configuration

### 2. Redesigned Dashboard Components

#### DashboardHeader Component
```typescript
interface DashboardHeaderProps {
  businessName: string;
  currentDate: string;
  user: User;
  onLogout: () => void;
}
```

**Features:**
- Personalized welcome message
- Current date display
- User menu with profile and logout options
- Online/offline status indicator

#### MetricsBar Component
```typescript
interface MetricsBarProps {
  metrics: DashboardMetrics;
  businessType: 'general' | 'legal';
  isLoading: boolean;
}

interface DashboardMetrics {
  netIncome: number;
  totalRevenue: number;
  totalExpenses: number;
  cashBalance: number;
  accountsReceivable: number;
  accountsPayable: number;
}
```

**Features:**
- Real-time metric updates from IndexedDB
- Color-coded financial indicators
- Responsive grid layout
- Business-type specific metric emphasis

#### QuickActionsPanel Component
```typescript
interface QuickActionsPanelProps {
  actions: QuickAction[];
  onActionClick: (actionId: string) => void;
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType;
  enabled: boolean;
  tooltip?: string;
  primary?: boolean;
}
```

**Features:**
- Large, accessible action buttons
- Primary action highlighting (Record Transaction)
- Disabled state with tooltips for Pro features
- Keyboard navigation support

#### RecentActivityFeed Component
```typescript
interface RecentActivityFeedProps {
  transactions: Transaction[];
  maxItems: number;
  onTransactionClick?: (transaction: Transaction) => void;
}
```

**Features:**
- Scrollable transaction list
- Color-coded amounts (green/red)
- Date and description display
- Click-to-edit functionality (future enhancement)

### 3. Transaction Workflow Components

#### TransactionTypeSelector Component
```typescript
interface TransactionTypeSelectorProps {
  onTypeSelect: (type: 'income' | 'expense') => void;
  onCancel: () => void;
}
```

**Features:**
- Full-screen modal or dedicated page
- Clear visual distinction between income/expense
- Guided selection with descriptions

#### IncomeTransactionForm Component
```typescript
interface IncomeTransactionFormProps {
  onSubmit: (transaction: IncomeTransaction) => void;
  onCancel: () => void;
  products: Product[];
  services: Service[];
}

interface IncomeTransaction {
  date: string;
  amount: number;
  description: string;
  customer?: string;
  productServiceId?: string;
  depositAccount: string;
  attachments?: File[];
}
```

**Features:**
- Guided form with validation
- Product/Service selection dropdown
- Customer field (optional)
- File attachment support
- Account selection (single default initially)

#### ExpenseTransactionForm Component
```typescript
interface ExpenseTransactionFormProps {
  onSubmit: (transaction: ExpenseTransaction) => void;
  onCancel: () => void;
  categories: ExpenseCategory[];
}

interface ExpenseTransaction {
  date: string;
  amount: number;
  description: string;
  vendor?: string;
  categoryId: string;
  paymentAccount: string;
  attachments?: File[];
}
```

**Features:**
- Guided form with validation
- Expense category management
- Vendor field (optional)
- File attachment support
- Payment account selection

### 4. Navigation Components

#### Sidebar Component
```typescript
interface SidebarProps {
  currentRoute: string;
  businessType: 'general' | 'legal';
  onNavigate: (route: string) => void;
}

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType;
  route: string;
  enabled: boolean;
  badge?: string;
}
```

**Features:**
- Persistent left sidebar
- Business-type aware navigation
- Active route highlighting
- Pro feature indicators
- Responsive collapse on mobile

## Data Models

### Enhanced Transaction Model
```typescript
interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  subcategory?: string;
  customer?: string;
  vendor?: string;
  productServiceId?: string;
  account: string;
  attachments?: FileAttachment[];
  tags?: string[];
  encrypted: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### Business Configuration Model
```typescript
interface BusinessConfig {
  id: string;
  type: 'general' | 'legal';
  name: string;
  setupComplete: boolean;
  onboardingDate: string;
  defaultCategories: ExpenseCategory[];
  accounts: Account[];
  uiPreferences: UIPreferences;
  encrypted: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UIPreferences {
  dashboardLayout: 'standard' | 'legal';
  compactView: boolean;
  defaultTransactionType: 'income' | 'expense';
  showProFeatures: boolean;
}
```

### Account Model
```typescript
interface Account {
  id: string;
  name: string;
  type: 'cash' | 'bank' | 'credit';
  balance: number;
  isDefault: boolean;
  encrypted: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### File Attachment Model
```typescript
interface FileAttachment {
  id: string;
  filename: string;
  size: number;
  type: string;
  data: string; // Base64 encoded
  transactionId: string;
  encrypted: boolean;
  createdAt: string;
}
```

## Error Handling

### Form Validation Strategy
- **Client-side validation** for immediate feedback
- **Schema-based validation** using TypeScript interfaces
- **Progressive enhancement** with server-side validation preparation
- **Accessibility-compliant** error messaging

### Data Integrity Protection
- **Transaction validation** before IndexedDB storage
- **Encryption verification** for sensitive data
- **Backup validation** during import/export operations
- **Graceful degradation** for offline scenarios

### User Experience Error Handling
```typescript
interface ErrorState {
  type: 'validation' | 'network' | 'storage' | 'encryption';
  message: string;
  field?: string;
  recoverable: boolean;
  actions: ErrorAction[];
}

interface ErrorAction {
  label: string;
  action: () => void;
  primary?: boolean;
}
```

## Testing Strategy

### Component Testing
- **Unit tests** for all new components using React Testing Library
- **Integration tests** for workflow components
- **Accessibility tests** using jest-axe
- **Visual regression tests** for dashboard layouts

### Data Layer Testing
- **IndexedDB operations** testing with fake-indexeddb
- **Encryption/decryption** validation tests
- **Data migration** tests for existing users
- **Offline functionality** tests

### User Experience Testing
- **Onboarding flow** end-to-end tests
- **Transaction workflow** user journey tests
- **Responsive design** tests across devices
- **Performance tests** for dashboard loading

### Business Logic Testing
```typescript
describe('Dashboard Metrics Calculation', () => {
  test('calculates net income correctly', () => {
    // Test real-time metric calculations
  });
  
  test('handles empty transaction data', () => {
    // Test edge cases
  });
});

describe('Transaction Workflow', () => {
  test('guides user through income recording', () => {
    // Test workflow completion
  });
  
  test('validates required fields', () => {
    // Test form validation
  });
});
```

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
1. Business configuration system
2. Enhanced database schema
3. Onboarding components
4. Basic dashboard restructure

### Phase 2: Dashboard Redesign (Week 2-3)
1. Metrics bar implementation
2. Quick actions panel
3. Recent activity feed
4. Real-time updates

### Phase 3: Transaction Workflow (Week 3-4)
1. Transaction type selector
2. Income/expense forms
3. File attachment system
4. Workflow validation

### Phase 4: Navigation & Polish (Week 4-5)
1. Sidebar redesign
2. Responsive improvements
3. Accessibility enhancements
4. Performance optimization

## Security Considerations

### Data Protection
- **Maintain existing encryption** for all sensitive data
- **Secure file attachments** with client-side encryption
- **Business configuration encryption** for sensitive settings
- **Key derivation consistency** across sessions

### Privacy Compliance
- **Local-first architecture** maintains data sovereignty
- **No external data transmission** without explicit user consent
- **Transparent data handling** in onboarding process
- **User control** over data export and deletion

## Performance Optimization

### Dashboard Loading
- **Lazy loading** for non-critical components
- **Memoization** for expensive calculations
- **Virtual scrolling** for large transaction lists
- **Progressive loading** for dashboard metrics

### IndexedDB Optimization
- **Efficient queries** with proper indexing
- **Batch operations** for bulk data updates
- **Connection pooling** for database access
- **Background sync** for non-blocking operations

## Accessibility Compliance

### WCAG 2.1 AA Standards
- **Keyboard navigation** for all interactive elements
- **Screen reader compatibility** with proper ARIA labels
- **Color contrast compliance** for all text and backgrounds
- **Focus management** in modal workflows

### Inclusive Design
- **Responsive design** for various screen sizes
- **Touch-friendly** interface elements
- **Clear visual hierarchy** with proper heading structure
- **Error messaging** that's descriptive and actionable