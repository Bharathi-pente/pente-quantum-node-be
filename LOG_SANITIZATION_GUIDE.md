# Log Sanitization Guide

## Overview

Log sanitization prevents sensitive data from being accidentally exposed in application logs. This is critical for:
- **Compliance**: GDPR, PCI-DSS, HIPAA requirements
- **Security**: Protecting credentials and tokens
- **Privacy**: Safeguarding user personal information

## Why Log Sanitization?

### The Problem

```typescript
// ❌ DANGEROUS - Logs sensitive data
logger.info(`User login: ${email}, password: ${password}`);
// Output: "User login: user@example.com, password: MySecretPass123"

logger.info(`API Request: ${JSON.stringify(req.body)}`);
// Output: "API Request: {"api_key": "sk_live_abc123xyz"}"

logger.error(`Database connection: ${DATABASE_URL}`);
// Output: "Database connection: postgres://user:PASSWORD@host:5432/db"
```

**Risks:**
- Credentials exposed in log files
- Tokens accessible to anyone with log access
- Compliance violations (GDPR fines up to €20M)
- Security breaches from leaked secrets

### The Solution

```typescript
// ✅ SAFE - Sanitizes sensitive data
import { sanitizeLog } from './utils/logSanitizer';

logger.info(sanitizeLog(`User login: ${email}, password: ${password}`));
// Output: "User login: user@example.com, password: [REDACTED]"

logger.info(sanitizeLog(`API Request: ${JSON.stringify(req.body)}`));
// Output: "API Request: {"api_key": "[REDACTED]"}"

logger.error(sanitizeLog(`Database connection: ${DATABASE_URL}`));
// Output: "Database connection: postgres://user:[REDACTED]@host:5432/db"
```

## Implementation

### Automatic Sanitization

All logs are automatically sanitized through the Winston format:

```typescript
// src/config/logger.ts
import { sanitizeFormat } from '../utils/logSanitizer';

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format(sanitizeFormat.transform)(), // Automatic sanitization
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`),
);
```

### Manual Sanitization

For explicit control, use the sanitizer functions directly:

```typescript
import { sanitizeLog, sanitizeObject, sanitizeRequest } from './utils/logSanitizer';

// Sanitize string
logger.info(sanitizeLog('api_key=sk_live_secret'));
// Output: "api_key=[REDACTED]"

// Sanitize object
const data = { username: 'john', password: 'secret123' };
logger.info(sanitizeObject(data));
// Output: { username: 'john', password: '[REDACTED]' }

// Sanitize HTTP request
logger.info(sanitizeRequest(req));
// Headers, cookies, tokens automatically redacted
```

## Protected Data Types

### 1. Credentials
- Passwords (password, pwd, passwd)
- API keys (api_key, apiKey)
- Secrets (secret, client_secret)
- Tokens (token, access_token, refresh_token)

```typescript
// Before: password: MyPassword123
// After:  password: [REDACTED]
```

### 2. Authentication
- Bearer tokens
- JWT tokens
- Authorization headers
- Session cookies

```typescript
// Before: Authorization: Bearer eyJhbGciOiJ...
// After:  Authorization: [REDACTED]
```

### 3. Financial Data
- Credit card numbers
- CVV codes
- Bank account numbers

```typescript
// Before: Credit card: 4532-1488-0343-6467
// After:  Credit card: [REDACTED_CC]
```

### 4. Personal Information
- Email addresses
- Phone numbers
- Social Security Numbers

```typescript
// Before: Email: user@example.com
// After:  Email: [REDACTED_EMAIL]
```

### 5. Connection Strings
- Database URLs
- Redis URLs
- External service URLs with credentials

```typescript
// Before: postgres://user:password@host:5432/db
// After:  postgres://user:[REDACTED]@host:5432/db
```

## Usage Examples

### Basic Logging

```typescript
import logger from './config/logger';

// All logs automatically sanitized
logger.info('User password: secret123');
// Output: "User password: [REDACTED]"

logger.error(`Token: ${apiToken}`);
// Output: "Token: [REDACTED]"
```

### Object Logging

```typescript
import { sanitizeObject } from './utils/logSanitizer';

const userRegistration = {
  email: 'user@example.com',
  password: 'MySecretPass',
  api_key: 'sk_live_12345',
  name: 'John Doe',
};

logger.info('New user:', sanitizeObject(userRegistration));
// Output: New user: {
//   email: "[REDACTED_EMAIL]",
//   password: "[REDACTED]",
//   api_key: "[REDACTED]",
//   name: "John Doe"
// }
```

### Request Logging

```typescript
import { sanitizeRequest } from './utils/logSanitizer';

app.use((req, res, next) => {
  logger.info('Incoming request:', sanitizeRequest(req));
  // Headers with Authorization, Cookie automatically redacted
  next();
});
```

### Error Logging

```typescript
try {
  await authenticateUser(email, password);
} catch (error) {
  // Error messages automatically sanitized
  logger.error(`Auth failed for ${email}: ${error.message}`);
  // If message contains password, it's redacted
}
```

## Customization

### Add Custom Patterns

```typescript
import { addCustomPattern } from './utils/logSanitizer';

// Add custom sensitive pattern
addCustomPattern({
  name: 'internal_id',
  pattern: /(internal_id[\s]*[:=][\s]*["']?)([\S]+)(["']?)/gi,
  replacement: '$1[REDACTED]$3',
});

logger.info('internal_id: ABC123');
// Output: "internal_id: [REDACTED]"
```

### Remove Patterns (Development Only)

```typescript
import { removePattern } from './utils/logSanitizer';

// In development, you might want to see emails
if (process.env.NODE_ENV === 'development') {
  removePattern('email');
}
```

### Conditional Sanitization

```typescript
const shouldSanitize = process.env.NODE_ENV === 'production';

logger.info(
  shouldSanitize 
    ? sanitizeLog(sensitiveMessage) 
    : sensitiveMessage
);
```

## Testing

### Test Sanitization

```typescript
import { sanitizeLog } from '../utils/logSanitizer';

describe('Log Sanitizer', () => {
  it('should redact passwords', () => {
    const input = 'password: secret123';
    const output = sanitizeLog(input);
    expect(output).toBe('password: [REDACTED]');
    expect(output).not.toContain('secret123');
  });

  it('should redact API keys', () => {
    const input = 'api_key=sk_live_12345';
    const output = sanitizeLog(input);
    expect(output).toBe('api_key=[REDACTED]');
  });

  it('should redact credit cards', () => {
    const input = 'CC: 4532-1488-0343-6467';
    const output = sanitizeLog(input);
    expect(output).toBe('CC: [REDACTED_CC]');
  });

  it('should preserve non-sensitive data', () => {
    const input = 'User John logged in';
    const output = sanitizeLog(input);
    expect(output).toBe(input);
  });
});
```

### Verify in Logs

```bash
# Search for potential leaks in logs
grep -i "password" logs/all.log | grep -v "\[REDACTED\]"
# Should return no results

grep -i "api_key" logs/all.log | grep -v "\[REDACTED\]"
# Should return no results
```

## Best Practices

### DO ✅

**1. Sanitize all external input**
```typescript
logger.info(sanitizeLog(`Request: ${JSON.stringify(req.body)}`));
```

**2. Sanitize error messages**
```typescript
catch (error) {
  logger.error(sanitizeLog(error.message));
}
```

**3. Use field-based redaction**
```typescript
const sensitiveFields = ['password', 'token', 'secret'];
const safeData = Object.keys(data)
  .filter(key => !sensitiveFields.includes(key))
  .reduce((obj, key) => ({ ...obj, [key]: data[key] }), {});
```

**4. Log security events**
```typescript
logger.warn(sanitizeLog(`Failed login attempt: ${email}`));
// Email redacted, but event logged
```

**5. Review logs regularly**
```bash
# Audit logs for sensitive data
npm run audit:logs
```

### DON'T ❌

**1. Don't log raw passwords**
```typescript
// ❌ NEVER
logger.info(`Password: ${password}`);

// ✅ ALWAYS
logger.info('Password updated successfully'); // No sensitive data
```

**2. Don't log entire request objects**
```typescript
// ❌ DANGEROUS
logger.info(JSON.stringify(req));

// ✅ SAFE
logger.info(sanitizeRequest(req));
```

**3. Don't bypass sanitization**
```typescript
// ❌ WRONG
if (DEBUG) {
  console.log(`API Key: ${apiKey}`); // Still ends up in logs!
}

// ✅ CORRECT
if (DEBUG) {
  logger.debug(sanitizeLog(`API Key: ${apiKey}`));
}
```

**4. Don't trust environment data**
```typescript
// ❌ Environment variables can contain secrets
logger.info(`Config: ${JSON.stringify(process.env)}`);

// ✅ Use allowlist
const safeConfig = { NODE_ENV, PORT, LOG_LEVEL };
logger.info(`Config: ${JSON.stringify(safeConfig)}`);
```

## Performance Considerations

### Impact

Sanitization adds minimal overhead:
- **Regex matching**: ~0.1ms per log entry
- **String replacement**: ~0.05ms per pattern
- **Total impact**: <1ms per log entry

### Optimization

```typescript
// Cache compiled patterns
const PASSWORD_PATTERN = /password[\s]*[:=][\s]*["']?([\S]+)["']?/gi;

// Use lazy evaluation
const getMessage = () => expensiveOperation();
if (shouldLog) {
  logger.info(sanitizeLog(getMessage()));
}
```

## Compliance & Regulations

### GDPR (EU)
- ✅ Personal data automatically redacted
- ✅ Right to be forgotten supported
- ✅ Data minimization enforced

### PCI-DSS (Credit Cards)
- ✅ Credit card numbers redacted
- ✅ CVV codes never logged
- ✅ Cardholder data protected

### HIPAA (Healthcare)
- ✅ PHI (Protected Health Information) redacted
- ✅ Patient identifiers sanitized
- ✅ Audit logs maintained

### SOC 2
- ✅ Sensitive data classification
- ✅ Access controls on logs
- ✅ Encryption at rest

## Monitoring

### Alert on Sensitive Data

```typescript
// Add monitoring for leaked secrets
import { sanitizeLog } from './utils/logSanitizer';

const originalLog = logger.info;
logger.info = (...args) => {
  const message = args[0];
  const sanitized = sanitizeLog(message);
  
  if (message !== sanitized) {
    // Alert: sensitive data was attempted to be logged
    alertSecurityTeam('Sensitive data in logs', { 
      original: message.substring(0, 50) 
    });
  }
  
  originalLog(sanitized);
};
```

### Log Audit Script

```bash
#!/bin/bash
# audit-logs.sh

echo "Auditing logs for sensitive data leaks..."

# Check for patterns that should be redacted
PATTERNS=("password" "api_key" "token" "secret" "credit.*card")

for pattern in "${PATTERNS[@]}"; do
  echo "Checking for: $pattern"
  grep -iE "$pattern" logs/*.log | grep -v "\[REDACTED\]" || echo "✅ No leaks found"
done
```

## FAQ

### Q: Will this impact performance?
**A**: Minimal impact (<1ms per log entry). Pattern matching is efficient.

### Q: Can I disable sanitization in development?
**A**: Not recommended, but you can use `removePattern()` selectively.

### Q: What if I need to debug with real values?
**A**: Use secure debugging tools (debugger, secure logs with restricted access).

### Q: How do I know what's being redacted?
**A**: Test with `getSanitizationRules()` or check redaction markers.

### Q: Can I sanitize async logs?
**A**: Yes, sanitization works with all Winston transports.

## Troubleshooting

### Pattern Not Matching

```typescript
import { getSanitizationRules } from './utils/logSanitizer';

// Check current rules
console.log(getSanitizationRules());

// Test specific pattern
const testInput = 'mypassword: secret';
console.log(sanitizeLog(testInput));
```

### False Positives

```typescript
// If legitimate data is redacted
logger.info('Password field is required'); 
// Output: "Password field is required" (not redacted - no value)

logger.info('password=SECRET123');
// Output: "password=[REDACTED]" (correctly redacted)
```

## Migration Guide

### Step 1: Install Sanitizer
```bash
# Already included in project
```

### Step 2: Update Logger
```typescript
// Already configured in src/config/logger.ts
```

### Step 3: Review Existing Logs
```bash
# Audit current logs
grep -r "password\|token\|secret" logs/
```

### Step 4: Update Code Gradually
```typescript
// Replace manual redaction with sanitizer
// Before:
logger.info(`User: ${user.email.replace(/@.*/, '@***')}`);

// After:
logger.info(sanitizeLog(`User: ${user.email}`));
```

## Resources

- [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html)
- [GDPR Article 32 - Security](https://gdpr-info.eu/art-32-gdpr/)
- [PCI-DSS Requirement 3.4](https://www.pcisecuritystandards.org/)
- [Winston Documentation](https://github.com/winstonjs/winston)

## Summary

Log sanitization is **critical** for:
- ✅ Security (no leaked credentials)
- ✅ Compliance (GDPR, PCI-DSS, HIPAA)
- ✅ Privacy (protected PII)
- ✅ Trust (customer confidence)

**Always sanitize logs in production!**
