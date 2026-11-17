import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Seed admin
  const passwordHash = await bcrypt.hash('Admin@123', 12);
  await prisma.admin.upsert({
    where: { email: 'admin@punecalinghands.in' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'admin@punecalinghands.in',
      passwordHash,
    },
  });

  // Seed Pune service areas (sample PIN codes)
  const areas = [
    { name: 'Koregaon Park', pinCode: '411001' },
    { name: 'Baner', pinCode: '411045' },
    { name: 'Kothrud', pinCode: '411038' },
    { name: 'Viman Nagar', pinCode: '411014' },
    { name: 'Hadapsar', pinCode: '411028' },
    { name: 'Wakad', pinCode: '411057' },
    { name: 'Hinjewadi', pinCode: '411057' },
    { name: 'Aundh', pinCode: '411007' },
  ];

  for (const area of areas) {
    await prisma.serviceArea.upsert({
      where: { pinCode: area.pinCode },
      update: {},
      create: area,
    });
  }

  // Seed Phase 1 services
  const services = [
    { name: 'Doctor Home Consultation', slug: 'doctor-home-consultation', sortOrder: 1 },
    { name: 'ECG at Home', slug: 'ecg-at-home', sortOrder: 2 },
    { name: 'Blood Test at Home', slug: 'blood-test-at-home', sortOrder: 3 },
    { name: 'X-Ray at Home', slug: 'xray-at-home', sortOrder: 4 },
    { name: 'Medicine Home Delivery', slug: 'medicine-home-delivery', sortOrder: 5 },
    { name: 'Online Consultation', slug: 'online-consultation', sortOrder: 6 },
  ];

  for (const service of services) {
    await prisma.service.upsert({
      where: { slug: service.slug },
      update: {},
      create: service,
    });
  }

  console.warn('Seed completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
