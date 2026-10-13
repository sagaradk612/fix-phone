import bcrypt from 'bcryptjs';
import {NextRequest, NextResponse} from 'next/server';
import {z} from 'zod';
import {prisma} from '@/lib/prisma';
import {getRequestStaff, hasSameOrigin} from '@/lib/staff-auth';

export const runtime = 'nodejs';
const createSchema = z.object({
  displayName: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(200),
  password: z.string().min(14).max(200),
  role: z.enum(['MANAGER', 'STAFF']),
});
const updateSchema = z.object({
  role: z.enum(['MANAGER', 'STAFF']).optional(),
  active: z.boolean().optional(),
}).refine(value => Object.keys(value).length > 0);

export async function GET(request: NextRequest) {
  const staff = await getRequestStaff(request);
  if (staff?.role !== 'OWNER') return NextResponse.json({error: 'Owner access required.'}, {status: 403});
  const users = await prisma.staffUser.findMany({select: {id: true, email: true, displayName: true, role: true, active: true, createdAt: true}, orderBy: {createdAt: 'asc'}});
  return NextResponse.json({staff: users});
}

export async function POST(request: NextRequest) {
  const actor = await getRequestStaff(request);
  if (actor?.role !== 'OWNER') return NextResponse.json({error: 'Owner access required.'}, {status: 403});
  if (!hasSameOrigin(request)) return NextResponse.json({error: 'Invalid request origin.'}, {status: 403});
  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({error: 'Check the staff details. Passwords need at least 14 characters.'}, {status: 400});
  try {
    const user = await prisma.staffUser.create({data: {
      ...parsed.data,
      email: parsed.data.email.toLowerCase(),
      passwordHash: await bcrypt.hash(parsed.data.password, 12),
    }, select: {id: true, email: true, displayName: true, role: true, active: true, createdAt: true}});
    return NextResponse.json({staff: user}, {status: 201});
  } catch (error) {
    console.error('Staff account create failed', error);
    return NextResponse.json({error: 'Could not create account. The email may already be in use.'}, {status: 409});
  }
}

export async function PATCH(request: NextRequest) {
  const actor = await getRequestStaff(request);
  if (actor?.role !== 'OWNER') return NextResponse.json({error: 'Owner access required.'}, {status: 403});
  if (!hasSameOrigin(request)) return NextResponse.json({error: 'Invalid request origin.'}, {status: 403});
  const body = await request.json().catch(() => null);
  if (!body || typeof body.id !== 'string') return NextResponse.json({error: 'Invalid staff account.'}, {status: 400});
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({error: 'Invalid staff account update.'}, {status: 400});
  try {
    const target = await prisma.staffUser.findUnique({where: {id: body.id}});
    if (!target || target.role === 'OWNER') return NextResponse.json({error: 'Owner accounts cannot be changed here.'}, {status: 400});
    const user = await prisma.staffUser.update({where: {id: target.id}, data: parsed.data, select: {id: true, email: true, displayName: true, role: true, active: true, createdAt: true}});
    if (parsed.data.active === false) await prisma.staffSession.deleteMany({where: {staffId: target.id}});
    return NextResponse.json({staff: user});
  } catch (error) {
    console.error('Staff account update failed', error);
    return NextResponse.json({error: 'Could not update this account.'}, {status: 500});
  }
}
