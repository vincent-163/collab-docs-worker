// Password hashing (PBKDF2) and session cookie helpers. Pure WebCrypto.

const encoder = new TextEncoder();

export function bytesToHex(bytes) {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex) {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

export async function hashPassword(password, saltHex = null) {
  const salt = saltHex ? hexToBytes(saltHex) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: 100000 },
    key,
    256
  );
  return { salt: bytesToHex(salt), hash: bytesToHex(new Uint8Array(bits)) };
}

export async function verifyPassword(password, saltHex, expectedHash) {
  const { hash } = await hashPassword(password, saltHex);
  return hash === expectedHash;
}

export async function sha256Hex(text) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(text));
  return bytesToHex(new Uint8Array(digest));
}

export function randomToken(bytes = 24) {
  return bytesToHex(crypto.getRandomValues(new Uint8Array(bytes)));
}

export function parseCookies(request) {
  const header = request.headers.get("cookie") || "";
  const out = {};
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx > 0) out[part.slice(0, idx).trim()] = part.slice(idx + 1).trim();
  }
  return out;
}

export const SESSION_COOKIE = "cd_session";
export const SESSION_MAX_AGE = 30 * 86400;

export function sessionCookieHeader(userId, token) {
  return `${SESSION_COOKIE}=${userId}.${token}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=${SESSION_MAX_AGE}`;
}

export function clearSessionCookieHeader() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0`;
}

export function validEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}
