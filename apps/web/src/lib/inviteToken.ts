import crypto from "crypto";

export function generateRawToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("base64url");
}

export function hashToken(raw: string) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}