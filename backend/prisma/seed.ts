import { PrismaClient, Range } from '@prisma/client';
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
        slotSize: Range.MIN15,
      },
    });
  }

  console.log("Working hours seeded.");
  await prisma.appointment.deleteMany();
  await prisma.service.deleteMany();

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
      name: "VIP Saç Kesimi",
      description: "Detaylı VIP saç kesimi ve bakım.",
      price: 1000,
      duration: 45,
    },
    {
      name: "VIP Sakal Kesimi",
      description: "Köpük, bakım ve ustura ile VIP sakal kesimi.",
      price: 500,
      duration: 30,
    },
    {
      name: "Modern Sakal Tıraşı",
      description: "Modern çizim ve şekillendirme ile sakal tıraşı.",
      price: 250,
      duration: 20,
    },
    {
      name: "Saç Yıkama ve Fön",
      description: "Saç yıkama, bakım ve profesyonel fön işlemi.",
      price: 250,
      duration: 20,
    },
    {
      name: "Usturayla Sakal Tıraşı",
      description: "Klasik ustura tıraşı, sıcak havlu uygulamalı.",
      price: 250,
      duration: 20,
    },
    {
      name: "Çocuk Saç Kesimi",
      description: "10 yaş altı çocuk saç kesimi.",
      price: 400,
      duration: 25,
    },
    {
      name: "Anatomik Kaş Tasarımı",
      description: "Profesyonel erkek kaş tasarımı.",
      price: 250,
      duration: 15,
    },
    {
      name: "Ense ve Favori Düzeltme",
      description: "Ense ve favorilerin makine / ustura ile düzenlenmesi.",
      price: 250,
      duration: 15,
    },
    {
      name: "Ağda (Yanak - Kulak)",
      description: "Yanak ve kulak bölgelerine ağda uygulaması.",
      price: 250,
      duration: 10,
    },
    {
      name: "Saç Düzleştirici",
      description: "Saç düzleştirme işlemi.",
      price: 600,
      duration: 30,
    },
    {
      name: "Saç Karbon Maskesi",
      description: "Yağ ve kir temizleyen karbon saç maskesi.",
      price: 500,
      duration: 25,
    },
    {
      name: "Saç Biotin ve Kolajen Maskesi",
      description: "Biotin + kolajen ile saç güçlendirme bakımı.",
      price: 500,
      duration: 25,
    },
    {
      name: "Saç Protein Maskesi",
      description: "Yoğun protein saç maskesi.",
      price: 500,
      duration: 25,
    },
  ];

  await prisma.service.createMany({ data: services });

  console.log("Services seeded successfully ✔");
}


main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
