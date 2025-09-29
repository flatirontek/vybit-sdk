/**
 * Core configuration for Vybit SDK
 */
export interface VybitConfig {
  /** Base URL for API calls. Defaults to https://vybit.net */
  baseUrl?: string;
}

/**
 * OAuth2 credentials for Vybit authentication
 */
export interface VybitCredentials {
  /** OAuth2 client ID from your Vybit app */
  clientId: string;
  /** OAuth2 client secret from your Vybit app */
  clientSecret: string;
  /** Redirect URI configured in your Vybit app */
  redirectUri: string;
}

/**
 * Standard error response from Vybit API
 */
export interface VybitError {
  /** Error code identifier */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Additional error details */
  details?: any;
}

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T = any> {
  /** Whether the request was successful */
  success: boolean;
  /** Response data when successful */
  data?: T;
  /** Error information when unsuccessful */
  error?: VybitError;
}

/**
 * Vybit notification configuration
 */
export interface Vybit {
  /** Display name of the vybit */
  name: string;
  /** Unique trigger key for this vybit */
  triggerKey: string;
  /** Additional vybit properties */
  [key: string]: any;
}