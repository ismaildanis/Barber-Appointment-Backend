import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Admin zaten var mı?
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@site.com' },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('Admin123!', 12);

    await prisma.user.create({
      data: {
        firstName: 'Super',
        lastName: 'Admin',
        email: 'admin@site.com',
        phone: '0000000000',
        password: hashedPassword,
        role: 'ADMIN',
        refreshToken: null,
      },
    });

    console.log('Admin user created.');
  } else {
    console.log('Admin already exists. Skipping.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
