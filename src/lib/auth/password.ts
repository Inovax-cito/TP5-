import bcrypt from "bcryptjs";

/** RF-U5: hash con bcrypt. Nunca se guarda la contraseña en texto plano. */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/** Contraseña temporal para altas y restablecimientos (RF-U5). */
export function generateTemporaryPassword(): string {
  const bytes = new Uint8Array(9);
  if (typeof globalThis.crypto !== "undefined" && globalThis.crypto.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return `Tmp-${Buffer.from(bytes).toString("base64url")}-9`;
}
