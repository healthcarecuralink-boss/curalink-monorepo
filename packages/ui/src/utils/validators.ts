// Lightweight format checks for payout details (bank-details.tsx,
// payout-methods.tsx). These fields previously had zero client-side
// validation, so a typo (or garbage input) only ever surfaced as a failed
// payout weeks later. Not a full account-verification check -- just enough
// to catch obviously malformed input before it's saved.

export function isValidIfsc(value: string): boolean {
  return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(value.trim().toUpperCase());
}

export function isValidBankAccountNumber(value: string): boolean {
  return /^\d{9,18}$/.test(value.trim());
}

export function isValidUpiId(value: string): boolean {
  return /^[a-zA-Z0-9.\-_]{2,49}@[a-zA-Z][a-zA-Z0-9]{1,49}$/.test(value.trim());
}
