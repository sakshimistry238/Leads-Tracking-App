import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';

interface AuthContextValue {
  isAuthenticated: boolean;
  login: (username: string, password: string) => void;
  logout: () => void;
  username: string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Hard-coded demo credentials — swap for a real auth flow if needed
const VALID_USERNAME = 'admin';
const VALID_PASSWORD = 'admin123';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(
    () => sessionStorage.getItem('auth_token'),
  );
  const [username, setUsername] = useState<string>(
    () => sessionStorage.getItem('auth_user') ?? '',
  );

  const login = useCallback((user: string, pass: string) => {
    if (user !== VALID_USERNAME || pass !== VALID_PASSWORD) {
      throw new Error('Invalid username or password');
    }
    const encoded = btoa(`${user}:${pass}`);
    sessionStorage.setItem('auth_token', encoded);
    sessionStorage.setItem('auth_user', user);
    setToken(encoded);
    setUsername(user);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_user');
    setToken(null);
    setUsername('');
  }, []);

  return (
    <AuthContext.Provider
      value={{ isAuthenticated: !!token, login, logout, username }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
