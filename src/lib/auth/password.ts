import { createHmac } from 'crypto'

const getSecret = () => {
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error('AUTH_SECRET is not set in environment variables')
  return secret
}

export function hashPassword(password: string): string {
  const secret = getSecret()
  return createHmac('sha256', secret).update(password).digest('hex')
}

export function verifyPassword(password: string, hash: string): boolean {
  const hashed = hashPassword(password)
  return hashed === hash
}
