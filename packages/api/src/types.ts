/**
 * Configuration for Vybit Developer API client
 */
export interface VybitAPIConfig {
  /** Developer API key from Vybit developer portal */
  apiKey: string;
  /** Base URL for API calls (defaults to production) */
  baseUrl?: string;
}

/**
 * Pagination parameters for collection endpoints
 */
export interface PaginationParams {
  /** Number of records to skip */
  offset?: number;
  /** Maximum number of records to return (max: 100) */
  limit?: number;
}

/**
 * Search parameters for collection endpoints
 */
export interface SearchParams extends PaginationParams {
  /** Text search query */
  search?: string;
}

/**
 * API health status response
 */
export interface StatusResponse {
  /** API operational status */
  status: 'up' | 'down';
}

/**
 * User profile information
 */
export interface Profile {
  /** Unique user identifier */
  key: string;
  /** User's display name */
  name: string;
  /** User's email address */
  email: string;
  /** Subscription tier ID (0=Free, 1=Bronze, 2=Silver, 3=Gold) */
  tier_id: number;
}

/**
 * Usage metrics and tier limits
 */
export interface Meter {
  /** Current subscription tier ID */
  tier_id: number;
  /** Maximum vybits allowed */
  cap_vybits: number;
  /** Maximum daily notifications */
  cap_daily: number;
  /** Maximum monthly notifications */
  cap_monthly: number;
  /** Notifications triggered today */
  count_daily: number;
  /** Notifications triggered this month */
  count_monthly: number;
  /** Total notifications all-time */
  count_total: number;
}

/**
 * Vybit notification configuration
 */
export interface Vybit {
  /** Unique vybit identifier */
  key: string;
  /** Vybit display name */
  name: string;
  /** Detailed vybit description */
  description?: string;
  /** Key of the sound to play */
  soundKey: string;
  /** Vybit status */
  status?: 'active' | 'inactive' | 'deleted';
  /** Vybit type (legacy field) */
  type?: string;
  /** Unique key for triggering this vybit via webhook */
  triggerKey?: string;
  /** Unique key for subscribing to this vybit */
  subscriptionKey?: string;
  /** How this vybit is triggered */
  triggerType: 'webhook' | 'schedule' | 'geofence' | 'integration';
  /** Configuration specific to the trigger type */
  triggerSettings?: any;
  /** Vybit visibility and access control */
  access?: 'public' | 'private' | 'unlisted';
  /** Default message displayed with notifications */
  message?: string;
  /** Default image URL for notifications */
  imageUrl?: string;
  /** Default URL to open when notification is tapped */
  linkUrl?: string;
  /** Geofence configuration (for geofence trigger type) */
  geofence?: any;
  /** Count of users subscribed to this vybit */
  numberFollowers?: number;
  /** Who can trigger this vybit */
  sendPermissions?: 'owner_subs' | 'subs_owner' | 'subs_group';
  /** Key of the user who owns this vybit */
  personKey?: string;
  /** When the vybit was created */
  createdAt?: string;
  /** When the vybit was last updated */
  updatedAt?: string;
}

/**
 * Parameters for creating a new vybit
 */
export interface VybitCreateParams {
  /** Vybit display name */
  name: string;
  /** Detailed vybit description */
  description?: string;
  /** Key of the sound to play */
  soundKey: string;
  /** How this vybit is triggered */
  triggerType: 'webhook' | 'schedule' | 'geofence' | 'integration';
  /** Configuration specific to the trigger type */
  triggerSettings?: any;
  /** Vybit visibility and access control */
  access?: 'public' | 'private' | 'unlisted';
  /** Default message displayed with notifications */
  message?: string;
  /** Default image URL for notifications */
  imageUrl?: string;
  /** Default URL to open when notification is tapped */
  linkUrl?: string;
  /** Geofence configuration (for geofence trigger type) */
  geofence?: any;
  /** Who can trigger this vybit */
  sendPermissions?: 'owner_subs' | 'subs_owner' | 'subs_group';
}

/**
 * Parameters for updating a vybit
 */
export interface VybitUpdateParams {
  /** Vybit display name */
  name?: string;
  /** Detailed vybit description */
  description?: string;
  /** Key of the sound to play */
  soundKey?: string;
  /** How this vybit is triggered */
  triggerType?: 'webhook' | 'schedule' | 'geofence' | 'integration';
  /** Configuration specific to the trigger type */
  triggerSettings?: any;
  /** Vybit visibility and access control */
  access?: 'public' | 'private' | 'unlisted';
  /** Default message displayed with notifications */
  message?: string;
  /** Default image URL for notifications */
  imageUrl?: string;
  /** Default URL to open when notification is tapped */
  linkUrl?: string;
  /** Geofence configuration (for geofence trigger type) */
  geofence?: any;
  /** Who can trigger this vybit */
  sendPermissions?: 'owner_subs' | 'subs_owner' | 'subs_group';
}

/**
 * Vybit subscription (follow) information
 */
export interface VybitFollow {
  /** Unique vybit follow identifier */
  key: string;
  /** Key of the subscribed user */
  personKey?: string;
  /** Key of the vybit being followed */
  vybKey: string;
  /** Name of the vybit being followed */
  vybName: string;
  /** Description of the vybit */
  description?: string;
  /** Sound key for this vybit */
  soundKey?: string;
  /** Type of sound file */
  soundType?: string;
  /** Name of the vybit owner */
  ownerName?: string;
  /** Follow status */
  status?: string;
  /** Access status for this subscription */
  accessStatus?: string;
  /** Subscription key used to create this follow */
  subscriptionKey?: string;
  /** Access level of the vybit */
  access?: 'public' | 'private' | 'unlisted';
  /** Trigger type of the vybit */
  triggerType?: 'webhook' | 'schedule' | 'geofence' | 'integration';
  /** Default message for this vybit */
  message?: string;
  /** Default image URL */
  imageUrl?: string;
  /** Default link URL */
  linkUrl?: string;
  /** Send permissions for this vybit */
  sendPermissions?: 'owner_subs' | 'subs_owner' | 'subs_group';
  /** When the subscription was created */
  createdAt?: string;
  /** When the subscription was last updated */
  updatedAt?: string;
}

/**
 * Parameters for creating a vybit follow
 */
export interface VybitFollowCreateParams {
  /** The subscription key of the vybit to follow */
  subscriptionKey: string;
}

/**
 * Parameters for updating a vybit follow
 */
export interface VybitFollowUpdateParams {
  /** Subscription status */
  status?: 'on' | 'off';
  /** Access status (only applicable when current status is 'invited') */
  accessStatus?: 'granted' | 'declined';
  /** Custom notification message (only if subscribers can send notifications) */
  message?: string;
  /** Custom image URL (only if subscribers can send notifications) */
  imageUrl?: string;
  /** Custom link URL (only if subscribers can send notifications) */
  linkUrl?: string;
}

/**
 * Sound information
 */
export interface Sound {
  /** Unique sound identifier */
  key: string;
  /** Sound name */
  name: string;
  /** Sound description */
  description?: string;
  /** Audio file type */
  type: string;
  /** Sound status */
  status: string;
  /** URL to play/download the sound */
  url: string;
  /** Key of first vybit using this sound (null if unused) */
  vybitKey?: string | null;
  /** Additional metadata about the sound */
  meta?: any;
}

/**
 * Notification log entry
 */
export interface Log {
  /** Unique log entry identifier */
  key: string;
  /** Key of the vybit that was triggered */
  vybKey: string;
  /** Key of the user who received the notification */
  personKey: string;
  /** When notification processing started */
  dtStart?: string;
  /** When notification processing completed */
  dtEnd?: string;
  /** Input data that triggered the notification */
  input?: any;
  /** Output data from notification processing */
  output?: any;
  /** Diagnostic information about the notification delivery */
  diagnostics?: any;
  /** Key of parent log entry (for grouped notifications) */
  parentLogKey?: string;
  /** Whether the sound was played */
  playedSound?: string;
}

/**
 * Peep (subscriber) information
 */
export interface Peep {
  /** Unique peep identifier */
  key: string;
  /** Key of the vybit being shared */
  vybKey: string;
  /** Peep name */
  name?: string;
  /** Subscription notification status */
  status?: 'on' | 'off';
  /** Custom sound key override */
  soundKey?: string | null;
  /** Access status */
  accessStatus?: 'denied' | 'public' | 'invited' | 'granted';
  /** Custom notification message */
  message?: string | null;
  /** Custom image URL */
  imageUrl?: string | null;
  /** Custom link URL */
  linkUrl?: string | null;
  /** When the peep was created */
  createdAt?: string;
  /** When the peep was last updated */
  updatedAt?: string;
}

/**
 * Parameters for creating a peep invitation
 */
export interface PeepCreateParams {
  /** Email address of the user to invite */
  email: string;
}

/**
 * Parameters for triggering a vybit notification
 */
export interface VybitTriggerParams {
  /** Custom notification message */
  message?: string;
  /** Custom image URL */
  imageUrl?: string;
  /** Custom link URL */
  linkUrl?: string;
}

/**
 * Response from triggering a vybit
 */
export interface VybitTriggerResponse {
  /** Result code (1 = success) */
  result: number;
  /** Primary log key for the triggered notification */
  plk?: string;
  /** Warning message if vybit is off */
  warn?: string;
}

/**
 * Parameters for subscriber send notifications
 */
export interface SubscriberSendParams {
  /** Notification message to send */
  message?: string;
  /** Custom image URL */
  imageUrl?: string;
  /** Custom link URL */
  linkUrl?: string;
}

/**
 * Response from subscriber send operations
 */
export interface SubscriberSendResponse {
  /** Result code (1 = success) */
  result: number;
  /** Primary log key for the triggered notification */
  plk?: string;
}

/**
 * Standard error response
 */
export interface ErrorResponse {
  /** Error code or type */
  error: string;
  /** Human-readable error description */
  message?: string;
  /** Result code (0 = error) */
  result?: number;
}

/**
 * Delete operation response
 */
export interface DeleteResponse {
  /** Result code (1 = success) */
  result: number;
  /** Success message */
  message?: string;
}