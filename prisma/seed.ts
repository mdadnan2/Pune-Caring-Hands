import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // ─── Admin ──────────────────────────────────────────────────────────────────
  // Credentials are read from environment variables — never hardcoded.
  // Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in your .env before running.
  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error(
      'SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set in your .env file before seeding.',
    );
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.admin.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: 'Super Admin',
      email: adminEmail,
      passwordHash,
    },
  });

  // ─── Service Areas ───────────────────────────────────────────────────────────
  const areas = [
    { name: 'Koregaon Park', pinCode: '411001' },
    { name: 'Baner', pinCode: '411045' },
    { name: 'Kothrud', pinCode: '411038' },
    { name: 'Viman Nagar', pinCode: '411014' },
    { name: 'Hadapsar', pinCode: '411028' },
    { name: 'Wakad', pinCode: '411057' },
    { name: 'Hinjewadi', pinCode: '411058' },
    { name: 'Aundh', pinCode: '411007' },
    { name: 'Shivajinagar', pinCode: '411005' },
    { name: 'Pimpri', pinCode: '411018' },
  ];

  for (const area of areas) {
    await prisma.serviceArea.upsert({
      where: { pinCode: area.pinCode },
      update: { name: area.name },
      create: area,
    });
  }

  // ─── Services ────────────────────────────────────────────────────────────────
  const services = [
    {
      name: 'Doctor Home Consultation',
      slug: 'doctor-home-consultation',
      basePrice: 1500,
      sortOrder: 1,
    },
    { name: 'ECG at Home', slug: 'ecg-at-home', basePrice: 700, sortOrder: 2 },
    { name: 'Blood Test at Home', slug: 'blood-test-at-home', basePrice: null, sortOrder: 3 },
    { name: 'X-Ray at Home', slug: 'xray-at-home', basePrice: null, sortOrder: 4 },
    {
      name: 'Medicine Home Delivery',
      slug: 'medicine-home-delivery',
      basePrice: null,
      sortOrder: 5,
    },
    { name: 'Online Consultation', slug: 'online-consultation', basePrice: 500, sortOrder: 6 },
  ];

  for (const service of services) {
    await prisma.service.upsert({
      where: { slug: service.slug },
      update: {},
      create: service,
    });
  }

  console.warn('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
