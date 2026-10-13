import {NextRequest, NextResponse} from 'next/server';
import {deleteStaffSession, STAFF_SESSION_COOKIE, staffCookieOptions} from '@/lib/staff-auth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (origin && new URL(origin).host !== request.headers.get('host')) {
    return NextResponse.json({error: 'Invalid request origin.'}, {status: 403});
  }
  const token = request.cookies.get(STAFF_SESSION_COOKIE)?.value;
  await deleteStaffSession(token);
  const response = NextResponse.json({ok: true});
  response.cookies.set(STAFF_SESSION_COOKIE, '', {...staffCookieOptions(new Date(0)), maxAge: 0});
  return response;
}
