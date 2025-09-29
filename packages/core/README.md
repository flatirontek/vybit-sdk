# @vybit/core

Core utilities and types for Vybit SDKs.

## Overview

This package provides shared utilities, types, and error classes used across all Vybit SDK packages. It includes URL validation, state generation, and common interfaces.

## Installation

```bash
npm install @vybit/core
```

## Usage

```typescript
import { 
  isValidUrl, 
  generateRandomState, 
  getDefaultBaseUrl,
  getAuthDomain,
  VybitAuthError 
} from '@vybit/core';

// Validate URLs
const isValid = isValidUrl('https://example.com'); // true

// Generate secure random state
const state = generateRandomState(16); // "abc123def456ghi7"

// Get Vybit endpoints
const apiUrl = getDefaultBaseUrl(); // "https://vybit.net"
const authUrl = getAuthDomain(); // "https://app.vybit.net"

// Handle errors
try {
  // SDK operation
} catch (error) {
  if (error instanceof VybitAuthError) {
    console.log('Authentication failed:', error.message);
  }
}
```

## API Reference

### Utilities

- `isValidUrl(url: string): boolean` - Validates HTTP/HTTPS URLs
- `generateRandomState(length?: number): string` - Generates secure random strings
- `buildQueryString(params: Record<string, string>): string` - Builds URL query strings
- `getDefaultBaseUrl(): string` - Returns Vybit API base URL
- `getAuthDomain(): string` - Returns Vybit auth domain

### Error Classes

- `VybitSDKError` - Base error class
- `VybitAuthError` - Authentication errors
- `VybitAPIError` - API request errors  
- `VybitValidationError` - Input validation errors

### Types

- `VybitConfig` - SDK configuration interface
- `VybitCredentials` - OAuth2 credentials interface
- `ApiResponse<T>` - Generic API response wrapper
- `Vybit` - Vybit notification interface

## License

MIT