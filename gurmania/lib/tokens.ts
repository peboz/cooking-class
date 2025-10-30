import { prisma } from '@/prisma';
import crypto from 'crypto';

const TOKEN_EXPIRY_HOURS = 24;
const RESEND_COOLDOWN_MINUTES = 5;

export async function generateVerificationToken(email: string) {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

  // Delete old tokens for this email
  await prisma.emailVerificationToken.deleteMany({
    where: { email },
  });

  // Create new token
  await prisma.emailVerificationToken.create({
    data: {
      email,
      token,
      expires,
    },
  });

  return token;
}

export async function generatePasswordResetToken(email: string) {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

  // Delete old tokens for this email
  await prisma.passwordResetToken.deleteMany({
    where: { email },
  });

  // Create new token
  await prisma.passwordResetToken.create({
    data: {
      email,
      token,
      expires,
    },
  });

  return token;
}

export async function verifyEmailToken(token: string) {
  const tokenRecord = await prisma.emailVerificationToken.findUnique({
    where: { token },
  });

  if (!tokenRecord) {
    return { error: 'Invalid token' };
  }

  if (tokenRecord.expires < new Date()) {
    await prisma.emailVerificationToken.delete({
      where: { token },
    });
    return { error: 'Token expired' };
  }

  return { email: tokenRecord.email };
}

export async function verifyPasswordResetToken(token: string) {
  const tokenRecord = await prisma.passwordResetToken.findUnique({
    where: { token },
  });

  if (!tokenRecord) {
    return { error: 'Invalid token' };
  }

  if (tokenRecord.expires < new Date()) {
    await prisma.passwordResetToken.delete({
      where: { token },
    });
    return { error: 'Token expired' };
  }

  return { email: tokenRecord.email };
}

export async function canResendVerificationEmail(email: string) {
  const latestToken = await prisma.emailVerificationToken.findFirst({
    where: { email },
    orderBy: { createdAt: 'desc' },
  });

  if (!latestToken) {
    return true;
  }

  const cooldownEnd = new Date(
    latestToken.createdAt.getTime() + RESEND_COOLDOWN_MINUTES * 60 * 1000
  );

  return new Date() >= cooldownEnd;
}

export async function deleteVerificationToken(token: string) {
  await prisma.emailVerificationToken.delete({
    where: { token },
  });
}

export async function deletePasswordResetToken(token: string) {
  await prisma.passwordResetToken.delete({
    where: { token },
  });
}

