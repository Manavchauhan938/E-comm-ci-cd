import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
import { conflict, unauthorized, badRequest, notFound } from '../utils/AppError.js';
import { parseExpiryToMs } from '../utils/helpers.js';
import { logger } from '../utils/logger.js';

const SALT_ROUNDS = 12;
const REFRESH_COOKIE = 'refreshToken';

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
}

function signAccessToken(user) {
  // Minimal payload — no email/role secrets beyond what's needed for authz checks refreshed from DB
  return jwt.sign({ role: user.role }, env.jwtAccessSecret, {
    subject: user.id,
    expiresIn: env.jwtAccessExpiresIn,
  });
}

function signRefreshToken(user) {
  return jwt.sign({ typ: 'refresh' }, env.jwtRefreshSecret, {
    subject: user.id,
    expiresIn: env.jwtRefreshExpiresIn,
  });
}

export function setRefreshCookie(res, token) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: 'lax',
    maxAge: parseExpiryToMs(env.jwtRefreshExpiresIn),
    path: '/api/auth',
  });
}

export function clearRefreshCookie(res) {
  res.clearCookie(REFRESH_COOKIE, {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: 'lax',
    path: '/api/auth',
  });
}

async function persistRefreshToken(userId, token) {
  const expiresAt = new Date(Date.now() + parseExpiryToMs(env.jwtRefreshExpiresIn));
  await prisma.refreshToken.create({
    data: { userId, token, expiresAt },
  });
}

export async function register({ name, email, password }) {
  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) throw conflict('Email is already registered');

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: {
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: 'CUSTOMER',
    },
  });

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  await persistRefreshToken(user.id, refreshToken);

  return { user: publicUser(user), accessToken, refreshToken };
}

export async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user || !user.isActive) throw unauthorized('Invalid email or password');

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw unauthorized('Invalid email or password');

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  await persistRefreshToken(user.id, refreshToken);

  return { user: publicUser(user), accessToken, refreshToken };
}

export async function refresh(refreshToken) {
  if (!refreshToken) throw unauthorized('Refresh token required');

  let payload;
  try {
    payload = jwt.verify(refreshToken, env.jwtRefreshSecret);
  } catch {
    throw unauthorized('Invalid or expired refresh token');
  }

  const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw unauthorized('Refresh token revoked or expired');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user?.isActive) throw unauthorized('User not found or inactive');

  // Rotate refresh token
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });

  const accessToken = signAccessToken(user);
  const newRefresh = signRefreshToken(user);
  await persistRefreshToken(user.id, newRefresh);

  return { user: publicUser(user), accessToken, refreshToken: newRefresh };
}

export async function logout(refreshToken) {
  if (refreshToken) {
    await prisma.refreshToken.updateMany({
      where: { token: refreshToken, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}

export async function forgotPassword(email) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  // Always succeed to avoid email enumeration
  if (!user) {
    return { message: 'If that email exists, a reset link has been sent' };
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: { userId: user.id, token, expiresAt },
  });

  const resetUrl = `${env.clientUrl}/reset-password?token=${token}`;
  // Email placeholder — structured log in development
  logger.info({ email: user.email, resetUrl }, 'Password reset email (placeholder)');

  return {
    message: 'If that email exists, a reset link has been sent',
    ...(env.isProd ? {} : { devResetUrl: resetUrl }),
  };
}

export async function resetPassword({ token, password }) {
  const record = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    throw badRequest('Invalid or expired reset token');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    prisma.refreshToken.updateMany({
      where: { userId: record.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);

  return { message: 'Password updated successfully' };
}

export async function getMe(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, phone: true, createdAt: true },
  });
  if (!user) throw notFound('User not found');
  return user;
}

export { REFRESH_COOKIE };
