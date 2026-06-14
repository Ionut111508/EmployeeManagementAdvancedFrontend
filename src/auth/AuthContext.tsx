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
  localStorage.removeItem('authSession');
  localStorage.removeItem('authToken');
  const rawSession = sessionStorage.getItem('authSession');
  if (!rawSession) return null;

  try {
    const storedSession = JSON.parse(rawSession) as LoginResponse;
    if (!storedSession.token || !storedSession.expiresAt || new Date(storedSession.expiresAt).getTime() <= Date.now()) {
      sessionStorage.removeItem('authSession');
      sessionStorage.removeItem('authToken');
      return null;
    }
    return storedSession;
  } catch {
    sessionStorage.removeItem('authSession');
    sessionStorage.removeItem('authToken');
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

  useEffect(() => {
    const clearSession = () => {
      sessionStorage.removeItem('authSession');
      sessionStorage.removeItem('authToken');
      setAccess(null);
      setSession(null);
    };
    window.addEventListener('auth:unauthorized', clearSession);

    const expiresIn = session?.expiresAt ? new Date(session.expiresAt).getTime() - Date.now() : 0;
    const timeout = expiresIn > 0 ? window.setTimeout(clearSession, expiresIn) : undefined;
    return () => {
      window.removeEventListener('auth:unauthorized', clearSession);
      if (timeout) window.clearTimeout(timeout);
    };
  }, [session?.expiresAt]);

  const value = useMemo<AuthContextValue>(() => ({
    session,
    access,
    isAuthenticated: Boolean(session),
    login: nextSession => {
      sessionStorage.setItem('authSession', JSON.stringify(nextSession));
      if (nextSession.token) sessionStorage.setItem('authToken', nextSession.token);
      else sessionStorage.removeItem('authToken');
      setSession(nextSession);
    },
    logout: () => {
      sessionStorage.removeItem('authSession');
      sessionStorage.removeItem('authToken');
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
