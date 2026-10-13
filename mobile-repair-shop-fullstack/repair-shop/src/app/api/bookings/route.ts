import {randomBytes} from 'node:crypto';
import {NextRequest, NextResponse} from 'next/server';
import {z} from 'zod';
import {prisma} from '@/lib/prisma';
import {ensureStarterRepairCatalog} from '@/lib/repair-pricing';
import {getRequestStaff, hasSameOrigin} from '@/lib/staff-auth';

export const runtime = 'nodejs';
const bookingSchema = z.object({
  customerName: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(5).max(40),
  email: z.union([z.string().trim().email().max(200), z.literal(''), z.undefined()]).optional(),
  model: z.string().trim().min(2).max(120),
  serviceId: z.string().min(1),
  quality: z.string().trim().min(2).max(80),
  details: z.string().trim().max(1300).optional().default(''),
  preferredDate: z.union([z.string().max(30), z.literal(''), z.undefined()]).optional(),
  notes: z.union([z.string().max(1500), z.literal(''), z.undefined()]).optional(),
  locale: z.string().trim().max(20).optional(),
});
const statuses = ['REQUESTED', 'RECEIVED', 'DIAGNOSING', 'WAITING_APPROVAL', 'WAITING_PARTS', 'IN_PROGRESS', 'READY_FOR_PICKUP', 'COMPLETED', 'CANCELLED'] as const;

export async function POST(request: NextRequest) {
  try {
    const parsed = bookingSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({error: 'Please check the required fields.', details: parsed.error.flatten().fieldErrors}, {status: 400});
    const data = parsed.data;
    let preferredDate: Date | undefined;
    if (data.preferredDate) {
      preferredDate = new Date(`${data.preferredDate}T12:00:00.000Z`);
      if (Number.isNaN(preferredDate.getTime()) || preferredDate.getTime() < Date.now() - 86400000) {
        return NextResponse.json({error: 'Preferred date must be today or later.'}, {status: 400});
      }
    }
    await ensureStarterRepairCatalog();
    const repairPrice = await prisma.repairVariantPrice.findUnique({
      where: {serviceId_model_quality: {serviceId: data.serviceId, model: data.model, quality: data.quality}},
      include: {service: true},
    });
    if (!repairPrice?.active || !repairPrice.service.active) {
      return NextResponse.json({error: 'That repair, model, and quality combination is not available. Please choose another option.'}, {status: 400});
    }
    const reference = `FX-${randomBytes(4).toString('hex').toUpperCase()}`;
    const booking = await prisma.booking.create({data: {
      reference,
      customerName: data.customerName,
      phone: data.phone,
      email: data.email || null,
      device: data.model,
      issue: data.details ? `${data.quality}: ${data.details}` : data.quality,
      service: repairPrice.service.name,
      preferredDate,
      notes: data.notes || null,
      locale: data.locale || 'en',
      quotedPrice: repairPrice.price,
      currency: repairPrice.currency,
    }});
    return NextResponse.json({reference: booking.reference, status: booking.status, quotedPrice: Number(booking.quotedPrice), currency: booking.currency}, {status: 201});
  } catch (error) {
    console.error('Booking create failed', error);
    return NextResponse.json({error: 'Booking service is unavailable. Please try again later.'}, {status: 500});
  }
}

export async function GET(request: NextRequest) {
  const staff = await getRequestStaff(request);
  if (!staff) return NextResponse.json({error: 'Sign-in required.'}, {status: 401});
  try {
    const bookings = await prisma.booking.findMany({
      orderBy: {createdAt: 'desc'},
      take: 300,
      select: {id: true, reference: true, customerName: true, phone: true, email: true, device: true, issue: true, service: true, preferredDate: true, notes: true, locale: true, status: true, quotedPrice: true, currency: true, createdAt: true, updatedAt: true},
    });
    return NextResponse.json({bookings: bookings.map(booking => ({...booking, quotedPrice: booking.quotedPrice?.toNumber() ?? null})), staff: {role: staff.role, displayName: staff.displayName}});
  } catch (error) {
    console.error('Booking list failed', error);
    return NextResponse.json({error: 'Could not load bookings.'}, {status: 500});
  }
}

export async function PATCH(request: NextRequest) {
  const staff = await getRequestStaff(request);
  if (!staff) return NextResponse.json({error: 'Sign-in required.'}, {status: 401});
  if (!hasSameOrigin(request)) return NextResponse.json({error: 'Invalid request origin.'}, {status: 403});
  try {
    const updateSchema = z.object({
      id: z.string().min(1),
      status: z.enum(statuses).optional(),
      quotedPrice: z.number().min(0).max(1000000).optional(),
    }).refine(value => value.status !== undefined || value.quotedPrice !== undefined);
    const parsed = updateSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({error: 'Invalid booking ID or status.'}, {status: 400});
    }
    const {id, ...data} = parsed.data;
    const booking = await prisma.booking.update({where: {id}, data});
    return NextResponse.json({booking: {...booking, quotedPrice: booking.quotedPrice?.toNumber() ?? null}});
  } catch (error) {
    console.error('Booking update failed', error);
    return NextResponse.json({error: 'Could not update booking.'}, {status: 500});
  }
}
