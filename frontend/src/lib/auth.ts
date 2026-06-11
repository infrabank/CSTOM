/**
 * Authentication utilities for CSTOM.
 * Access token: regular cookie (readable by middleware + client for role display)
 * Refresh token: HttpOnly cookie (set by Next.js API routes, not accessible via JS)
 */

const ACCESS_TOKEN_KEY = "cstom_access_token";

export interface TokenPair {
  access: string;
  refresh?: string;
}

export interface AuthUser {
  role: string;
  display_name: string;
}

/**
 * Check if code is running on client side.
 */
function isClient(): boolean {
  return typeof window !== "undefined";
}

/**
 * Get access token from cookie.
 */
export function getAccessToken(): string | null {
  if (!isClient()) return null;

  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === ACCESS_TOKEN_KEY) {
      return decodeURIComponent(value);
    }
  }
  return null;
}

/**
 * Clear access token cookie. Refresh token is cleared by the API route.
 */
export function clearTokens(): void {
  if (!isClient()) return;

  document.cookie = `${ACCESS_TOKEN_KEY}=; path=/; max-age=0`;
}

/**
 * Check if user is authenticated (has access token).
 */
export function isAuthenticated(): boolean {
  return getAccessToken() !== null;
}

/**
 * Parse JWT token payload (without verification).
 */
export function parseToken(token: string): AuthUser | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const payload = JSON.parse(atob(parts[1]));
    return {
      role: payload.role || "",
      display_name: payload.display_name || "",
    };
  } catch {
    return null;
  }
}

/**
 * Get current user info from access token.
 */
export function getCurrentUser(): AuthUser | null {
  const token = getAccessToken();
  if (!token) return null;
  return parseToken(token);
}
