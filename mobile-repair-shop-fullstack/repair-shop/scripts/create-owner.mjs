import bcrypt from 'bcryptjs';
import {PrismaClient} from '@prisma/client';

const prisma = new PrismaClient();
const email = process.env.BOOTSTRAP_OWNER_EMAIL?.trim().toLowerCase();
const password = process.env.BOOTSTRAP_OWNER_PASSWORD;
const displayName = process.env.BOOTSTRAP_OWNER_NAME?.trim() || 'Shop Owner';

try {
  if (!email || !password) throw new Error('Set BOOTSTRAP_OWNER_EMAIL and BOOTSTRAP_OWNER_PASSWORD in .env first.');
  if (password.length < 14 || password.length > 200) throw new Error('Owner password must be between 14 and 200 characters.');
  if (await prisma.staffUser.count({where: {role: 'OWNER'}})) throw new Error('An owner account already exists.');
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.staffUser.create({data: {email, displayName, passwordHash, role: 'OWNER'}});
  console.log(`Owner account created for ${email}. Remove the bootstrap password from .env now.`);
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Owner account could not be created.');
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
