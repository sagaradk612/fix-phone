import {createHash, randomBytes} from 'node:crypto';
import {cookies} from 'next/headers';
import type {NextRequest} from 'next/server';
import type {StaffRole} from '@prisma/client';
import {prisma} from '@/lib/prisma';

export const STAFF_SESSION_COOKIE = 'fixform_staff_session';
export const STAFF_SESSION_SECONDS = 8 * 60 * 60;

export type StaffIdentity = {
  id: string;
  email: string;
  displayName: string;
  role: StaffRole;
};

export function hashSessionToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export async function createStaffSession(staffId: string) {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + STAFF_SESSION_SECONDS * 1000);
  await prisma.staffSession.create({data: {tokenHash: hashSessionToken(token), staffId, expiresAt}});
  return {token, expiresAt};
}

export async function getStaffForToken(token?: string): Promise<StaffIdentity | null> {
  if (!token) return null;
  const session = await prisma.staffSession.findUnique({
    where: {tokenHash: hashSessionToken(token)},
    include: {staff: {select: {id: true, email: true, displayName: true, role: true, active: true}}},
  });
  if (!session) return null;
  if (session.expiresAt <= new Date() || !session.staff.active) {
    await prisma.staffSession.deleteMany({where: {id: session.id}});
    return null;
  }
  return {id: session.staff.id, email: session.staff.email, displayName: session.staff.displayName, role: session.staff.role};
}

export async function getCurrentStaff() {
  const cookieStore = await cookies();
  return getStaffForToken(cookieStore.get(STAFF_SESSION_COOKIE)?.value);
}

export async function getRequestStaff(request: NextRequest) {
  return getStaffForToken(request.cookies.get(STAFF_SESSION_COOKIE)?.value);
}

export function hasSameOrigin(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try {
    return new URL(origin).host === request.headers.get('host');
  } catch {
    return false;
  }
}

export async function deleteStaffSession(token?: string) {
  if (!token) return;
  await prisma.staffSession.deleteMany({where: {tokenHash: hashSessionToken(token)}});
}

export function staffCookieOptions(expires: Date) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/',
    expires,
  };
}
