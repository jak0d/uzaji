import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getBusinessType, updateCurrentBusinessConfig } from '../utils/businessConfig';

interface BusinessContextType {
  businessType: 'general' | 'legal' | null;
  loading: boolean;
  error: string | null;
  setBusinessType: (type: 'general' | 'legal') => Promise<void>;
  refetchBusinessType: () => Promise<void>;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export function BusinessProvider({ children }: { children: ReactNode }) {
  const [businessType, setBusinessTypeInternal] = useState<'general' | 'legal' | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetchBusinessType = async () => {
    try {
      setLoading(true);
      setError(null);
      const type = await getBusinessType();
      setBusinessTypeInternal(type);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load business type');
      setBusinessTypeInternal(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refetchBusinessType();
  }, []);

  const setBusinessType = async (type: 'general' | 'legal') => {
    try {
      setLoading(true);
      setError(null);
      await updateCurrentBusinessConfig({ type });
      setBusinessTypeInternal(type);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update business type');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <BusinessContext.Provider value={{
      businessType,
      loading,
      error,
      setBusinessType,
      refetchBusinessType
    }}>
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  const context = useContext(BusinessContext);
  if (context === undefined) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  return context;
}