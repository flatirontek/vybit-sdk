import {
  generateRandomState,
  getAuthDomain,
  getDefaultBaseUrl,
  isValidUrl,
  VybitAuthError,
  VybitAPIError,
  VybitValidationError,
  Vybit,
} from '@vybit/core';
import {
  OAuth2Config,
  TokenResponse,
  AuthorizationUrlOptions,
  TriggerOptions,
  TriggerResponse,
} from './types';

/**
 * OAuth2 client for Vybit authentication and API access
 * 
 * This client handles the complete OAuth2 flow for Vybit authentication,
 * including authorization URL generation, token exchange, and authenticated API calls.
 * 
 * @example
 * ```typescript
 * const client = new VybitOAuth2Client({
 *   clientId: 'your-client-id',
 *   clientSecret: 'your-client-secret',
 *   redirectUri: 'https://yourapp.com/oauth/callback'
 * });
 * 
 * // Generate authorization URL
 * const authUrl = client.getAuthorizationUrl();
 * 
 * // Exchange authorization code for token
 * const token = await client.exchangeCodeForToken(authCode);
 * 
 * // Make authenticated API calls
 * const vybits = await client.getVybitList();
 * ```
 */
export class VybitOAuth2Client {
  private config: OAuth2Config;
  private accessToken?: string;

  /**
   * Creates a new Vybit OAuth2 client
   * @param config - OAuth2 configuration including client credentials and redirect URI
   * @throws {VybitValidationError} When configuration is invalid
   */
  constructor(config: OAuth2Config) {
    this.validateConfig(config);
    this.config = config;
  }

  private validateConfig(config: OAuth2Config): void {
    if (!config.clientId) {
      throw new VybitValidationError('Client ID is required');
    }
    if (!config.clientSecret) {
      throw new VybitValidationError('Client Secret is required');
    }
    if (!config.redirectUri) {
      throw new VybitValidationError('Redirect URI is required');
    }
    if (!isValidUrl(config.redirectUri)) {
      throw new VybitValidationError('Redirect URI must be a valid URL');
    }
  }

  /**
   * Generates an OAuth2 authorization URL for user authentication
   * 
   * Direct users to this URL to begin the OAuth2 authorization flow.
   * After authorization, users will be redirected to your configured redirect URI
   * with an authorization code.
   * 
   * @param options - Optional parameters for the authorization URL
   * @returns Complete authorization URL for user redirection
   * 
   * @example
   * ```typescript
   * const authUrl = client.getAuthorizationUrl({
   *   state: 'unique-state-value',
   *   scope: 'read write'
   * });
   * // Redirect user to authUrl
   * ```
   */
  getAuthorizationUrl(options: AuthorizationUrlOptions = {}): string {
    const state = options.state || generateRandomState();
    const authDomain = getAuthDomain();
    
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      state,
    });

    if (options.scope) {
      params.append('scope', options.scope);
    }

    return `${authDomain}?${params.toString()}`;
  }

  /**
   * Exchanges an authorization code for an access token
   * 
   * Call this method with the authorization code received from the redirect URI
   * after successful user authorization. The returned access token can be used
   * for authenticated API calls.
   * 
   * @param code - Authorization code from the OAuth2 callback
   * @returns Promise resolving to token response with access token
   * @throws {VybitAPIError} When token exchange fails
   * @throws {VybitAuthError} When authorization is denied
   * 
   * @example
   * ```typescript
   * // Handle OAuth2 callback
   * const urlParams = new URLSearchParams(window.location.search);
   * const code = urlParams.get('code');
   * 
   * if (code) {
   *   const token = await client.exchangeCodeForToken(code);
   *   console.log('Access token:', token.access_token);
   * }
   * ```
   */
  async exchangeCodeForToken(code: string): Promise<TokenResponse> {
    const authDomain = getAuthDomain();
    const tokenUrl = `${authDomain}/service/token`;

    const formData = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
    });

    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      if (!response.ok) {
        throw new VybitAPIError(
          `Token exchange failed: ${response.statusText}`,
          response.status
        );
      }

      const data = await response.json();
      
      if (data.error) {
        throw new VybitAuthError(`Token exchange error: ${data.error}`);
      }

      this.accessToken = data.access_token;
      return data;
    } catch (error) {
      if (error instanceof VybitAPIError || error instanceof VybitAuthError) {
        throw error;
      }
      throw new VybitAPIError(`Network error during token exchange: ${error}`);
    }
  }

  async verifyToken(accessToken?: string): Promise<boolean> {
    const token = accessToken || this.accessToken;
    if (!token) {
      throw new VybitAuthError('No access token available');
    }

    const baseUrl = getDefaultBaseUrl();
    const verifyUrl = `${baseUrl}/service/test`;

    try {
      const response = await fetch(verifyUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.status === 'ok';
    } catch {
      return false;
    }
  }

  async getVybitList(accessToken?: string): Promise<Vybit[]> {
    const token = accessToken || this.accessToken;
    if (!token) {
      throw new VybitAuthError('No access token available');
    }

    const baseUrl = getDefaultBaseUrl();
    const listUrl = `${baseUrl}/rest/vybit_list`;

    try {
      const response = await fetch(listUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new VybitAPIError(
          `Failed to fetch vybit list: ${response.statusText}`,
          response.status
        );
      }

      const data = await response.json();
      
      // Convert object with numeric keys to array
      return Object.values(data);
    } catch (error) {
      if (error instanceof VybitAPIError) {
        throw error;
      }
      throw new VybitAPIError(`Network error fetching vybit list: ${error}`);
    }
  }

  async sendVybitNotification(
    triggerKey: string,
    options: TriggerOptions = {},
    accessToken?: string
  ): Promise<TriggerResponse> {
    const token = accessToken || this.accessToken;
    if (!token) {
      throw new VybitAuthError('No access token available');
    }

    // Validate URL parameters
    if (options.imageUrl && !isValidUrl(options.imageUrl)) {
      throw new VybitValidationError('Image URL must be a valid URL');
    }
    if (options.linkUrl && !isValidUrl(options.linkUrl)) {
      throw new VybitValidationError('Link URL must be a valid URL');
    }

    const baseUrl = getDefaultBaseUrl();
    const triggerUrl = `${baseUrl}/fire/${triggerKey}`;

    // Build payload
    const payload: any = {};
    if (options.message) payload.message = options.message;
    if (options.imageUrl) payload.imageUrl = options.imageUrl;
    if (options.linkUrl) payload.linkUrl = options.linkUrl;
    if (options.log) payload.log = options.log;

    try {
      const response = await fetch(triggerUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new VybitAPIError(
          `Failed to send vybit notification: ${response.statusText}`,
          response.status
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof VybitAPIError) {
        throw error;
      }
      throw new VybitAPIError(`Network error sending notification: ${error}`);
    }
  }

  setAccessToken(token: string): void {
    this.accessToken = token;
  }

  getAccessToken(): string | undefined {
    return this.accessToken;
  }
}