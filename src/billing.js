// Image-storage billing: $0.015 per GB-month, settled monthly.

export const RATE_CENTS_PER_GB_MONTH = 1.5;
export const GB = 1e9;
export const MONTH_SECONDS = 30 * 86400;

// Accumulate byte-seconds up to `now` (ms). Mutates and returns the state.
export function accrue(state, now) {
  if (state.bytesStored > 0 && now > state.lastAccrued) {
    state.byteSeconds += state.bytesStored * ((now - state.lastAccrued) / 1000);
  }
  state.lastAccrued = now;
  return state;
}

// Cents charged for a number of byte-seconds.
export function chargeCents(byteSeconds) {
  const gbMonths = byteSeconds / (GB * MONTH_SECONDS);
  return Math.round(gbMonths * RATE_CENTS_PER_GB_MONTH * 100) / 100;
}

export function formatDollars(cents) {
  return `$${(cents / 100).toFixed(2)}`;
}

export function estimateMonthlyCents(bytesStored) {
  return chargeCents(bytesStored * MONTH_SECONDS);
}

// Chat attachments: one-time charge per upload ($0.15 per GB, min 0.01c).
export const UPLOAD_RATE_CENTS_PER_GB = 15;
export const MIN_UPLOAD_CENTS = 0.01;

export function oneTimeUploadCents(bytes) {
  const cents = Math.round((bytes / GB) * UPLOAD_RATE_CENTS_PER_GB * 100) / 100;
  return Math.max(MIN_UPLOAD_CENTS, cents);
}
