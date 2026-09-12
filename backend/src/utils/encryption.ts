import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const SECRET = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || "mindsync-secure-production-vault-key";
const KEY = crypto.scryptSync(SECRET, "mindsync-salt-2026", 32);

export function encrypt(text: string): { encrypted: string; iv: string } {
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    const authTag = cipher.getAuthTag().toString("hex");
    return { encrypted: `${encrypted}:${authTag}`, iv: iv.toString("hex") };
  } catch (err) {
    console.error("[Encryption Error]:", err);
    return { encrypted: text, iv: "" };
  }
}

export function decrypt(encryptedData: string, ivHex: string): string {
  try {
    if (!encryptedData || !ivHex) return encryptedData || "";
    const parts = encryptedData.split(":");
    if (parts.length < 2) return encryptedData;
    const [encrypted, authTag] = parts;
    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    decipher.setAuthTag(Buffer.from(authTag, "hex"));
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (err) {
    console.warn("[Decryption Warning] Failed to decrypt journal entry:", err);
    return encryptedData.includes(":") ? "[Private Journal Reflection]" : encryptedData;
  }
}
