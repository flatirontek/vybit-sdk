/**
 * Shared normalization functions for Vybit API parameters.
 * Used by MCP server and CLI to apply defaults before API calls.
 */

/**
 * Apply defaults for geofence configuration.
 * - Auto-generates displayRadius from radius if not provided
 * - Defaults subscribable to 'yes'
 * - Defaults timeThrottle to '0' (no throttle)
 */
export function normalizeGeofence(geofence: any): any {
  if (geofence.radius !== undefined && !geofence.displayRadius) {
    geofence.displayRadius = String(geofence.radius);
  }
  if (!geofence.subscribable) geofence.subscribable = 'yes';
  if (!geofence.timeThrottle) geofence.timeThrottle = '0';
  return geofence;
}
