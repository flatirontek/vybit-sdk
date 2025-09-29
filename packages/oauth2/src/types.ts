/**
 * OAuth2 configuration for Vybit authentication
 */
export interface OAuth2Config {
  /** OAuth2 client ID from your Vybit developer account */
  clientId: string;
  /** OAuth2 client secret from your Vybit developer account */
  clientSecret: string;
  /** Redirect URI that matches your Vybit app configuration */
  redirectUri: string;
}

/**
 * OAuth2 token response from successful authentication
 */
export interface TokenResponse {
  /** Access token for authenticated API calls */
  access_token: string;
  /** Token type (typically "Bearer") */
  token_type: string;
  /** Token expiration time in seconds (optional) */
  expires_in?: number;
  /** Refresh token for token renewal (optional) */
  refresh_token?: string;
  /** Granted scopes for this token (optional) */
  scope?: string;
}

/**
 * Options for generating OAuth2 authorization URLs
 */
export interface AuthorizationUrlOptions {
  /** Custom state parameter for security (auto-generated if not provided) */
  state?: string;
  /** Requested OAuth2 scopes (space-separated) */
  scope?: string;
}

/**
 * Options for triggering vybit notifications
 */
export interface TriggerOptions {
  /** Custom message text for the notification */
  message?: string;
  /** URL to an image to display with the notification */
  imageUrl?: string;
  /** URL to open when the notification is clicked */
  linkUrl?: string;
  /** Custom log message for debugging */
  log?: string;
}

/**
 * Response from triggering a vybit notification
 */
export interface TriggerResponse {
  /** Result code (1 = success) */
  result: number;
  /** Processing key for tracking the notification */
  plk: string;
}