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
  UserInfo,
} from '@vybit/core';

/**
 * Reads the error message from a failed OAuth response. The token endpoint answers
 * with `{errors: [{message}]}`; the UserInfo endpoint with `{error, error_description}`.
 */
async function readErrorMessage(response: Response): Promise<string> {
  let data: any = {};
  try {
    data = await response.json();
  } catch {
    // non-JSON body; fall back to the status text
  }
  return data?.errors?.[0]?.message || data?.error_description || data?.error || response.statusText;
}

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
 * // --- PKCE flow (public clients, no client_secret needed) ---
 * import { generateCodeVerifier, generateCodeChallenge } from '@vybit/core';
 *
 * const pkceClient = new VybitOAuth2Client({
 *   clientId: 'your-client-id',
 *   redirectUri: 'https://yourapp.com/oauth/callback'
 * });
 * const verifier = generateCodeVerifier();
 * const challenge = await generateCodeChallenge(verifier);
 * const pkceAuthUrl = pkceClient.getAuthorizationUrl({ codeChallenge: challenge });
 * const pkceToken = await pkceClient.exchangeCodeForToken(authCode, verifier);
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
   *   scope: 'openid email rw', // add openid to receive an id_token
   *   nonce: 'unique-nonce-value'
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

    if (options.nonce) {
      params.append('nonce', options.nonce);
    }

    if (options.codeChallenge) {
      params.append('code_challenge', options.codeChallenge);
      params.append('code_challenge_method', options.codeChallengeMethod || 'S256');
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
   * The configured redirect URI is sent with the request so the server can check it
   * against the one used at authorization. When the `openid` scope was granted, the
   * response also carries an `id_token`.
   *
   * @param code - Authorization code from the OAuth2 callback
   * @param codeVerifier - PKCE code verifier, when a code challenge was sent at authorization
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
  async exchangeCodeForToken(code: string, codeVerifier?: string): Promise<TokenResponse> {
    const authDomain = getAuthDomain();
    const tokenUrl = `${authDomain}/service/token`;

    const formData = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
    });

    if (this.config.clientSecret) {
      formData.append('client_secret', this.config.clientSecret);
    }

    if (codeVerifier) {
      formData.append('code_verifier', codeVerifier);
    }

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
          `Token exchange failed: ${await readErrorMessage(response)}`,
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
   * Reads OpenID Connect claims for the person who authorized an access token
   *
   * Requires a token granted with the `openid` scope; `email` and `email_verified`
   * are included only when the `email` scope was also granted.
   *
   * @param accessToken - Token to use (uses stored token if not provided)
   * @returns The `sub` (stable Vybit account key) and, with the `email` scope, email claims
   * @throws {VybitAuthError} When no token is available, or the token is invalid or lacks the `openid` scope
   * @throws {VybitAPIError} When the request fails for another reason
   *
   * @example
   * ```typescript
   * const authUrl = client.getAuthorizationUrl({ scope: 'openid email rw' });
   * // ...after the callback
   * const token = await client.exchangeCodeForToken(authCode);
   * const user = await client.getUserInfo();
   * console.log(user.sub, user.email, user.email_verified);
   * ```
   */
  async getUserInfo(accessToken?: string): Promise<UserInfo> {
    const token = accessToken || this.accessToken;
    if (!token) {
      throw new VybitAuthError('No access token available');
    }

    const userInfoUrl = `${getAuthDomain()}/oauth/userinfo`;

    let response: Response;
    try {
      response = await fetch(userInfoUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      throw new VybitAPIError(`Network error during userinfo request: ${error}`);
    }

    if (!response.ok) {
      const message = `UserInfo request failed: ${await readErrorMessage(response)}`;
      if (response.status === 401 || response.status === 403) {
        throw new VybitAuthError(message, response.status);
      }
      throw new VybitAPIError(message, response.status);
    }

    return response.json();
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
