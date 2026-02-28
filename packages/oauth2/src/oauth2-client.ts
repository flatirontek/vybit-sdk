import {
  generateRandomState,
  getAuthDomain,
  getDefaultBaseUrl,
  isValidUrl,
  VybitAuthError,
  VybitAPIError,
  VybitValidationError,
  OAuth2Config,
  TokenResponse,
  AuthorizationUrlOptions,
} from '@vybit/core';

/**
 * OAuth2 client for Vybit authentication
 *
 * This client handles the OAuth2 authorization flow for Vybit, including
 * authorization URL generation, token exchange, and token verification.
 *
 * Once you have obtained an access token, use {@link VybitAPIClient} from
 * `@vybit/api-sdk` with the `accessToken` option for full Developer API access.
 *
 * @example
 * ```typescript
 * import { VybitOAuth2Client } from '@vybit/oauth2-sdk';
 * import { VybitAPIClient } from '@vybit/api-sdk';
 *
 * // 1. Set up OAuth2 client
 * const oauth = new VybitOAuth2Client({
 *   clientId: 'your-client-id',
 *   clientSecret: 'your-client-secret',
 *   redirectUri: 'https://yourapp.com/oauth/callback'
 * });
 *
 * // 2. Generate authorization URL and redirect user
 * const authUrl = oauth.getAuthorizationUrl();
 *
 * // 3. Exchange authorization code for token (in callback handler)
 * const token = await oauth.exchangeCodeForToken(authCode);
 *
 * // 4. Use token with API client for full Developer API access
 * const api = new VybitAPIClient({ accessToken: token.access_token });
 * const vybits = await api.listVybits();
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
   * with {@link VybitAPIClient} for full Developer API access.
   *
   * @param code - Authorization code from the OAuth2 callback
   * @returns Promise resolving to token response with access token
   * @throws {VybitAPIError} When token exchange fails
   * @throws {VybitAuthError} When authorization is denied
   *
   * @example
   * ```typescript
   * const token = await client.exchangeCodeForToken(authCode);
   * // Use token with API client
   * const api = new VybitAPIClient({ accessToken: token.access_token });
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

  /**
   * Verifies that an access token is valid
   * @param accessToken - Token to verify (uses stored token if not provided)
   * @returns True if the token is valid
   * @throws {VybitAuthError} When no token is available
   */
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

  /**
   * Manually sets the access token
   * @param token - The access token to store
   */
  setAccessToken(token: string): void {
    this.accessToken = token;
  }

  /**
   * Gets the currently stored access token
   * @returns The stored access token, or undefined if not set
   */
  getAccessToken(): string | undefined {
    return this.accessToken;
  }
}
