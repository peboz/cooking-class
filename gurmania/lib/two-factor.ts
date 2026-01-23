import crypto from "crypto"

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
const DEFAULT_ISSUER = "Gurmania"
const TOTP_DIGITS = 6
const TOTP_PERIOD = 30

function getEncryptionKey(): Buffer {
  const raw = process.env.TWO_FACTOR_ENCRYPTION_KEY
  if (!raw) {
    throw new Error("TWO_FACTOR_ENCRYPTION_KEY is not set")
  }

  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    return Buffer.from(raw, "hex")
  }

  const base64 = Buffer.from(raw, "base64")
  if (base64.length === 32) {
    return base64
  }

  throw new Error("TWO_FACTOR_ENCRYPTION_KEY must be 32 bytes (base64) or 64 hex chars")
}

export function base32Encode(buffer: Buffer): string {
  let bits = 0
  let value = 0
  let output = ""

  for (const byte of buffer) {
    value = (value << 8) | byte
    bits += 8

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31]
  }

  return output
}

export function base32Decode(input: string): Buffer {
  const cleaned = input.toUpperCase().replace(/[^A-Z2-7]/g, "")
  let bits = 0
  let value = 0
  const bytes: number[] = []

  for (const char of cleaned) {
    const index = BASE32_ALPHABET.indexOf(char)
    if (index === -1) continue

    value = (value << 5) | index
    bits += 5

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255)
      bits -= 8
    }
  }

  return Buffer.from(bytes)
}

export function generateBase32Secret(size = 20): string {
  return base32Encode(crypto.randomBytes(size))
}

export function generateOtpAuthUrl(email: string, secret: string, issuer = DEFAULT_ISSUER) {
  const label = encodeURIComponent(`${issuer}:${email}`)
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: "SHA1",
    digits: TOTP_DIGITS.toString(),
    period: TOTP_PERIOD.toString(),
  })

  return `otpauth://totp/${label}?${params.toString()}`
}

export function generateTotp(secret: string, time = Date.now()): string {
  const key = base32Decode(secret)
  const counter = Math.floor(time / 1000 / TOTP_PERIOD)
  const counterBuffer = Buffer.alloc(8)
  counterBuffer.writeBigInt64BE(BigInt(counter))

  const hmac = crypto.createHmac("sha1", key).update(counterBuffer).digest()
  const offset = hmac[hmac.length - 1] & 0x0f
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)

  const otp = (code % 10 ** TOTP_DIGITS).toString().padStart(TOTP_DIGITS, "0")
  return otp
}

export function verifyTotp(token: string, secret: string, window = 1): boolean {
  const normalized = normalizeTwoFactorCode(token)
  if (!normalized) return false

  const now = Date.now()
  for (let errorWindow = -window; errorWindow <= window; errorWindow += 1) {
    const time = now + errorWindow * TOTP_PERIOD * 1000
    if (generateTotp(secret, time) === normalized) {
      return true
    }
  }

  return false
}

export function encryptSecret(secret: string): string {
  const key = getEncryptionKey()
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv)
  const encrypted = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()

  return [iv.toString("base64"), tag.toString("base64"), encrypted.toString("base64")].join(":")
}

export function decryptSecret(payload: string): string {
  const key = getEncryptionKey()
  const [ivBase64, tagBase64, dataBase64] = payload.split(":")

  if (!ivBase64 || !tagBase64 || !dataBase64) {
    throw new Error("Invalid encrypted payload")
  }

  const iv = Buffer.from(ivBase64, "base64")
  const tag = Buffer.from(tagBase64, "base64")
  const data = Buffer.from(dataBase64, "base64")

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv)
  decipher.setAuthTag(tag)
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()])

  return decrypted.toString("utf8")
}

export function normalizeTwoFactorCode(input: string) {
  return input.replace(/\s|-/g, "").trim()
}

export function generateBackupCodes(count = 10) {
  const codes: string[] = []
  for (let i = 0; i < count; i += 1) {
    const raw = crypto.randomBytes(5).toString("hex").toUpperCase()
    codes.push(`${raw.slice(0, 5)}-${raw.slice(5)}`)
  }
  return codes
}

export function hashDeviceToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex")
}

export function normalizeBackupCode(code: string) {
  return normalizeTwoFactorCode(code).toUpperCase()
}
