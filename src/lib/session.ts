export const SESSION_COOKIE = "estuda2_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30;

function sessionSecret() {
  return process.env.AUTH_SECRET || "estuda2-development-secret";
}

function toHex(bytes: ArrayBuffer) {
  return Array.from(new Uint8Array(bytes))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function signature(payload: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(sessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return toHex(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload)),
  );
}

export async function createSessionToken(userId: string) {
  const expiresAt =
    Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS;
  const payload = `${userId}.${expiresAt}`;
  return `${payload}.${await signature(payload)}`;
}

export async function verifySessionToken(token?: string) {
  if (!token) return null;

  const [userId, expiresAtValue, providedSignature] = token.split(".");
  const expiresAt = Number(expiresAtValue);
  if (
    !userId ||
    !providedSignature ||
    !Number.isInteger(expiresAt) ||
    expiresAt <= Math.floor(Date.now() / 1000)
  ) {
    return null;
  }

  const payload = `${userId}.${expiresAt}`;
  const expectedSignature = await signature(payload);
  if (providedSignature.length !== expectedSignature.length) return null;

  let difference = 0;
  for (let index = 0; index < providedSignature.length; index += 1) {
    difference |=
      providedSignature.charCodeAt(index) ^
      expectedSignature.charCodeAt(index);
  }

  return difference === 0 ? { userId, expiresAt } : null;
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: SESSION_DURATION_SECONDS,
  path: "/",
};
