import {randomBytes} from 'node:crypto';
import {Prisma} from '@prisma/client';
import {NextRequest, NextResponse} from 'next/server';
import {z} from 'zod';
import {prisma} from '@/lib/prisma';
import {getRequestStaff, hasSameOrigin} from '@/lib/staff-auth';

export const runtime = 'nodejs';
const orderSchema = z.object({
  customerName: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().min(5).max(40),
  shippingAddress: z.string().trim().min(8).max(1000),
  notes: z.string().trim().max(1000).optional(),
  items: z.array(z.object({productId: z.string().min(1), quantity: z.number().int().min(1).max(5)})).min(1).max(20),
});

export async function POST(request: NextRequest) {
  const parsed = orderSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({error: 'Check your contact and delivery details.', details: parsed.error.flatten().fieldErrors}, {status: 400});
  const data = parsed.data;
  const quantities = new Map<string, number>();
  for (const item of data.items) quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
  try {
    const order = await prisma.$transaction(async transaction => {
      const products = await transaction.shopProduct.findMany({where: {id: {in: [...quantities.keys()]}, active: true}});
      if (products.length !== quantities.size) throw new Error('A selected phone is no longer available.');
      const items: Array<{productId: string; productName: string; quantity: number; unitPrice: Prisma.Decimal}> = [];
      let total = new Prisma.Decimal(0);
      for (const product of products) {
        const quantity = quantities.get(product.id) ?? 0;
        const reserved = await transaction.shopProduct.updateMany({where: {id: product.id, active: true, stock: {gte: quantity}}, data: {stock: {decrement: quantity}}});
        if (reserved.count !== 1) throw new Error(`${product.name} does not have enough stock.`);
        items.push({productId: product.id, productName: product.name, quantity, unitPrice: product.price});
        total = total.add(product.price.mul(quantity));
      }
      return transaction.shopOrder.create({data: {
        reference: `PH-${randomBytes(5).toString('hex').toUpperCase()}`,
        customerName: data.customerName,
        email: data.email,
        phone: data.phone,
        shippingAddress: data.shippingAddress,
        notes: data.notes || null,
        total,
        items: {create: items},
      }});
    }, {isolationLevel: Prisma.TransactionIsolationLevel.Serializable});
    return NextResponse.json({reference: order.reference, status: order.status, total: order.total.toNumber()}, {status: 201});
  } catch (error) {
    if (error instanceof Error && (error.message.includes('stock') || error.message.includes('no longer available'))) {
      return NextResponse.json({error: error.message}, {status: 409});
    }
    console.error('Shop order failed', error);
    return NextResponse.json({error: 'Your order could not be saved. Please try again.'}, {status: 500});
  }
}

export async function GET(request: NextRequest) {
  const staff = await getRequestStaff(request);
  if (!staff) return NextResponse.json({error: 'Sign-in required.'}, {status: 401});
  const orders = await prisma.shopOrder.findMany({include: {items: true}, orderBy: {createdAt: 'desc'}, take: 300});
  return NextResponse.json({orders: orders.map(order => ({...order, total: order.total.toNumber(), items: order.items.map(item => ({...item, unitPrice: item.unitPrice.toNumber()}))}))});
}
