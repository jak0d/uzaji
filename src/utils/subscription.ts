// Subscription management utility
// Currently set to free access with placeholders for future Stripe integration

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: 'monthly' | 'annual';
  features: string[];
}

export interface UserSubscription {
  planId: string;
  status: 'active' | 'inactive' | 'trial' | 'cancelled';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

// Available subscription plans
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Uzaji Free',
    price: 0,
    interval: 'monthly',
    features: [
      'Basic transaction recording',
      'Dashboard metrics',
      'Products & services management',
      'Basic reporting'
    ]
  },
  {
    id: 'pro-monthly',
    name: 'Uzaji Pro',
    price: 29,
    interval: 'monthly',
    features: [
      'Everything in Free',
      'Professional invoicing',
      'Bill management',
      'Advanced reporting (P&L, Balance Sheet, Trial Balance)',
      'Client file tracking (Legal firms)',
      'File attachments',
      'Priority support'
    ]
  },
  {
    id: 'pro-annual',
    name: 'Uzaji Pro (Annual)',
    price: 290,
    interval: 'annual',
    features: [
      'Everything in Pro Monthly',
      '2 months free',
      'Advanced integrations',
      'Custom reporting'
    ]
  }
];

// Current implementation: All Pro features are FREE
// TODO: Integrate with Stripe for actual billing
export class SubscriptionService {
  private static instance: SubscriptionService;

  private constructor() {}

  static getInstance(): SubscriptionService {
    if (!SubscriptionService.instance) {
      SubscriptionService.instance = new SubscriptionService();
    }
    return SubscriptionService.instance;
  }

  // For now, everyone gets Pro access for free
  async getCurrentSubscription(): Promise<UserSubscription> {
    return {
      planId: 'pro-monthly',
      status: 'active',
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    };
  }

  // Check if user has access to Pro features
  async hasProAccess(): Promise<boolean> {
    // For now, always return true (free Pro access)
    return true;
  }

  // Check if user has access to specific feature
  async hasFeatureAccess(feature: string): Promise<boolean> {
    // For now, all features are accessible
    return true;
  }

  // Get current plan details
  async getCurrentPlan(): Promise<SubscriptionPlan> {
    const subscription = await this.getCurrentSubscription();
    return SUBSCRIPTION_PLANS.find(plan => plan.id === subscription.planId) || SUBSCRIPTION_PLANS[0];
  }

  // Placeholder for future Stripe integration
  async upgradeToProMonthly(): Promise<{ success: boolean; error?: string }> {
    // TODO: Integrate with Stripe
    console.log('Stripe integration placeholder: Upgrade to Pro Monthly');
    return { success: true };
  }

  async upgradeToProAnnual(): Promise<{ success: boolean; error?: string }> {
    // TODO: Integrate with Stripe
    console.log('Stripe integration placeholder: Upgrade to Pro Annual');
    return { success: true };
  }

  async cancelSubscription(): Promise<{ success: boolean; error?: string }> {
    // TODO: Integrate with Stripe
    console.log('Stripe integration placeholder: Cancel subscription');
    return { success: true };
  }

  // Placeholder for webhook handling
  async handleStripeWebhook(event: any): Promise<void> {
    // TODO: Handle Stripe webhooks for subscription events
    console.log('Stripe webhook placeholder:', event.type);
  }
}

export const subscriptionService = SubscriptionService.getInstance();