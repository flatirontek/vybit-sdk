/**
 * Core Utils Tests
 * 
 * Tests for utility functions used throughout the SDK
 */

import {
  isValidUrl,
  generateRandomState,
  buildQueryString,
  getDefaultBaseUrl,
  getAuthDomain
} from '../utils';

describe('Utils', () => {
  describe('isValidUrl', () => {
    it('should validate correct URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://localhost:3000')).toBe(true);
      expect(isValidUrl('https://vybit.net/path?query=value')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('ftp://invalid')).toBe(false);
      expect(isValidUrl('')).toBe(false);
      expect(isValidUrl('javascript:alert(1)')).toBe(false);
    });
  });

  describe('generateRandomState', () => {
    it('should generate random state of default length', () => {
      const state = generateRandomState();
      expect(state).toHaveLength(12);
      expect(state).toMatch(/^[a-z0-9]+$/);
    });

    it('should generate random state of custom length', () => {
      const state = generateRandomState(8);
      expect(state).toHaveLength(8);
    });

    it('should generate different states on each call', () => {
      const state1 = generateRandomState();
      const state2 = generateRandomState();
      expect(state1).not.toBe(state2);
    });
  });

  describe('buildQueryString', () => {
    it('should build query string from params', () => {
      const params = {
        client_id: 'test-id',
        redirect_uri: 'https://example.com/callback',
        state: 'random-state'
      };
      
      const queryString = buildQueryString(params);
      expect(queryString).toContain('client_id=test-id');
      expect(queryString).toContain('redirect_uri=https%3A%2F%2Fexample.com%2Fcallback');
      expect(queryString).toContain('state=random-state');
    });

    it('should handle empty params', () => {
      const queryString = buildQueryString({});
      expect(queryString).toBe('');
    });
  });

  describe('getDefaultBaseUrl', () => {
    it('should return API base URL', () => {
      const url = getDefaultBaseUrl();
      expect(url).toBe('https://vybit.net');
    });
  });

  describe('getAuthDomain', () => {
    it('should return auth domain', () => {
      const domain = getAuthDomain();
      expect(domain).toBe('https://app.vybit.net');
    });
  });
});