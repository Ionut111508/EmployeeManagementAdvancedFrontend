import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api/endpoints';
import type { LoginResponse, Permission, UserAccess } from '../types/domain';

interface AuthContextValue {
  session: LoginResponse | null;
  access: UserAccess | null;
  isAuthenticated: boolean;
  login: (session: LoginResponse) => void;
  logout: () => void;
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredSession() {
  const rawSession = localStorage.getItem('authSession');
  if (!rawSession) return null;

  try {
    return JSON.parse(rawSession) as LoginResponse;
  } catch {
    localStorage.removeItem('authSession');
    localStorage.removeItem('authToken');
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<LoginResponse | null>(() => readStoredSession());
  const [access, setAccess] = useState<UserAccess | null>(null);

  useEffect(() => {
    let active = true;

    if (!session?.employeeId) {
      setAccess(null);
      return;
    }

    api.accessForEmployee(session.employeeId)
      .then(result => {
        if (active) setAccess(result);
      })
      .catch(() => {
        if (active) setAccess(null);
      });

    return () => { active = false; };
  }, [session?.employeeId]);

  const value = useMemo<AuthContextValue>(() => ({
    session,
    access,
    isAuthenticated: Boolean(session),
    login: nextSession => {
      localStorage.setItem('authSession', JSON.stringify(nextSession));
      if (nextSession.token) localStorage.setItem('authToken', nextSession.token);
      else localStorage.removeItem('authToken');
      setSession(nextSession);
    },
    logout: () => {
      localStorage.removeItem('authSession');
      localStorage.removeItem('authToken');
      setAccess(null);
      setSession(null);
    },
    hasPermission: permission => session?.permissions?.includes(permission) ?? false,
    hasAnyPermission: permissions => permissions.some(permission => session?.permissions?.includes(permission))
  }), [session, access]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
