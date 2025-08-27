import { 
  BusinessConfig, 
  ExpenseCategory, 
  Account, 
  UIPreferences,
  getBusinessConfig,
  addBusinessConfig,
  updateBusinessConfig,
  getExpenseCategories,
  getAccounts,
  completeOnboarding as dbCompleteOnboarding,
  needsOnboarding as dbNeedsOnboarding
} from './database';
import { encryption } from './encryption';

// Business Configuration Data Layer with Encryption Support

/**
 * Validates business configuration data
 */
export function validateBusinessConfig(config: Partial<BusinessConfig>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.name || config.name.trim().length === 0) {
    errors.push('Business name is required');
  }

  if (config.name && config.name.trim().length > 100) {
    errors.push('Business name must be less than 100 characters');
  }

  if (!config.type || !['general', 'legal'].includes(config.type)) {
    errors.push('Business type must be either "general" or "legal"');
  }

  if (config.uiPreferences) {
    const { dashboardLayout, defaultTransactionType } = config.uiPreferences;
    
    if (dashboardLayout && !['standard', 'legal'].includes(dashboardLayout)) {
      errors.push('Dashboard layout must be either "standard" or "legal"');
    }

    if (defaultTransactionType && !['income', 'expense'].includes(defaultTransactionType)) {
      errors.push('Default transaction type must be either "income" or "expense"');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Encrypts sensitive business configuration data
 */
async function encryptBusinessConfig(config: BusinessConfig): Promise<BusinessConfig> {
  if (!encryption.isAuthenticated()) {
    throw new Error('User must be authenticated to encrypt business configuration');
  }

  try {
    // Encrypt sensitive fields
    const encryptedName = await encryption.encrypt(config.name);
    
    return {
      ...config,
      name: encryptedName,
      encrypted: true,
    };
  } catch (error) {
    console.error('Failed to encrypt business configuration:', error);
    throw new Error('Failed to encrypt business configuration');
  }
}

/**
 * Decrypts business configuration data
 */
async function decryptBusinessConfig(config: BusinessConfig): Promise<BusinessConfig> {
  if (!config.encrypted) {
    return config;
  }

  if (!encryption.isAuthenticated()) {
    throw new Error('User must be authenticated to decrypt business configuration');
  }

  try {
    const decryptedName = await encryption.decrypt(config.name);
    
    return {
      ...config,
      name: decryptedName,
      encrypted: false,
    };
  } catch (error) {
    console.error('Failed to decrypt business configuration:', error);
    throw new Error('Failed to decrypt business configuration');
  }
}

/**
 * Creates a new business configuration with validation and encryption
 */
export async function createBusinessConfig(
  businessType: 'general' | 'legal',
  businessName: string,
  uiPreferences?: Partial<UIPreferences>
): Promise<{ success: boolean; configId?: string; error?: string }> {
  try {
    // Validate input
    const defaultUIPreferences: UIPreferences = {
      dashboardLayout: businessType === 'legal' ? 'legal' : 'standard',
      compactView: false,
      defaultTransactionType: 'income',
      showProFeatures: true,
      ...uiPreferences,
    };

    const configData: Omit<BusinessConfig, 'id' | 'createdAt' | 'updatedAt'> = {
      type: businessType,
      name: businessName.trim(),
      setupComplete: true,
      onboardingDate: new Date().toISOString(),
      defaultCategories: await getExpenseCategories(businessType),
      accounts: await getAccounts(),
      uiPreferences: defaultUIPreferences,
      encrypted: false,
    };

    // Validate the configuration
    const validation = validateBusinessConfig(configData);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.errors.join(', ')
      };
    }

    // Create the configuration (encryption will be handled in the database layer if needed)
    const configId = await addBusinessConfig(configData);

    return {
      success: true,
      configId
    };
  } catch (error) {
    console.error('Failed to create business configuration:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create business configuration'
    };
  }
}

/**
 * Retrieves and decrypts business configuration
 */
export async function getCurrentBusinessConfig(): Promise<BusinessConfig | null> {
  try {
    const config = await getBusinessConfig();
    if (!config) {
      return null;
    }

    // Decrypt if necessary
    return config.encrypted ? await decryptBusinessConfig(config) : config;
  } catch (error) {
    console.error('Failed to get business configuration:', error);
    return null;
  }
}

/**
 * Updates business configuration with validation and encryption
 */
export async function updateCurrentBusinessConfig(
  updates: Partial<Omit<BusinessConfig, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentConfig = await getCurrentBusinessConfig();
    if (!currentConfig) {
      return {
        success: false,
        error: 'No business configuration found'
      };
    }

    // Merge updates with current config
    const updatedConfig = {
      ...currentConfig,
      ...updates,
    };

    // Validate the updated configuration
    const validation = validateBusinessConfig(updatedConfig);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.errors.join(', ')
      };
    }

    // Update the configuration
    await updateBusinessConfig(currentConfig.id, updates);

    return { success: true };
  } catch (error) {
    console.error('Failed to update business configuration:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update business configuration'
    };
  }
}

/**
 * Checks if user needs onboarding
 */
export async function needsOnboarding(): Promise<boolean> {
  return await dbNeedsOnboarding();
}

/**
 * Completes the onboarding process
 */
export async function completeOnboarding(
  businessType: 'general' | 'legal',
  businessName: string
): Promise<{ success: boolean; configId?: string; error?: string }> {
  try {
    const configId = await dbCompleteOnboarding(businessType, businessName);
    return {
      success: true,
      configId
    };
  } catch (error) {
    console.error('Failed to complete onboarding:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to complete onboarding'
    };
  }
}

/**
 * Gets default expense categories for a business type
 */
export async function getDefaultExpenseCategories(businessType: 'general' | 'legal'): Promise<ExpenseCategory[]> {
  try {
    return await getExpenseCategories(businessType);
  } catch (error) {
    console.error('Failed to get default expense categories:', error);
    return [];
  }
}

/**
 * Gets UI preferences for the current business
 */
export async function getUIPreferences(): Promise<UIPreferences | null> {
  try {
    const config = await getCurrentBusinessConfig();
    return config?.uiPreferences || null;
  } catch (error) {
    console.error('Failed to get UI preferences:', error);
    return null;
  }
}

/**
 * Updates UI preferences
 */
export async function updateUIPreferences(
  preferences: Partial<UIPreferences>
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentConfig = await getCurrentBusinessConfig();
    if (!currentConfig) {
      return {
        success: false,
        error: 'No business configuration found'
      };
    }

    const updatedPreferences = {
      ...currentConfig.uiPreferences,
      ...preferences,
    };

    return await updateCurrentBusinessConfig({
      uiPreferences: updatedPreferences
    });
  } catch (error) {
    console.error('Failed to update UI preferences:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update UI preferences'
    };
  }
}

/**
 * Gets business type for conditional UI rendering
 */
export async function getBusinessType(): Promise<'general' | 'legal' | null> {
  try {
    const config = await getCurrentBusinessConfig();
    return config?.type || null;
  } catch (error) {
    console.error('Failed to get business type:', error);
    return null;
  }
}

/**
 * Checks if setup is complete
 */
export async function isSetupComplete(): Promise<boolean> {
  try {
    const config = await getCurrentBusinessConfig();
    return config?.setupComplete || false;
  } catch (error) {
    console.error('Failed to check setup status:', error);
    return false;
  }
}