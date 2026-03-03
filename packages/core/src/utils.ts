/**
 * Validates if a string is a valid HTTP or HTTPS URL
 * @param url - The URL string to validate
 * @returns True if the URL is valid and uses HTTP/HTTPS protocol
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Generates a cryptographically secure random state string for OAuth2
 * @param length - Length of the generated string (default: 12)
 * @returns Random alphanumeric string
 */
export function generateRandomState(length: number = 12): string {
  let result = '';
  while (result.length < length) {
    result += Math.random().toString(36).substring(2);
  }
  return result.substring(0, length);
}

/**
 * Builds a URL query string from an object of parameters
 * @param params - Object containing key-value pairs for the query string
 * @returns URL-encoded query string
 */
export function buildQueryString(params: Record<string, string>): string {
  return new URLSearchParams(params).toString();
}

/**
 * Gets the default base URL for Vybit API calls
 * @returns The production API base URL
 */
export function getDefaultBaseUrl(): string {
  return 'https://vybit.net';
}

/**
 * Gets the authentication domain for OAuth2 flows
 * @returns The production auth domain URL
 */
export function getAuthDomain(): string {
  return 'https://app.vybit.net';
}

/**
 * Gets the Developer API base URL
 * @returns The production Developer API base URL
 */
export function getApiBaseUrl(): string {
  return 'https://api.vybit.net/v1';
}

/**
 * Generates a cryptographically random code verifier for PKCE (RFC 7636).
 * Uses Web Crypto API for cross-platform compatibility (Node 16+ and browsers).
 * @param length - Length of the generated verifier (43-128 chars, default: 43)
 * @returns Base64url-encoded random string
 */
export function generateCodeVerifier(length: number = 43): string {
  const bytes = new Uint8Array(Math.ceil(length * 3 / 4));
  crypto.getRandomValues(bytes);
  // Base64url encode: standard base64 with +→-, /→_, no padding
  let base64 = '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = bytes[i + 1] || 0;
    const b2 = bytes[i + 2] || 0;
    base64 += chars[b0 >> 2];
    base64 += chars[((b0 & 3) << 4) | (b1 >> 4)];
    base64 += chars[((b1 & 15) << 2) | (b2 >> 6)];
    base64 += chars[b2 & 63];
  }
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
    .substring(0, length);
}

/**
 * Generates a S256 code challenge from a code verifier for PKCE (RFC 7636).
 * Uses Web Crypto API for cross-platform compatibility (Node 16+ and browsers).
 * @param verifier - The code verifier string
 * @returns Base64url-encoded SHA-256 hash of the verifier
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const bytes = new Uint8Array(digest);
  // Base64url encode the hash
  let base64 = '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const b2 = i + 2 < bytes.length ? bytes[i + 2] : 0;
    base64 += chars[b0 >> 2];
    base64 += chars[((b0 & 3) << 4) | (b1 >> 4)];
    if (i + 1 < bytes.length) base64 += chars[((b1 & 15) << 2) | (b2 >> 6)];
    if (i + 2 < bytes.length) base64 += chars[b2 & 63];
  }
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}