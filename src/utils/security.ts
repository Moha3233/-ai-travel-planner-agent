/**
 * Security and Privacy Utility for PII (Personally Identifiable Information) Sanitization
 * This ensures that sensitive, private, or personal data is never sent to external AI models or search APIs.
 */

// Regular expressions for detecting standard Personally Identifiable Information (PII)
export const PII_PATTERNS = {
  // Matches typical email addresses
  EMAIL: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi,

  // Matches various international and national phone formats (e.g., +1-123-456-7890, (123) 456-7890, etc.)
  PHONE: /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,

  // Matches credit card numbers (Visa, MasterCard, Amex, Discover, Diners, JCB, 13-19 digits, with or without spaces/dashes)
  CREDIT_CARD: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|6(?:011|5[0-9][0-9])[0-9]{12}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|(?:2131|1800|35\d{3})\d{11})\b/g,

  // Matches 13-16 digit numbers that look like credit cards
  GENERIC_CARD: /\b(?:\d[ -]*?){13,16}\b/g,

  // Matches Social Security Numbers (SSN) - standard US format
  SSN: /\b\d{3}-\d{2}-\d{4}\b/g,

  // Matches typical password or secret fields: password=XYZ, secret=XYZ, etc.
  CREDENTIAL_KEYVALUE: /\b(password|pass|secret|passphrase|token|api_key|apikey|private_key|key|auth|bearer)\s*[:=]\s*[^\s,;]+(?:\b|)/gi,

  // Matches typical API key formats (e.g., Google AIzaSy..., OpenAI sk-...)
  API_KEY: /(?:AIzaSy[A-Za-z0-9_\-]{33})|(?:sk-[a-zA-Z0-9]{32,48})/g,

  // Matches IPv4 addresses
  IP_ADDRESS: /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g,

  // Matches common passport number formats (typically 6 to 9 alphanumeric characters)
  PASSPORT: /\b[A-Z0-9]{6,12}\b/gi,
};

/**
 * Derives common name variations from an email address to dynamically redact them.
 * e.g., mohanduratkar36@gmail.com -> ["mohanduratkar36", "mohanduratkar", "mohan", "duratkar"]
 */
export function deriveNamesFromEmail(email: string): string[] {
  if (!email || !email.includes('@')) return [];
  const parts: string[] = [];
  const localPart = email.split('@')[0].toLowerCase();
  parts.push(localPart);

  // Strip digits
  const localPartNoDigits = localPart.replace(/\d+/g, '');
  if (localPartNoDigits && localPartNoDigits.length > 2) {
    parts.push(localPartNoDigits);
  }

  // Split on common delimiters
  const splitChars = /[\._-]/;
  const subParts = localPart.split(splitChars);
  for (const part of subParts) {
    const clean = part.replace(/\d+/g, '');
    if (clean && clean.length > 2) {
      parts.push(clean);
    }
  }

  // Remove duplicates and sort by length descending to match larger segments first
  return Array.from(new Set(parts)).sort((a, b) => b.length - a.length);
}

/**
 * Sanitizes a single text string by stripping out all categories of PII.
 * Replaces them with highly recognizable, safe, and context-appropriate redacted placeholders.
 */
export function sanitizePIIText(text: string, userEmail?: string): { sanitizedText: string; redactedTypes: string[] } {
  if (!text || typeof text !== 'string') {
    return { sanitizedText: text, redactedTypes: [] };
  }

  let sanitized = text;
  const redactedTypes: Set<string> = new Set();

  // 1. Redact Emails
  if (PII_PATTERNS.EMAIL.test(sanitized)) {
    sanitized = sanitized.replace(PII_PATTERNS.EMAIL, '[REDACTED_EMAIL]');
    redactedTypes.add('email');
  }

  // 2. Redact Credit Cards
  if (PII_PATTERNS.CREDIT_CARD.test(sanitized)) {
    sanitized = sanitized.replace(PII_PATTERNS.CREDIT_CARD, '[REDACTED_CARD]');
    redactedTypes.add('credit_card');
  } else if (PII_PATTERNS.GENERIC_CARD.test(sanitized)) {
    // Check if it's a card-like number
    sanitized = sanitized.replace(PII_PATTERNS.GENERIC_CARD, '[REDACTED_CARD]');
    redactedTypes.add('credit_card');
  }

  // 3. Redact SSN
  if (PII_PATTERNS.SSN.test(sanitized)) {
    sanitized = sanitized.replace(PII_PATTERNS.SSN, '[REDACTED_ID]');
    redactedTypes.add('ssn');
  }

  // 4. Redact Passwords / Credentials Keys
  if (PII_PATTERNS.CREDENTIAL_KEYVALUE.test(sanitized)) {
    sanitized = sanitized.replace(PII_PATTERNS.CREDENTIAL_KEYVALUE, '$1=[REDACTED_SECRET]');
    redactedTypes.add('credential');
  }

  // 5. Redact API Keys
  if (PII_PATTERNS.API_KEY.test(sanitized)) {
    sanitized = sanitized.replace(PII_PATTERNS.API_KEY, '[REDACTED_API_KEY]');
    redactedTypes.add('api_key');
  }

  // 6. Redact Phone Numbers (excluding common small digits or years like 2026)
  sanitized = sanitized.replace(PII_PATTERNS.PHONE, (match) => {
    // Let's filter out standard small sequences (e.g. "2026", "2000", "1000", "$500") or zip codes (5 digits)
    const digitsOnly = match.replace(/\D/g, '');
    if (digitsOnly.length >= 7 && digitsOnly.length <= 15) {
      redactedTypes.add('phone_number');
      return '[REDACTED_PHONE]';
    }
    return match;
  });

  // 7. Redact IP Addresses
  if (PII_PATTERNS.IP_ADDRESS.test(sanitized)) {
    sanitized = sanitized.replace(PII_PATTERNS.IP_ADDRESS, '[REDACTED_IP]');
    redactedTypes.add('ip_address');
  }

  // 8. Specific dynamic User Email redacts
  if (userEmail) {
    const emailLower = userEmail.toLowerCase().trim();
    
    // Exact email replacement
    if (sanitized.toLowerCase().includes(emailLower)) {
      const emailRegex = new RegExp(emailLower.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'gi');
      sanitized = sanitized.replace(emailRegex, '[REDACTED_EMAIL]');
      redactedTypes.add('email');
    }

    // Deriving names from user's email (e.g., mohan, duratkar)
    const derivedNames = deriveNamesFromEmail(emailLower);
    for (const name of derivedNames) {
      if (name.length >= 3) { // Avoid masking super short common substrings
        const nameRegex = new RegExp(`\\b${name}\\b`, 'gi');
        if (nameRegex.test(sanitized)) {
          sanitized = sanitized.replace(nameRegex, '[REDACTED_NAME]');
          redactedTypes.add('name');
        }
      }
    }
  }

  return {
    sanitizedText: sanitized,
    redactedTypes: Array.from(redactedTypes),
  };
}

/**
 * Recursively sanitizes PII from any deeply nested object or array.
 * Highly robust solution for Express request payloads or search parameters.
 */
export function sanitizePIIObject<T>(obj: T, userEmail?: string): { sanitized: T; redactedCount: number; redactedTypes: string[] } {
  let redactedCount = 0;
  const redactedTypesSet: Set<string> = new Set();

  function recurse(current: any): any {
    if (current === null || current === undefined) {
      return current;
    }

    if (typeof current === 'string') {
      const { sanitizedText, redactedTypes } = sanitizePIIText(current, userEmail);
      if (sanitizedText !== current) {
        redactedCount++;
        redactedTypes.forEach((t) => redactedTypesSet.add(t));
      }
      return sanitizedText;
    }

    if (Array.isArray(current)) {
      return current.map((item) => recurse(item));
    }

    if (typeof current === 'object') {
      const copy: any = {};
      for (const key in current) {
        if (Object.prototype.hasOwnProperty.call(current, key)) {
          // Skip known non-string/safe parameters like numbers or dates to keep logic highly performant
          if (['durationDays', 'budgetLimit', 'travelersCount'].includes(key)) {
            copy[key] = current[key];
          } else {
            copy[key] = recurse(current[key]);
          }
        }
      }
      return copy;
    }

    return current;
  }

  const sanitized = recurse(obj);

  return {
    sanitized,
    redactedCount,
    redactedTypes: Array.from(redactedTypesSet),
  };
}
