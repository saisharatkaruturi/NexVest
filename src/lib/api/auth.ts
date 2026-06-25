// Auth API functions with backend + offline fallback
import { createServerFn } from "@tanstack/react-start";
import { API_ENDPOINTS } from "./config";

export interface User {
  id: string;
  email: string;
  name: string;
  is_active: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

const TOKEN_KEY = "nexvest:auth_token";
const REFRESH_KEY = "nexvest:refresh_token";
const USER_KEY = "nexvest:user";
const USERS_DIR_KEY = "nexvest:users";
const ACTIVE_USER_KEY = "nexvest:active_user";

interface StoredUser extends User {
  password: string;
  createdAt: number;
  isDemo?: boolean;
}

function readUsersDir(): Record<string, StoredUser> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(USERS_DIR_KEY);
    return raw ? (JSON.parse(raw) as Record<string, StoredUser>) : {};
  } catch {
    return {};
  }
}

function writeUsersDir(dir: Record<string, StoredUser>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(USERS_DIR_KEY, JSON.stringify(dir));
}

function ensureDemoAccount() {
  const dir = readUsersDir();
  if (!dir["demo@nexvest.app"]) {
    dir["demo@nexvest.app"] = {
      id: "u-demo-0001",
      email: "demo@nexvest.app",
      name: "Demo Investor",
      is_active: true,
      password: "demo1234",
      createdAt: Date.now(),
      isDemo: true,
    };
    writeUsersDir(dir);
  }
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY) || localStorage.getItem("auth_token");
}

export function setStoredToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function getStoredRefresh(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY) || localStorage.getItem("refresh_token");
}

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY) || localStorage.getItem("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function setStoredUser(user: User): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function removeStoredAuth(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem("auth_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
}

export function clearUserMarketState(userId: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(`nexvest:market-state-v1:${userId}`);
  if (localStorage.getItem(ACTIVE_USER_KEY) === userId) {
    localStorage.removeItem("nexvest:market-state-v1");
  }
}

export function setActiveUser(userId: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACTIVE_USER_KEY, userId);
}

export function getActiveUserId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_USER_KEY);
}

async function tryBackend<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 2500);
    // Race against the explicit AbortController
    const res = await Promise.race([
      fn(),
      new Promise<never>((_, rej) => setTimeout(() => rej(new Error("timeout")), 2500)),
    ]);
    clearTimeout(t);
    return res;
  } catch {
    return null;
  }
}

function mockAuthResponse(email: string, name?: string, userId?: string): AuthResponse {
  const access = `local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const refresh = `ref-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const id = userId || `u-${Date.now().toString(36)}`;
  return {
    access_token: access,
    refresh_token: refresh,
    token_type: "bearer",
    user: { id, email, name: name || email.split("@")[0], is_active: true },
  };
}

export const login = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => d as LoginRequest)
  .handler(async ({ data }) => {
    const { email, password } = data;
    if (!email || !password) throw new Error("Email and password are required");
    ensureDemoAccount();
    const key = email.toLowerCase();

    // Backend first (real DB has priority)
    const backend = await tryBackend(async () => {
      const r = await fetch(API_ENDPOINTS.auth.login, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (r.status === 401) {
        const err: any = new Error("Incorrect email or password");
        err.code = "UNAUTHORIZED";
        throw err;
      }
      if (r.status === 404) {
        const err: any = new Error("No account found. Please sign up first.");
        err.code = "NOT_FOUND";
        throw err;
      }
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return (await r.json()) as AuthResponse;
    });

    if (backend) return backend;

    // Backend unreachable → fall back to local directory (signup or demo)
    const dir = readUsersDir();
    const local = dir[key];
    if (local) {
      if (local.password !== password) {
        throw new Error("Incorrect email or password");
      }
      return mockAuthResponse(local.email, local.name, local.id);
    }

    // Backend down AND no local account — reject with a clear, helpful message
    throw new Error("No account found with this email. Please sign up first.");
  });

export const signup = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => d as SignupRequest)
  .handler(async ({ data }) => {
    const { email, password, name } = data;
    if (!email || !password) throw new Error("Email and password are required");
    if (password.length < 6) throw new Error("Password must be at least 6 characters");
    ensureDemoAccount();
    const key = email.toLowerCase();

    // Backend first
    const backend = await tryBackend(async () => {
      const r = await fetch(API_ENDPOINTS.auth.signup, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });
      if (r.status === 409 || r.status === 400) {
        const err: any = new Error("An account with this email already exists. Please sign in.");
        err.code = "CONFLICT";
        throw err;
      }
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return (await r.json()) as AuthResponse;
    });

    if (backend) return backend;

    // Backend unreachable → write to local directory
    const dir = readUsersDir();
    if (dir[key]) throw new Error("An account with this email already exists. Please sign in.");

    const newUser: StoredUser = {
      id: `u-${Date.now().toString(36)}`,
      email: key,
      name: name || key.split("@")[0],
      is_active: true,
      password,
      createdAt: Date.now(),
    };
    dir[key] = newUser;
    writeUsersDir(dir);
    return mockAuthResponse(newUser.email, newUser.name, newUser.id);
  });

export const logout = createServerFn({ method: "POST" })
  .handler(async () => {
    try {
      await fetch(API_ENDPOINTS.auth.logout, { method: "POST" });
    } catch {
      /* ignore */
    }
    return { success: true };
  });
