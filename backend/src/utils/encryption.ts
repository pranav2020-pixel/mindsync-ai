import crypto from "crypto";
const ALGORITHM = "aes-256-gcm";
const KEY = crypto.scryptSync(process.env.JWT_SECRET || "fallback-secret-key", "salt", 32);

export function encrypt(text: string): { encrypted: string; iv: string } {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");
  return { encrypted: `${encrypted}:${authTag}`, iv: iv.toString("hex") };
}

export function decrypt(encryptedData: string, ivHex: string): string {
  const [encrypted, authTag] = encryptedData.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(Buffer.from(authTag, "hex"));
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
