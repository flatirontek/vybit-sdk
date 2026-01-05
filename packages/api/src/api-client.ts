import {
  getApiBaseUrl,
  VybitAPIError,
  VybitAuthError,
  VybitValidationError,
} from '@vybit/core';
import {
  VybitAPIConfig,
  PaginationParams,
  SearchParams,
  StatusResponse,
  Profile,
  Meter,
  Vybit,
  VybitCreateParams,
  VybitUpdateParams,
  VybitTriggerParams,
  VybitTriggerResponse,
  VybitFollow,
  VybitFollowUpdateParams,
  SubscriberSendParams,
  SubscriberSendResponse,
  Sound,
  Log,
  Peep,
  DeleteResponse,
} from './types';

/**
 * Vybit Developer API client
 *
 * Provides programmatic access to manage vybits, subscriptions, sounds,
 * and notification logs using the Vybit Developer API.
 *
 * @example
 * ```typescript
 * const client = new VybitAPIClient({
 *   apiKey: 'your-api-key-from-developer-portal'
 * });
 *
 * // Get API status
 * const status = await client.getStatus();
 *
 * // Create a vybit
 * const vybit = await client.createVybit({
 *   name: 'Server Alert',
 *   soundKey: 'sound123abc',
 *   triggerType: 'webhook'
 * });
 *
 * // List vybits with pagination
 * const vybits = await client.listVybits({ limit: 10, offset: 0 });
 * ```
 */
export class VybitAPIClient {
  private config: VybitAPIConfig;
  private baseUrl: string;

  /**
   * Creates a new Vybit Developer API client
   * @param config - API configuration including API key
   * @throws {VybitValidationError} When configuration is invalid
   */
  constructor(config: VybitAPIConfig) {
    this.validateConfig(config);
    this.config = config;
    this.baseUrl = config.baseUrl || getApiBaseUrl();
  }

  private validateConfig(config: VybitAPIConfig): void {
    if (!config.apiKey) {
      throw new VybitValidationError('API key is required');
    }
  }

  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'X-API-Key': this.config.apiKey,
      ...( options.headers as Record<string, string>),
    };

    if (options.body && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new VybitAuthError('Invalid or missing API key', response.status);
        }
        if (response.status === 429) {
          throw new VybitAPIError('Rate limit exceeded', response.status);
        }
        const errorData = await response.json().catch(() => ({}));
        throw new VybitAPIError(
          errorData.message || `API request failed: ${response.statusText}`,
          response.status
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof VybitAPIError || error instanceof VybitAuthError) {
        throw error;
      }
      throw new VybitAPIError(`Network error: ${error}`);
    }
  }

  private buildQueryParams(params?: PaginationParams | SearchParams): string {
    if (!params) return '';

    const query = new URLSearchParams();
    if (params.offset !== undefined) query.append('offset', String(params.offset));
    if (params.limit !== undefined) query.append('limit', String(params.limit));
    if ('search' in params && params.search) query.append('search', params.search);

    const queryString = query.toString();
    return queryString ? `?${queryString}` : '';
  }

  // ==================== Status & Utility ====================

  /**
   * Check API health status
   * @returns API status response
   */
  async getStatus(): Promise<StatusResponse> {
    return this.request<StatusResponse>('/status');
  }

  /**
   * Get usage metrics and tier limits
   * @returns Usage statistics and capacity limits
   */
  async getMeter(): Promise<Meter> {
    return this.request<Meter>('/meter');
  }

  // ==================== Profile ====================

  /**
   * Get user profile information
   * @returns User profile data
   */
  async getProfile(): Promise<Profile> {
    return this.request<Profile>('/profile');
  }

  // ==================== Vybits ====================

  /**
   * List vybits owned by the authenticated user
   * @param params - Pagination and search parameters
   * @returns Array of vybits
   */
  async listVybits(params?: SearchParams): Promise<Vybit[]> {
    const query = this.buildQueryParams(params);
    return this.request<Vybit[]>(`/vybits${query}`);
  }

  /**
   * Get a specific vybit by key
   * @param key - Vybit key
   * @returns Vybit details
   */
  async getVybit(key: string): Promise<Vybit> {
    return this.request<Vybit>(`/vybit/${key}`);
  }

  /**
   * Create a new vybit
   * @param params - Vybit creation parameters
   * @returns Created vybit
   */
  async createVybit(params: VybitCreateParams): Promise<Vybit> {
    return this.request<Vybit>('/vybit', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Update a vybit (full update)
   * @param key - Vybit key
   * @param params - Vybit update parameters
   * @returns Updated vybit
   */
  async updateVybit(key: string, params: VybitUpdateParams): Promise<Vybit> {
    return this.request<Vybit>(`/vybit/${key}`, {
      method: 'PUT',
      body: JSON.stringify(params),
    });
  }

  /**
   * Update a vybit (partial update)
   * @param key - Vybit key
   * @param params - Vybit update parameters
   * @returns Updated vybit
   */
  async patchVybit(key: string, params: VybitUpdateParams): Promise<Vybit> {
    return this.request<Vybit>(`/vybit/${key}`, {
      method: 'PATCH',
      body: JSON.stringify(params),
    });
  }

  /**
   * Delete a vybit
   * @param key - Vybit key
   * @returns Delete confirmation
   */
  async deleteVybit(key: string): Promise<DeleteResponse> {
    return this.request<DeleteResponse>(`/vybit/${key}`, {
      method: 'DELETE',
    });
  }

  /**
   * Trigger a vybit notification as the owner
   * @param key - Vybit key
   * @param params - Optional notification content to override defaults
   * @returns Trigger response with log key
   *
   * @example
   * ```typescript
   * const result = await client.triggerVybit('vybit123abc', {
   *   message: 'Server maintenance complete',
   *   imageUrl: 'https://example.com/status-ok.jpg'
   * });
   * console.log('Notification triggered, log key:', result.plk);
   * ```
   */
  async triggerVybit(key: string, params?: VybitTriggerParams): Promise<VybitTriggerResponse> {
    return this.request<VybitTriggerResponse>(`/vybit/${key}/trigger`, {
      method: 'POST',
      body: params ? JSON.stringify(params) : undefined,
    });
  }

  // ==================== Subscriptions ====================

  /**
   * List public vybits available for subscription
   * @param params - Pagination and search parameters
   * @returns Array of public vybits
   */
  async listPublicVybits(params?: SearchParams): Promise<Vybit[]> {
    const query = this.buildQueryParams(params);
    return this.request<Vybit[]>(`/subscriptions/public${query}`);
  }

  /**
   * Get a public vybit by subscription key
   * @param key - Subscription key
   * @returns Public vybit details
   */
  async getPublicVybit(key: string): Promise<Vybit> {
    return this.request<Vybit>(`/subscription/${key}`);
  }

  // ==================== Vybit Subscriptions (Follows) ====================

  /**
   * List vybit subscriptions (follows)
   * @param params - Pagination and search parameters
   * @returns Array of vybit follows
   */
  async listVybitFollows(params?: SearchParams): Promise<VybitFollow[]> {
    const query = this.buildQueryParams(params);
    return this.request<VybitFollow[]>(`/subscriptions/following${query}`);
  }

  /**
   * Get a specific vybit follow by key
   * @param key - Vybit follow (following) key
   * @returns Vybit follow details
   */
  async getVybitFollow(key: string): Promise<VybitFollow> {
    return this.request<VybitFollow>(`/subscription/following/${key}`);
  }

  /**
   * Subscribe to a vybit using its subscription key
   * @param subscriptionKey - The subscription key of the vybit to subscribe to
   * @returns Created vybit follow
   */
  async createVybitFollow(subscriptionKey: string): Promise<any> {
    return this.request<any>(`/subscription/${subscriptionKey}`, {
      method: 'POST',
    });
  }

  /**
   * Update a vybit subscription
   * @param key - Vybit follow (following) key
   * @param params - Update parameters
   * @returns Updated vybit follow
   */
  async updateVybitFollow(
    key: string,
    params: VybitFollowUpdateParams
  ): Promise<VybitFollow> {
    return this.request<VybitFollow>(`/subscription/following/${key}`, {
      method: 'PATCH',
      body: JSON.stringify(params),
    });
  }

  /**
   * Unsubscribe from a vybit (delete follow)
   * @param key - Vybit follow (following) key
   * @returns Delete confirmation
   */
  async deleteVybitFollow(key: string): Promise<DeleteResponse> {
    return this.request<DeleteResponse>(`/subscription/following/${key}`, {
      method: 'DELETE',
    });
  }

  /**
   * Send a notification to the owner of a subscribed vybit
   *
   * Only available when the vybit's sendPermissions is set to 'subs_owner'.
   * The subscription must be active (status='on') and granted access.
   *
   * @param followingKey - Vybit following key
   * @param params - Notification content
   * @returns Send response with log key
   * @throws {VybitAPIError} 403 if vybit doesn't allow subscriber-to-owner sends
   *
   * @example
   * ```typescript
   * const result = await client.sendToOwner('following123abc', {
   *   message: 'Server is back online',
   *   linkUrl: 'https://example.com/dashboard'
   * });
   * console.log('Notification sent, log key:', result.plk);
   * ```
   */
  async sendToOwner(followingKey: string, params?: SubscriberSendParams): Promise<SubscriberSendResponse> {
    return this.request<SubscriberSendResponse>(`/subscription/following/${followingKey}/send-to-owner`, {
      method: 'POST',
      body: params ? JSON.stringify(params) : undefined,
    });
  }

  /**
   * Send a notification to all subscribers of a vybit group
   *
   * Only available when the vybit's sendPermissions is set to 'subs_group'.
   * The subscription must be active (status='on') and granted access.
   *
   * @param followingKey - Vybit following key
   * @param params - Notification content
   * @returns Send response with log key
   * @throws {VybitAPIError} 403 if vybit doesn't allow subscriber-to-group sends
   *
   * @example
   * ```typescript
   * const result = await client.sendToGroup('following123abc', {
   *   message: 'Emergency alert: Check the group chat',
   *   linkUrl: 'https://example.com/chat'
   * });
   * console.log('Notification sent to group, log key:', result.plk);
   * ```
   */
  async sendToGroup(followingKey: string, params?: SubscriberSendParams): Promise<SubscriberSendResponse> {
    return this.request<SubscriberSendResponse>(`/subscription/following/${followingKey}/send-to-group`, {
      method: 'POST',
      body: params ? JSON.stringify(params) : undefined,
    });
  }

  // ==================== Sounds ====================

  /**
   * Search for sounds
   * @param params - Pagination and search parameters
   * @returns Array of sounds
   */
  async searchSounds(params?: SearchParams): Promise<Sound[]> {
    const query = this.buildQueryParams(params);
    return this.request<Sound[]>(`/sounds${query}`);
  }

  /**
   * Get a specific sound by key
   * @param key - Sound key
   * @returns Sound details
   */
  async getSound(key: string): Promise<Sound> {
    return this.request<Sound>(`/sound/${key}`);
  }

  /**
   * Get the playback URL for a sound
   * @param key - Sound key
   * @returns Full URL to play/download the sound
   */
  getSoundPlayUrl(key: string): string {
    return `${this.baseUrl}/sound/${key}/play`;
  }

  // ==================== Logs ====================

  /**
   * List all notification logs for the authenticated user
   * @param params - Pagination and search parameters
   * @returns Array of logs
   */
  async listLogs(params?: SearchParams): Promise<Log[]> {
    const query = this.buildQueryParams(params);
    return this.request<Log[]>(`/logs${query}`);
  }

  /**
   * Get a specific log entry by key
   * @param logKey - Log entry key
   * @returns Log entry details
   */
  async getLog(logKey: string): Promise<Log> {
    return this.request<Log>(`/log/${logKey}`);
  }

  /**
   * List logs for a specific owned vybit
   * @param vybKey - Vybit key
   * @param params - Pagination and search parameters
   * @returns Array of logs for the vybit
   */
  async listVybitLogs(vybKey: string, params?: SearchParams): Promise<Log[]> {
    const query = this.buildQueryParams(params);
    return this.request<Log[]>(`/logs/vybit/${vybKey}${query}`);
  }

  /**
   * List logs for a specific vybit subscription
   * @param followingKey - Vybit following key
   * @param params - Pagination and search parameters
   * @returns Array of logs for the subscription
   */
  async listVybitFollowLogs(followingKey: string, params?: SearchParams): Promise<Log[]> {
    const query = this.buildQueryParams(params);
    return this.request<Log[]>(`/logs/subscription/following/${followingKey}${query}`);
  }

  // ==================== Peeps ====================

  /**
   * List peeps (access invitations)
   * @param params - Pagination parameters
   * @returns Array of peeps
   */
  async listPeeps(params?: PaginationParams): Promise<Peep[]> {
    const query = this.buildQueryParams(params);
    return this.request<Peep[]>(`/peeps${query}`);
  }

  /**
   * Get a specific peep by key
   * @param key - Peep key
   * @returns Peep details
   */
  async getPeep(key: string): Promise<Peep> {
    return this.request<Peep>(`/peep/${key}`);
  }

  /**
   * Create a peep invitation
   * @param vybitKey - The vybit key to invite the user to
   * @param email - Email address of the user to invite
   * @returns Created peep response
   */
  async createPeep(vybitKey: string, email: string): Promise<any> {
    return this.request<any>(`/peep/${vybitKey}`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  /**
   * Remove a peep invitation
   * @param key - Peep key
   * @returns Delete confirmation
   */
  async deletePeep(key: string): Promise<DeleteResponse> {
    return this.request<DeleteResponse>(`/peep/${key}`, {
      method: 'DELETE',
    });
  }

  /**
   * List peeps for a specific vybit
   * @param vybitKey - Vybit key
   * @param params - Pagination parameters
   * @returns Array of peeps for the vybit
   */
  async listVybitPeeps(vybitKey: string, params?: PaginationParams): Promise<Peep[]> {
    const query = this.buildQueryParams(params);
    return this.request<Peep[]>(`/peeps/${vybitKey}${query}`);
  }
}
