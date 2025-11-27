import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Admin
  const adminEmail = 'admin@site.com';
  const adminPassword = await bcrypt.hash('Admin123!', 12);

  await prisma.admin.upsert({
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

  const barber = await prisma.barber.upsert({
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

    const workingHours = [
    { dayOfWeek: 1, startMin: 600, endMin: 1200 }, // Pazartesi 10:00 – 20:00
    { dayOfWeek: 2, startMin: 600, endMin: 1200 }, // Salı
    { dayOfWeek: 3, startMin: 600, endMin: 1200 }, // Çarşamba
    { dayOfWeek: 4, startMin: 600, endMin: 1200 }, // Perşembe
    { dayOfWeek: 5, startMin: 600, endMin: 1200 }, // Cuma
    { dayOfWeek: 6, startMin: 600, endMin: 1200 }, // Cumartesi
  ];

  for (const wh of workingHours) {
    await prisma.workingHour.upsert({
      where: {
        barberId_dayOfWeek_startMin_endMin: {
          barberId: barber.id,
          dayOfWeek: wh.dayOfWeek,
          startMin: wh.startMin,
          endMin: wh.endMin,
        },
      },
      update: {},
      create: {
        barberId: barber.id,
        dayOfWeek: wh.dayOfWeek,
        startMin: wh.startMin,
        endMin: wh.endMin,
        slotSize: "MIN15",
      },
    });
  }

  console.log("Working hours seeded.");
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
