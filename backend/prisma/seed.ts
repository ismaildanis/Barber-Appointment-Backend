import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const shop = await prisma.shop.create({
    data: {
      slug: 'kadikoy-caferağa-ustura-barber',
      name: 'Ustura Barber',
      city: 'İstanbul',
      district: 'Kadıköy',
      neighborhood: 'Caferağa',
      address: 'Caferağa Mah. Moda Cd. No:12',
      phone: '5555555555',
      email: 'danisismail4573@gmail.com',
    },
  });

  const adminPassword = await bcrypt.hash('Admin123!', 12);

  await prisma.admin.create({
    data: {
      shopId: shop.id,
      firstName: 'İsmail',
      lastName: 'Danış',
      email: 'danisismail4573@gmail.com',
      phone: null,
      password: adminPassword,
    },
  });

  const services = [
    {
      name: "Anatomik Saç Kesimi",
      description: "Profesyonel, detaylı anatomik saç kesimi.",
      price: 500,
      duration: 30,
    },
    {
      name: "VIP Saç - Sakal Kesimi",
      description: "Saç + sakal + bakım + özel servis.",
      price: 1500,
      duration: 60,
    },
    {
      name: "VIP Sakal Kesimi",
      description: "Köpük, bakım ve ustura ile VIP sakal kesimi.",
      price: 500,
      duration: 30,
    },
    {
      name: "Çocuk Saç Kesimi",
      description: "10 yaş altı çocuk saç kesimi.",
      price: 400,
      duration: 30,
    },
    {
      name: "Saç Yıkama ve Fön",
      description: "Saç yıkama ve profesyonel fön.",
      price: 250,
      duration: 30,
    },
  ];

  await prisma.service.createMany({
    data: services.map((s) => ({
      ...s,
      shopId: shop.id,
    })),
  });

  console.log('✅ Shop, admin ve services başarıyla seed edildi');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
