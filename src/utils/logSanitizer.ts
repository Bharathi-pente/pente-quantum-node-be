/**
 * Log Sanitizer Utility
 * 
 * Prevents sensitive data from being logged by sanitizing log messages.
 * Protects against accidental exposure of:
 * - Passwords
 * - API keys
 * - Tokens (JWT, session, API)
 * - Credit card numbers
 * - Email addresses (optionally)
 * - Personal identifiable information (PII)
 * - Database connection strings
 * 
 * Usage:
 *   import { sanitizeLog } from './utils/logSanitizer';
 *   logger.info(sanitizeLog('User password is: mypassword123'));
 *   // Output: "User password is: [REDACTED]"
 */

interface SanitizationRule {
  name: string;
  pattern: RegExp;
  replacement: string;
}

// Define sensitive data patterns
const SENSITIVE_PATTERNS: SanitizationRule[] = [
  // Passwords
  {
    name: 'password',
    pattern: /(password[\s]*[:=][\s]*["']?)([\S]+)(["']?)/gi,
    replacement: '$1[REDACTED]$3',
  },
  {
    name: 'pwd',
    pattern: /(pwd[\s]*[:=][\s]*["']?)([\S]+)(["']?)/gi,
    replacement: '$1[REDACTED]$3',
  },
  
  // API Keys and Tokens
  {
    name: 'api_key',
    pattern: /(api[_-]?key[\s]*[:=][\s]*["']?)([\S]+)(["']?)/gi,
    replacement: '$1[REDACTED]$3',
  },
  {
    name: 'secret',
    pattern: /(secret[\s]*[:=][\s]*["']?)([\S]+)(["']?)/gi,
    replacement: '$1[REDACTED]$3',
  },
  {
    name: 'token',
    pattern: /(token[\s]*[:=][\s]*["']?)([\S]+)(["']?)/gi,
    replacement: '$1[REDACTED]$3',
  },
  
  // JWT Tokens (Bearer tokens)
  {
    name: 'bearer_token',
    pattern: /(bearer[\s]+)([\w-]+\.[\w-]+\.[\w-]+)/gi,
    replacement: '$1[REDACTED_JWT]',
  },
  
  // Authorization Headers
  {
    name: 'authorization_header',
    pattern: /(authorization[\s]*[:=][\s]*["']?)([\S]+)(["']?)/gi,
    replacement: '$1[REDACTED]$3',
  },
  
  // Credit Card Numbers (basic pattern)
  {
    name: 'credit_card',
    pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
    replacement: '[REDACTED_CC]',
  },
  
  // Email Addresses (optional - may want to keep for debugging)
  {
    name: 'email',
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    replacement: '[REDACTED_EMAIL]',
  },
  
  // Database Connection Strings
  {
    name: 'db_connection',
    pattern: /(postgres(?:ql)?:\/\/[^:]+:)([^@]+)(@)/gi,
    replacement: '$1[REDACTED]$3',
  },
  {
    name: 'mysql_connection',
    pattern: /(mysql:\/\/[^:]+:)([^@]+)(@)/gi,
    replacement: '$1[REDACTED]$3',
  },
  
  // Social Security Numbers (US)
  {
    name: 'ssn',
    pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
    replacement: '[REDACTED_SSN]',
  },
  
  // Phone Numbers
  {
    name: 'phone',
    pattern: /\b\+?1?\s*\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g,
    replacement: '[REDACTED_PHONE]',
  },
  
  // IP Addresses (optional - may want to keep for debugging)
  // {
  //   name: 'ip_address',
  //   pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
  //   replacement: '[REDACTED_IP]',
  // },
];

/**
 * Sanitize a single log message
 */
export function sanitizeLog(message: any): string {
  // Handle non-string inputs
  if (typeof message !== 'string') {
    try {
      message = JSON.stringify(message);
    } catch {
      message = String(message);
    }
  }

  let sanitized = message;

  // Apply all sanitization rules
  for (const rule of SENSITIVE_PATTERNS) {
    sanitized = sanitized.replace(rule.pattern, rule.replacement);
  }

  return sanitized;
}

/**
 * Sanitize an object by recursively sanitizing all string values
 */
export function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return sanitizeLog(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      // Redact common sensitive field names entirely
      if (isSensitiveFieldName(key)) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeObject(value);
      }
    }
    return sanitized;
  }

  return obj;
}

/**
 * Check if a field name indicates sensitive data
 */
function isSensitiveFieldName(fieldName: string): boolean {
  const sensitiveFields = [
    'password',
    'pwd',
    'passwd',
    'secret',
    'token',
    'api_key',
    'apiKey',
    'apikey',
    'access_token',
    'accessToken',
    'refresh_token',
    'refreshToken',
    'private_key',
    'privateKey',
    'credit_card',
    'creditCard',
    'ccv',
    'cvv',
    'ssn',
    'social_security',
    'authorization',
    'auth',
  ];

  const lowerFieldName = fieldName.toLowerCase();
  return sensitiveFields.some(field => lowerFieldName.includes(field));
}

/**
 * Sanitize HTTP request for logging
 */
export function sanitizeRequest(req: any): any {
  return {
    method: req.method,
    url: sanitizeLog(req.url),
    headers: sanitizeObject({
      ...req.headers,
      authorization: req.headers?.authorization ? '[REDACTED]' : undefined,
      cookie: req.headers?.cookie ? '[REDACTED]' : undefined,
    }),
    body: sanitizeObject(req.body),
    query: sanitizeObject(req.query),
    params: req.params,
  };
}

/**
 * Sanitize HTTP response for logging
 */
export function sanitizeResponse(res: any): any {
  return {
    statusCode: res.statusCode,
    headers: sanitizeObject({
      ...res.getHeaders?.(),
      'set-cookie': res.getHeaders?.()['set-cookie'] ? '[REDACTED]' : undefined,
    }),
  };
}

/**
 * Create a Winston format for log sanitization
 */
export const sanitizeFormat = {
  transform: (info: any) => {
    // Sanitize the main message
    if (info.message) {
      info.message = sanitizeLog(info.message);
    }

    // Sanitize any additional metadata
    if (info.meta) {
      info.meta = sanitizeObject(info.meta);
    }

    // Sanitize error stack traces (keep structure but sanitize content)
    if (info.stack) {
      info.stack = sanitizeLog(info.stack);
    }

    return info;
  },
};

/**
 * List of allowed sensitive patterns for debugging (use sparingly)
 */
export function addCustomPattern(rule: SanitizationRule): void {
  SENSITIVE_PATTERNS.push(rule);
}

/**
 * Remove a sanitization rule (use with caution)
 */
export function removePattern(name: string): void {
  const index = SENSITIVE_PATTERNS.findIndex(p => p.name === name);
  if (index !== -1) {
    SENSITIVE_PATTERNS.splice(index, 1);
  }
}

/**
 * Get all current sanitization rules (for testing/debugging)
 */
export function getSanitizationRules(): SanitizationRule[] {
  return [...SENSITIVE_PATTERNS];
}

export default {
  sanitizeLog,
  sanitizeObject,
  sanitizeRequest,
  sanitizeResponse,
  sanitizeFormat,
  addCustomPattern,
  removePattern,
  getSanitizationRules,
};
