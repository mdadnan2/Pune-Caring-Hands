import { AppointmentType, BookingStatus, PaymentStatus } from '@pch/shared';
import { BookingsService } from './bookings.service';
import { ServiceAreasService } from '../service-areas/service-areas.service';
import { PrismaService } from '../../common/prisma/prisma.service';

type MockPrismaBooking = {
  service: { findFirst: jest.Mock };
  patient: { upsert: jest.Mock };
  slot: { findUnique: jest.Mock; update: jest.Mock };
  booking: { count: jest.Mock; findUnique: jest.Mock; create: jest.Mock };
  $transaction: jest.Mock;
};

describe('BookingsService', () => {
  let prisma: MockPrismaBooking;
  let serviceAreasService: ServiceAreasService;
  let bookingsService: BookingsService;

  beforeEach(() => {
    prisma = {
      service: {
        findFirst: jest.fn(),
      },
      patient: {
        upsert: jest.fn(),
      },
      slot: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      booking: {
        count: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      $transaction: jest.fn(async (callback) => callback(prisma)),
    };

    serviceAreasService = {
      validatePinForService: jest.fn().mockResolvedValue(true),
    } as unknown as ServiceAreasService;

    bookingsService = new BookingsService(prisma as unknown as PrismaService, serviceAreasService);
  });

  it('creates an immediate doctor booking without requiring a slot', async () => {
    prisma.service.findFirst.mockResolvedValue({
      id: 'svc-doctor',
      slug: 'doctor-home-consultation',
      basePrice: 1500,
      isActive: true,
      serviceItems: [],
    });
    prisma.booking.count.mockResolvedValue(4);
    prisma.patient.upsert.mockResolvedValue({ id: 'patient-1' });
    prisma.booking.create.mockResolvedValue({
      bookingRef: 'PCH-20250101-0005',
      status: BookingStatus.REQUESTED,
      appointmentType: AppointmentType.IMMEDIATE,
      totalAmount: 1500,
      service: { name: 'Doctor Home Consultation', slug: 'doctor-home-consultation' },
      slot: null,
      bookingItems: [],
      payment: { id: 'pay-1', amount: 1500, status: PaymentStatus.PENDING },
      createdAt: new Date(),
    });

    await expect(
      bookingsService.create({
        serviceId: 'svc-doctor',
        appointmentType: AppointmentType.IMMEDIATE,
        patientName: 'Asha Patil',
        patientPhone: '9876543210',
        patientAddress: 'Flat 1, Pune Maharashtra',
        patientPinCode: '411045',
        serviceDetails: { chiefComplaint: 'Fever and weakness' },
        notes: 'Need prompt visit',
      }),
    ).resolves.toMatchObject({
      bookingRef: expect.any(String),
      status: BookingStatus.REQUESTED,
    });
  });

  it('rejects scheduled bookings without a slot', async () => {
    prisma.service.findFirst.mockResolvedValue({
      id: 'svc-doctor',
      slug: 'doctor-home-consultation',
      basePrice: 1500,
      isActive: true,
      serviceItems: [],
    });

    await expect(
      bookingsService.create({
        serviceId: 'svc-doctor',
        appointmentType: AppointmentType.SCHEDULED,
        patientName: 'Asha Patil',
        patientPhone: '9876543210',
        patientAddress: 'Flat 1, Pune Maharashtra',
        patientPinCode: '411045',
        serviceDetails: { chiefComplaint: 'Fever and weakness' },
      }),
    ).rejects.toMatchObject({
      response: { code: 'VALIDATION_ERROR' },
    });
  });

  it('rejects unsupported service area requests', async () => {
    prisma.service.findFirst.mockResolvedValue({
      id: 'svc-doctor',
      slug: 'doctor-home-consultation',
      basePrice: 1500,
      isActive: true,
      serviceItems: [],
    });
    (serviceAreasService.validatePinForService as jest.Mock).mockResolvedValue(false);

    await expect(
      bookingsService.create({
        serviceId: 'svc-doctor',
        appointmentType: AppointmentType.IMMEDIATE,
        patientName: 'Asha Patil',
        patientPhone: '9876543210',
        patientAddress: 'Flat 1, Pune Maharashtra',
        patientPinCode: '000000',
        serviceDetails: { chiefComplaint: 'Fever' },
      }),
    ).rejects.toMatchObject({
      response: { code: 'AREA_NOT_SUPPORTED' },
    });
  });

  it('rejects blood tests when no service item is selected', async () => {
    prisma.service.findFirst.mockResolvedValue({
      id: 'svc-blood',
      slug: 'blood-test-at-home',
      basePrice: null,
      isActive: true,
      serviceItems: [
        { id: 'item-1', name: 'CBC', price: 500, isActive: true },
        { id: 'item-2', name: 'LFT', price: 900, isActive: true },
      ],
    });

    await expect(
      bookingsService.create({
        serviceId: 'svc-blood',
        appointmentType: AppointmentType.SCHEDULED,
        patientName: 'Asha Patil',
        patientPhone: '9876543210',
        patientAddress: 'Flat 1, Pune Maharashtra',
        patientPinCode: '411045',
        serviceDetails: { chiefComplaint: 'Routine blood test' },
        slotId: 'slot-1',
      }),
    ).rejects.toMatchObject({
      response: { code: 'VALIDATION_ERROR' },
    });
  });
});
