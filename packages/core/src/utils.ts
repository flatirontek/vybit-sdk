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