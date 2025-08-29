import { completeOnboarding } from './database';

export async function initializeNewBusiness(userName: string, type: 'general' | 'legal' = 'general'): Promise<boolean> {
  try {
    const businessName = `${userName}'s ${type === 'legal' ? 'Legal Practice' : 'Business'}`;
    await completeOnboarding(type, businessName);
    return true;
  } catch (error) {
    console.error('Failed to initialize business configuration:', error);
    return false;
  }
}
