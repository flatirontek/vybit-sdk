/**
 * Error Classes Tests
 * 
 * Tests for custom error classes used throughout the SDK
 */

import {
  VybitSDKError,
  VybitAuthError,
  VybitAPIError,
  VybitValidationError
} from '../errors';

describe('Error Classes', () => {
  describe('VybitSDKError', () => {
    it('should create error with message and code', () => {
      const error = new VybitSDKError('Test error', 'TEST_CODE');
      
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.name).toBe('VybitSDKError');
      expect(error).toBeInstanceOf(Error);
    });

    it('should default to UNKNOWN_ERROR code', () => {
      const error = new VybitSDKError('Test error');
      expect(error.code).toBe('UNKNOWN_ERROR');
    });

    it('should include details when provided', () => {
      const details = { field: 'clientId', value: '' };
      const error = new VybitSDKError('Test error', 'TEST_CODE', details);
      
      expect(error.details).toEqual(details);
    });
  });

  describe('VybitAuthError', () => {
    it('should create auth error with correct properties', () => {
      const error = new VybitAuthError('Authentication failed');
      
      expect(error.message).toBe('Authentication failed');
      expect(error.code).toBe('AUTH_ERROR');
      expect(error.name).toBe('VybitAuthError');
      expect(error).toBeInstanceOf(VybitSDKError);
    });

    it('should include details when provided', () => {
      const details = { reason: 'invalid_token' };
      const error = new VybitAuthError('Token invalid', details);
      
      expect(error.details).toEqual(details);
    });
  });

  describe('VybitAPIError', () => {
    it('should create API error with status code', () => {
      const error = new VybitAPIError('API request failed', 404);
      
      expect(error.message).toBe('API request failed');
      expect(error.code).toBe('API_ERROR');
      expect(error.name).toBe('VybitAPIError');
      expect(error.statusCode).toBe(404);
      expect(error).toBeInstanceOf(VybitSDKError);
    });

    it('should work without status code', () => {
      const error = new VybitAPIError('Network error');
      
      expect(error.statusCode).toBeUndefined();
    });

    it('should include details when provided', () => {
      const details = { endpoint: '/api/test', method: 'GET' };
      const error = new VybitAPIError('Request failed', 500, details);
      
      expect(error.details).toEqual(details);
    });
  });

  describe('VybitValidationError', () => {
    it('should create validation error with correct properties', () => {
      const error = new VybitValidationError('Invalid URL format');
      
      expect(error.message).toBe('Invalid URL format');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.name).toBe('VybitValidationError');
      expect(error).toBeInstanceOf(VybitSDKError);
    });

    it('should include validation details', () => {
      const details = { field: 'redirectUri', value: 'invalid-url' };
      const error = new VybitValidationError('Invalid redirect URI', details);
      
      expect(error.details).toEqual(details);
    });
  });

  describe('Error inheritance', () => {
    it('should maintain proper inheritance chain', () => {
      const authError = new VybitAuthError('Auth failed');
      const apiError = new VybitAPIError('API failed');
      const validationError = new VybitValidationError('Validation failed');
      
      expect(authError).toBeInstanceOf(VybitSDKError);
      expect(authError).toBeInstanceOf(Error);
      
      expect(apiError).toBeInstanceOf(VybitSDKError);
      expect(apiError).toBeInstanceOf(Error);
      
      expect(validationError).toBeInstanceOf(VybitSDKError);
      expect(validationError).toBeInstanceOf(Error);
    });
  });
});