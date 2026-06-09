import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

interface TenantCtx {
  companyId: string;
  userId: string;
}

const TenantContext = createContext<TenantCtx | null>(null);

export function TenantProvider({
  companyId,
  userId,
  children,
}: TenantCtx & { children: ReactNode }) {
  return (
    <TenantContext.Provider value={{ companyId, userId }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant(): TenantCtx | null {
  return useContext(TenantContext);
}
