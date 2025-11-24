import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Admin
  const adminEmail = 'admin@site.com';
  const adminPassword = await bcrypt.hash('Admin123!', 12);

  await prisma.customer.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      firstName: 'Super',
      lastName: 'Admin',
      email: adminEmail,
      phone: '0000000000',
      password: adminPassword,
      refreshToken: null,
    },
  });
  console.log('Admin user ensured.');

  // Barber
  const barberEmail = 'barber@site.com';
  const barberPassword = await bcrypt.hash('Barber123!', 12);

  await prisma.barber.upsert({
    where: { email: barberEmail },
    update: {},
    create: {
      firstName: 'John',
      lastName: 'Barber',
      email: barberEmail,
      phone: '1111111111',
      password: barberPassword,
      active: true,
      refreshToken: null,
    },
  });
  console.log('Barber ensured.');

  // Service (find/create çünkü name unique değil)
  const serviceName = 'Sac Kesimi';
  const existingService = await prisma.service.findFirst({ where: { name: serviceName } });

  if (!existingService) {
    await prisma.service.create({
      data: {
        name: serviceName,
        description: 'Klasik sac kesimi',
        price: 150,
        duration: 30,
      },
    });
    console.log('Service created.');
  } else {
    console.log('Service already exists.');
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
