// Auth context and hooks
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  getStoredToken,
  getStoredUser,
  setStoredUser,
  removeStoredAuth,
  setActiveUser,
  type User,
} from "@/lib/api/auth";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, refresh: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = getStoredToken();
    const storedUser = getStoredUser();
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(storedUser);
    }
    setIsLoading(false);
  }, []);

  const login = (newToken: string, refresh: string, newUser: User) => {
    localStorage.setItem("auth_token", newToken);
    localStorage.setItem("refresh_token", refresh);
    setStoredUser(newUser);
    setActiveUser(newUser.id);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    removeStoredAuth();
    setToken(null);
    setUser(null);
  };

  const updateUser = (u: User) => {
    setStoredUser(u);
    setUser(u);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        login,
        logout,
        updateUser,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
