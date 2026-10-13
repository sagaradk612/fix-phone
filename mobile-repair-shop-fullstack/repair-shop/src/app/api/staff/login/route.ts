import {createHash} from 'node:crypto';
import bcrypt from 'bcryptjs';
import {NextRequest, NextResponse} from 'next/server';
import {z} from 'zod';
import {prisma} from '@/lib/prisma';
import {createStaffSession, STAFF_SESSION_COOKIE, staffCookieOptions} from '@/lib/staff-auth';

export const runtime = 'nodejs';
const schema = z.object({email: z.string().trim().email().max(200), password: z.string().min(1).max(200)});
const attempts = new Map<string, {count: number; resetAt: number}>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;

function tooManyAttempts(key: string) {
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || current.resetAt <= now) {
    attempts.set(key, {count: 1, resetAt: now + WINDOW_MS});
    return false;
  }
  current.count += 1;
  return current.count > MAX_ATTEMPTS;
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (origin && new URL(origin).host !== request.headers.get('host')) {
    return NextResponse.json({error: 'Invalid request origin.'}, {status: 403});
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({error: 'Enter a valid email and password.'}, {status: 400});

  const email = parsed.data.email.toLowerCase();
  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const rateKey = createHash('sha256').update(`${email}:${forwardedFor}`).digest('hex');
  if (tooManyAttempts(rateKey)) return NextResponse.json({error: 'Too many sign-in attempts. Try again in 15 minutes.'}, {status: 429});

  const staff = await prisma.staffUser.findUnique({where: {email}});
  const validPassword = staff?.active
    ? await bcrypt.compare(parsed.data.password, staff.passwordHash)
    : (await bcrypt.hash(parsed.data.password, 12), false);
  if (!staff || !staff.active || !validPassword) {
    return NextResponse.json({error: 'Email or password is incorrect.'}, {status: 401});
  }

  attempts.delete(rateKey);
  const session = await createStaffSession(staff.id);
  const response = NextResponse.json({staff: {id: staff.id, email: staff.email, displayName: staff.displayName, role: staff.role}});
  response.cookies.set(STAFF_SESSION_COOKIE, session.token, staffCookieOptions(session.expiresAt));
  return response;
}
