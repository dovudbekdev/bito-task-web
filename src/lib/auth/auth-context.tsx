import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { setTokens, clearTokens, getRefreshToken } from '@/lib/auth/token-storage';
import { getHomePathForRole } from '@/lib/utils';
import { dataSource } from '@/services';
import type { AuthSession, AuthUser, LoginCredentials, Tenant } from '@/types';

const SESSION_KEY = 'bito-auth-session';

interface AuthContextValue {
  user: AuthUser | null;
  tenants: Tenant[];
  isAuthenticated: boolean;
  isLoading: boolean;
  isSwitching: boolean;
  isRefreshingTenants: boolean;
  login: (credentials: LoginCredentials) => Promise<string>;
  logout: () => Promise<void>;
  switchTenant: (tenantId: number) => Promise<void>;
  refreshTenants: () => Promise<Tenant[]>;
  ensureActiveTenant: () => Promise<void>;
  updateSession: (session: AuthSession) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function loadSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch {
    return null;
  }
}

function saveSession(session: AuthSession | null): void {
  if (session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setTokens(session.accessToken, session.refreshToken);
  } else {
    localStorage.removeItem(SESSION_KEY);
    clearTokens();
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSwitching, setIsSwitching] = useState(false);
  const [isRefreshingTenants, setIsRefreshingTenants] = useState(false);

  useEffect(() => {
    const stored = loadSession();
    setSession(stored);
    setIsLoading(false);
  }, []);

  const updateSession = useCallback((next: AuthSession) => {
    setSession(next);
    saveSession(next);
  }, []);

  const switchTenant = useCallback(async (tenantId: number) => {
    setIsSwitching(true);
    try {
      const response = await dataSource.switchTenant(tenantId);
      setSession((prev) => {
        if (!prev) return prev;
        const next: AuthSession = {
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
          user: {
            ...prev.user,
            ...response.user,
            name: prev.user.name,
            tenantId: response.user.tenantId,
          },
          tenants: prev.tenants,
        };
        saveSession(next);
        return next;
      });
    } finally {
      setIsSwitching(false);
    }
  }, []);

  const refreshTenants = useCallback(async (): Promise<Tenant[]> => {
    const current = loadSession();
    if (!current || current.user.role !== 'admin') {
      return current?.tenants ?? [];
    }

    setIsRefreshingTenants(true);
    try {
      const result = await dataSource.getTenants({ page: 1, limit: 100 });
      const tenants = result.data;
      setSession((prev) => {
        if (!prev || prev.user.role !== 'admin') return prev;
        const next = { ...prev, tenants };
        saveSession(next);
        return next;
      });
      return tenants;
    } finally {
      setIsRefreshingTenants(false);
    }
  }, []);

  const ensureActiveTenant = useCallback(async () => {
    const current = loadSession();
    if (!current || current.user.role !== 'admin') return;
    if (current.user.tenantId) return;
    if (current.tenants.length === 0) return;
    await switchTenant(current.tenants[0].id);
  }, [switchTenant]);

  useEffect(() => {
    if (isLoading || !session || session.user.role !== 'admin') return;

    let cancelled = false;
    (async () => {
      await refreshTenants();
      if (!cancelled) {
        await ensureActiveTenant();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [session?.user.id, isLoading, refreshTenants, ensureActiveTenant]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const initial = await dataSource.login(credentials);
    let accessToken = initial.accessToken;
    let refreshToken = initial.refreshToken;
    let user = initial.user;
    let tenants = initial.tenants ?? [];

    if (user.role === 'admin') {
      setTokens(accessToken, refreshToken);
      const refreshed = await dataSource.getTenants({ page: 1, limit: 100 });
      tenants = refreshed.data;

      if (tenants.length > 0) {
        const switched = await dataSource.switchTenant(tenants[0].id);
        accessToken = switched.accessToken;
        refreshToken = switched.refreshToken;
        user = {
          ...initial.user,
          ...switched.user,
          name: initial.user.name,
          tenantId: switched.user.tenantId,
        };
      }
    }

    const next: AuthSession = {
      accessToken,
      refreshToken,
      user,
      tenants,
    };

    updateSession(next);
    return getHomePathForRole(user.role);
  }, [updateSession]);

  const logout = useCallback(async () => {
    try {
      if (getRefreshToken()) {
        await dataSource.logout();
      }
    } catch {
      // ignore logout errors
    }
    setSession(null);
    saveSession(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      tenants: session?.tenants ?? [],
      isAuthenticated: !!session?.user,
      isLoading,
      isSwitching,
      isRefreshingTenants,
      login,
      logout,
      switchTenant,
      refreshTenants,
      ensureActiveTenant,
      updateSession,
    }),
    [
      session,
      isLoading,
      isSwitching,
      isRefreshingTenants,
      login,
      logout,
      switchTenant,
      refreshTenants,
      ensureActiveTenant,
      updateSession,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth AuthProvider ichida ishlatilishi kerak');
  }
  return ctx;
}
