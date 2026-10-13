import {NextRequest, NextResponse} from 'next/server';
import {Prisma} from '@prisma/client';
import {z} from 'zod';
import {prisma} from '@/lib/prisma';
import {getRequestStaff, hasSameOrigin} from '@/lib/staff-auth';

export const runtime = 'nodejs';
const statusSchema = z.object({status: z.enum(['PENDING', 'CONFIRMED', 'PAID', 'SHIPPED', 'COMPLETED', 'CANCELLED'])});

export async function PATCH(request: NextRequest, context: {params: Promise<{id: string}>}) {
  const staff = await getRequestStaff(request);
  if (!staff) return NextResponse.json({error: 'Sign-in required.'}, {status: 401});
  if (!hasSameOrigin(request)) return NextResponse.json({error: 'Invalid request origin.'}, {status: 403});
  const parsed = statusSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({error: 'Invalid order status.'}, {status: 400});
  try {
    const {id} = await context.params;
    const order = await prisma.$transaction(async transaction => {
      const current = await transaction.shopOrder.findUnique({where: {id}, include: {items: true}});
      if (!current) throw new Error('ORDER_NOT_FOUND');
      const nextStatus = parsed.data.status;
      if (current.status !== nextStatus) {
        if (nextStatus === 'CANCELLED' && current.status !== 'CANCELLED') {
          for (const item of current.items) {
            if (item.productId) await transaction.shopProduct.update({where: {id: item.productId}, data: {stock: {increment: item.quantity}}});
          }
        } else if (current.status === 'CANCELLED' && nextStatus !== 'CANCELLED') {
          for (const item of current.items) {
            if (!item.productId) continue;
            const reserved = await transaction.shopProduct.updateMany({
              where: {id: item.productId, active: true, stock: {gte: item.quantity}},
              data: {stock: {decrement: item.quantity}},
            });
            if (reserved.count !== 1) throw new Error(`INSUFFICIENT_STOCK:${item.productName}`);
          }
        }
      }
      return transaction.shopOrder.update({where: {id}, data: parsed.data});
    }, {isolationLevel: Prisma.TransactionIsolationLevel.Serializable});
    return NextResponse.json({order: {...order, total: order.total.toNumber()}});
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('INSUFFICIENT_STOCK:')) {
      return NextResponse.json({error: `Cannot reopen this order because ${error.message.slice('INSUFFICIENT_STOCK:'.length)} no longer has enough stock.`}, {status: 409});
    }
    if (error instanceof Error && error.message === 'ORDER_NOT_FOUND') return NextResponse.json({error: 'Order not found.'}, {status: 404});
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
      return NextResponse.json({error: 'Inventory changed during this update. Please retry.'}, {status: 409});
    }
    console.error('Order status update failed', error);
    return NextResponse.json({error: 'Could not update this order.'}, {status: 404});
  }
}
