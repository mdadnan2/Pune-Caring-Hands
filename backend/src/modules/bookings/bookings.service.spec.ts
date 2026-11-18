import { AppointmentType, BookingStatus, PaymentStatus } from '@pch/shared';
import { BookingsService } from './bookings.service';
import { ServiceAreasService } from '../service-areas/service-areas.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';
import { InternalServerErrorException } from '@nestjs/common';

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
  let uploadsService: UploadsService;
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

    uploadsService = {
      validateFile: jest.fn(),
      saveFile: jest.fn().mockResolvedValue('prescriptions/2026/11/test-prescription.pdf'),
      deleteFile: jest.fn(),
    } as unknown as UploadsService;

    bookingsService = new BookingsService(
      prisma as unknown as PrismaService,
      serviceAreasService,
      uploadsService,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
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

  it('rejects medicine delivery when the prescription is missing, even if notes are supplied', async () => {
    prisma.service.findFirst.mockResolvedValue({
      id: 'svc-medicine',
      slug: 'medicine-home-delivery',
      basePrice: null,
      isActive: true,
      serviceItems: [],
    });

    await expect(
      bookingsService.create({
        serviceId: 'svc-medicine',
        appointmentType: AppointmentType.SCHEDULED,
        patientName: 'Asha Patil',
        patientPhone: '9876543210',
        patientAddress: 'Flat 1, Pune Maharashtra',
        patientPinCode: '411045',
        slotId: 'slot-1',
        notes: 'Prescription will follow',
      }),
    ).rejects.toMatchObject({
      response: { code: 'VALIDATION_ERROR' },
    });

    expect(uploadsService.saveFile).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('stores the prescription before creating the medicine booking', async () => {
    prisma.service.findFirst.mockResolvedValue({
      id: 'svc-medicine',
      slug: 'medicine-home-delivery',
      basePrice: null,
      isActive: true,
      serviceItems: [],
    });
    prisma.booking.count.mockResolvedValue(0);
    prisma.patient.upsert.mockResolvedValue({ id: 'patient-1' });
    prisma.slot.findUnique.mockResolvedValue({
      id: 'slot-1',
      isAvailable: true,
      date: new Date('2999-11-19T00:00:00.000Z'),
      startTime: '09:00',
    });
    prisma.booking.findUnique.mockResolvedValue(null);
    prisma.slot.update.mockResolvedValue({});
    prisma.booking.create.mockResolvedValue({
      bookingRef: 'PCH-20261118-0001',
      status: BookingStatus.REQUESTED,
      appointmentType: AppointmentType.SCHEDULED,
      totalAmount: 0,
      service: { name: 'Medicine Home Delivery', slug: 'medicine-home-delivery' },
      slot: { date: new Date('2999-11-19T00:00:00.000Z'), startTime: '09:00', endTime: '10:00' },
      bookingItems: [],
      payment: { id: 'pay-1', amount: 0, status: PaymentStatus.PENDING },
      createdAt: new Date(),
    });

    const prescription = {
      originalname: 'patient-upload.pdf',
      mimetype: 'application/pdf',
      size: 8,
      buffer: Buffer.from('%PDF-1.7'),
    };

    await expect(
      bookingsService.create(
        {
          serviceId: 'svc-medicine',
          appointmentType: AppointmentType.SCHEDULED,
          patientName: 'Asha Patil',
          patientPhone: '9876543210',
          patientAddress: 'Flat 1, Pune Maharashtra',
          patientPinCode: '411045',
          slotId: 'slot-1',
        },
        prescription,
      ),
    ).resolves.toMatchObject({
      bookingRef: 'PCH-20261118-0001',
      status: BookingStatus.REQUESTED,
    });

    expect(uploadsService.saveFile).toHaveBeenCalledWith(
      prescription,
      'prescriptions',
      expect.any(String),
      'prescription',
    );
    const saveFileCallOrder =
      (uploadsService.saveFile as jest.Mock).mock.invocationCallOrder[0] ?? Number.MAX_SAFE_INTEGER;
    const transactionCallOrder = prisma.$transaction.mock.invocationCallOrder[0] ?? -1;
    expect(saveFileCallOrder).toBeLessThan(transactionCallOrder);
    expect(prisma.booking.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          serviceDetails: expect.objectContaining({
            prescriptionFileKey: 'prescriptions/2026/11/test-prescription.pdf',
          }),
        }),
      }),
    );
  });

  it('does not create a booking when prescription storage fails', async () => {
    prisma.service.findFirst.mockResolvedValue({
      id: 'svc-medicine',
      slug: 'medicine-home-delivery',
      basePrice: null,
      isActive: true,
      serviceItems: [],
    });
    prisma.booking.count.mockResolvedValue(0);
    (uploadsService.saveFile as jest.Mock).mockRejectedValue(
      new InternalServerErrorException({
        message: 'Could not save your prescription; the booking was not created. Please retry.',
        code: 'UPLOAD_FAILED',
      }),
    );

    await expect(
      bookingsService.create(
        {
          serviceId: 'svc-medicine',
          appointmentType: AppointmentType.SCHEDULED,
          patientName: 'Asha Patil',
          patientPhone: '9876543210',
          patientAddress: 'Flat 1, Pune Maharashtra',
          patientPinCode: '411045',
          slotId: 'slot-1',
        },
        {
          originalname: 'patient-upload.pdf',
          mimetype: 'application/pdf',
          size: 9,
          buffer: Buffer.from('%PDF-1.7'),
        },
      ),
    ).rejects.toThrow(
      'Could not save your prescription; the booking was not created. Please retry.',
    );

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('removes the stored prescription and returns a clear failure if booking persistence fails', async () => {
    prisma.service.findFirst.mockResolvedValue({
      id: 'svc-medicine',
      slug: 'medicine-home-delivery',
      basePrice: null,
      isActive: true,
      serviceItems: [],
    });
    prisma.booking.count.mockResolvedValue(0);
    prisma.$transaction.mockRejectedValue(new Error('database unavailable'));

    await expect(
      bookingsService.create(
        {
          serviceId: 'svc-medicine',
          appointmentType: AppointmentType.SCHEDULED,
          patientName: 'Asha Patil',
          patientPhone: '9876543210',
          patientAddress: 'Flat 1, Pune Maharashtra',
          patientPinCode: '411045',
          slotId: 'slot-1',
        },
        {
          originalname: 'patient-upload.pdf',
          mimetype: 'application/pdf',
          size: 8,
          buffer: Buffer.from('%PDF-1.7'),
        },
      ),
    ).rejects.toThrow(
      'Booking could not be completed; your prescription was not attached. Please retry.',
    );

    expect(uploadsService.deleteFile).toHaveBeenCalledWith(
      'prescriptions/2026/11/test-prescription.pdf',
    );
  });

  it('rejects a scheduled booking for a time that has already passed today', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-11-18T05:30:00.000Z'));
    prisma.service.findFirst.mockResolvedValue({
      id: 'svc-doctor',
      slug: 'doctor-home-consultation',
      basePrice: 1500,
      isActive: true,
      serviceItems: [],
    });
    prisma.patient.upsert.mockResolvedValue({ id: 'patient-1' });
    prisma.slot.findUnique.mockResolvedValue({
      id: 'slot-1',
      isAvailable: true,
      date: new Date('2026-11-18T00:00:00.000Z'),
      startTime: '10:00',
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
        slotId: 'slot-1',
      }),
    ).rejects.toMatchObject({
      response: { code: 'SLOT_UNAVAILABLE' },
    });

    expect(prisma.booking.create).not.toHaveBeenCalled();
  });
});
