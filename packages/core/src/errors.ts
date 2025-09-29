export class VybitSDKError extends Error {
  public readonly code: string;
  public readonly details?: any;

  constructor(message: string, code: string = 'UNKNOWN_ERROR', details?: any) {
    super(message);
    this.name = 'VybitSDKError';
    this.code = code;
    this.details = details;
  }
}

export class VybitAuthError extends VybitSDKError {
  constructor(message: string, details?: any) {
    super(message, 'AUTH_ERROR', details);
    this.name = 'VybitAuthError';
  }
}

export class VybitAPIError extends VybitSDKError {
  public readonly statusCode?: number;

  constructor(message: string, statusCode?: number, details?: any) {
    super(message, 'API_ERROR', details);
    this.name = 'VybitAPIError';
    this.statusCode = statusCode;
  }
}

export class VybitValidationError extends VybitSDKError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'VybitValidationError';
  }
}