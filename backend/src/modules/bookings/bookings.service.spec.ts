import { AppointmentType, BookingStatus, PaymentStatus } from '@pch/shared';
import { BookingsService } from './bookings.service';
import { ServiceAreasService } from '../service-areas/service-areas.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';
import { InternalServerErrorException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

type MockPrismaBooking = {
  service: { findFirst: jest.Mock };
  patient: { upsert: jest.Mock };
  slot: { findUnique: jest.Mock; update: jest.Mock; updateMany: jest.Mock };
  booking: {
    count: jest.Mock;
    findUnique: jest.Mock;
    create: jest.Mock;
    updateMany: jest.Mock;
  };
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
        updateMany: jest.fn(),
      },
      booking: {
        count: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        updateMany: jest.fn(),
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
      status: BookingStatus.PAYMENT_PENDING,
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
      status: BookingStatus.PAYMENT_PENDING,
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
      status: BookingStatus.PAYMENT_PENDING,
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
      status: BookingStatus.PAYMENT_PENDING,
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

  it('cancels a confirmed scheduled booking and releases its slot atomically', async () => {
    prisma.booking.findUnique
      .mockResolvedValueOnce({
        id: 'booking-1',
        status: BookingStatus.CONFIRMED,
        slotId: 'old-slot',
      })
      .mockResolvedValueOnce(adminBookingRecord(BookingStatus.CANCELLED, null));
    prisma.booking.updateMany.mockResolvedValue({ count: 1 });
    prisma.slot.updateMany.mockResolvedValue({ count: 1 });

    await expect(bookingsService.cancelAdmin('PCH-REF', 'admin-1')).resolves.toMatchObject({
      bookingRef: 'PCH-REF',
      status: BookingStatus.CANCELLED,
      slot: null,
    });

    expect(prisma.booking.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'booking-1',
        status: BookingStatus.CONFIRMED,
        slotId: 'old-slot',
      },
      data: { status: BookingStatus.CANCELLED, slotId: null },
    });
    expect(prisma.slot.updateMany).toHaveBeenCalledWith({
      where: { id: 'old-slot', booking: { is: null } },
      data: { isAvailable: true },
    });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('cancels a confirmed immediate booking without changing slots', async () => {
    prisma.booking.findUnique
      .mockResolvedValueOnce({
        id: 'booking-1',
        status: BookingStatus.CONFIRMED,
        slotId: null,
      })
      .mockResolvedValueOnce(adminBookingRecord(BookingStatus.CANCELLED, null));
    prisma.booking.updateMany.mockResolvedValue({ count: 1 });

    await expect(bookingsService.cancelAdmin('PCH-REF', 'admin-1')).resolves.toMatchObject({
      status: BookingStatus.CANCELLED,
      slot: null,
    });
    expect(prisma.slot.updateMany).not.toHaveBeenCalled();
  });

  it('rejects cancellation and completion from non-confirmed statuses', async () => {
    prisma.booking.findUnique
      .mockResolvedValueOnce({
        id: 'booking-1',
        status: BookingStatus.PAYMENT_PENDING,
        slotId: 'slot-1',
      })
      .mockResolvedValueOnce({
        id: 'booking-2',
        status: BookingStatus.CANCELLED,
      });

    await expect(bookingsService.cancelAdmin('PCH-REF', 'admin-1')).rejects.toMatchObject({
      response: { code: 'INVALID_BOOKING_STATUS' },
    });
    await expect(bookingsService.completeAdmin('PCH-OTHER', 'admin-1')).rejects.toMatchObject({
      response: { code: 'INVALID_BOOKING_STATUS' },
    });
    expect(prisma.booking.updateMany).not.toHaveBeenCalled();
    expect(prisma.slot.updateMany).not.toHaveBeenCalled();
  });

  it('rejects operational actions when the booking does not exist', async () => {
    prisma.booking.findUnique.mockResolvedValue(null);

    await expect(bookingsService.cancelAdmin('missing', 'admin-1')).rejects.toMatchObject({
      response: { code: 'BOOKING_NOT_FOUND' },
    });
    await expect(bookingsService.completeAdmin('missing', 'admin-1')).rejects.toMatchObject({
      response: { code: 'BOOKING_NOT_FOUND' },
    });
  });

  it('completes confirmed bookings without altering their slots', async () => {
    prisma.booking.findUnique
      .mockResolvedValueOnce({
        id: 'booking-1',
        status: BookingStatus.CONFIRMED,
      })
      .mockResolvedValueOnce(adminBookingRecord(BookingStatus.COMPLETED, 'slot-1'));
    prisma.booking.updateMany.mockResolvedValue({ count: 1 });

    await expect(bookingsService.completeAdmin('PCH-REF', 'admin-1')).resolves.toMatchObject({
      status: BookingStatus.COMPLETED,
    });
    expect(prisma.booking.updateMany).toHaveBeenCalledWith({
      where: { id: 'booking-1', status: BookingStatus.CONFIRMED },
      data: { status: BookingStatus.COMPLETED },
    });
    expect(prisma.slot.updateMany).not.toHaveBeenCalled();
  });

  it('reschedules a confirmed booking and atomically releases and reserves global slots', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-11-18T08:15:00.000Z'));
    prisma.booking.findUnique
      .mockResolvedValueOnce({
        id: 'booking-1',
        status: BookingStatus.CONFIRMED,
        slotId: 'old-slot',
      })
      .mockResolvedValueOnce(
        adminBookingRecord(BookingStatus.RESCHEDULED, 'new-slot', {
          date: new Date('2026-11-20T00:00:00.000Z'),
          startTime: '11:00',
          endTime: '12:00',
        }),
      );
    prisma.slot.findUnique.mockResolvedValue({
      id: 'new-slot',
      date: new Date('2026-11-20T00:00:00.000Z'),
      startTime: '11:00',
      isAvailable: true,
      booking: null,
    });
    prisma.slot.updateMany.mockResolvedValue({ count: 1 });
    prisma.booking.updateMany.mockResolvedValue({ count: 1 });

    await expect(bookingsService.rescheduleAdmin('PCH-REF', 'new-slot', 'admin-1')).resolves.toMatchObject({
      status: BookingStatus.RESCHEDULED,
      slot: { startTime: '11:00' },
    });

    expect(prisma.slot.updateMany).toHaveBeenNthCalledWith(1, {
      where: { id: 'new-slot', isAvailable: true, booking: { is: null } },
      data: { isAvailable: false },
    });
    expect(prisma.booking.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'booking-1',
        status: BookingStatus.CONFIRMED,
        slotId: 'old-slot',
      },
      data: { slotId: 'new-slot', status: BookingStatus.RESCHEDULED },
    });
    expect(prisma.slot.updateMany).toHaveBeenNthCalledWith(2, {
      where: { id: 'old-slot', booking: { is: null } },
      data: { isAvailable: true },
    });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('rejects rescheduling when the booking is missing or not confirmed', async () => {
    prisma.booking.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'booking-1',
        status: BookingStatus.PAYMENT_VERIFICATION,
        slotId: 'old-slot',
      });

    await expect(bookingsService.rescheduleAdmin('missing', 'new-slot', 'admin-1')).rejects.toMatchObject({
      response: { code: 'BOOKING_NOT_FOUND' },
    });
    await expect(bookingsService.rescheduleAdmin('PCH-REF', 'new-slot', 'admin-1')).rejects.toMatchObject({
      response: { code: 'INVALID_BOOKING_STATUS' },
    });
    expect(prisma.slot.findUnique).not.toHaveBeenCalled();
  });

  it('rejects missing, current, booked, unavailable, and past reschedule slots', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-11-18T08:15:00.000Z'));
    const confirmedBooking = {
      id: 'booking-1',
      status: BookingStatus.CONFIRMED,
      slotId: 'old-slot',
    };
    prisma.booking.findUnique
      .mockResolvedValueOnce(confirmedBooking)
      .mockResolvedValueOnce(confirmedBooking)
      .mockResolvedValueOnce(confirmedBooking)
      .mockResolvedValueOnce(confirmedBooking)
      .mockResolvedValueOnce(confirmedBooking);
    prisma.slot.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'occupied-slot',
        date: new Date('2026-11-20T00:00:00.000Z'),
        startTime: '11:00',
        isAvailable: true,
        booking: { id: 'other-booking' },
      })
      .mockResolvedValueOnce({
        id: 'disabled-slot',
        date: new Date('2026-11-20T00:00:00.000Z'),
        startTime: '11:00',
        isAvailable: false,
        booking: null,
      })
      .mockResolvedValueOnce({
        id: 'past-slot',
        date: new Date('2026-11-18T00:00:00.000Z'),
        startTime: '11:00',
        isAvailable: true,
        booking: null,
      });

    await expect(bookingsService.rescheduleAdmin('PCH-REF', 'missing-slot', 'admin-1')).rejects.toMatchObject({
      response: { code: 'SLOT_NOT_FOUND' },
    });
    await expect(bookingsService.rescheduleAdmin('PCH-REF', 'old-slot', 'admin-1')).rejects.toMatchObject({
      response: { code: 'SLOT_UNAVAILABLE' },
    });
    await expect(bookingsService.rescheduleAdmin('PCH-REF', 'occupied-slot', 'admin-1')).rejects.toMatchObject({
      response: { code: 'SLOT_UNAVAILABLE' },
    });
    await expect(bookingsService.rescheduleAdmin('PCH-REF', 'disabled-slot', 'admin-1')).rejects.toMatchObject({
      response: { code: 'SLOT_UNAVAILABLE' },
    });
    await expect(bookingsService.rescheduleAdmin('PCH-REF', 'past-slot', 'admin-1')).rejects.toMatchObject({
      response: { code: 'SLOT_IN_PAST' },
    });
    expect(prisma.slot.updateMany).not.toHaveBeenCalled();
    expect(prisma.booking.updateMany).not.toHaveBeenCalled();
  });

  it('returns SLOT_UNAVAILABLE if a reschedule loses a slot reservation race', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-11-18T08:15:00.000Z'));
    prisma.booking.findUnique.mockResolvedValue({
      id: 'booking-1',
      status: BookingStatus.CONFIRMED,
      slotId: 'old-slot',
    });
    prisma.slot.findUnique.mockResolvedValue({
      id: 'new-slot',
      date: new Date('2026-11-20T00:00:00.000Z'),
      startTime: '11:00',
      isAvailable: true,
      booking: null,
    });
    prisma.slot.updateMany.mockResolvedValue({ count: 0 });

    await expect(bookingsService.rescheduleAdmin('PCH-REF', 'new-slot', 'admin-1')).rejects.toMatchObject({
      response: { code: 'SLOT_UNAVAILABLE' },
    });
    expect(prisma.booking.updateMany).not.toHaveBeenCalled();
  });

  it('maps a slot uniqueness race during rescheduling to SLOT_UNAVAILABLE', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-11-18T08:15:00.000Z'));
    prisma.booking.findUnique.mockResolvedValue({
      id: 'booking-1',
      status: BookingStatus.CONFIRMED,
      slotId: 'old-slot',
    });
    prisma.slot.findUnique.mockResolvedValue({
      id: 'new-slot',
      date: new Date('2026-11-20T00:00:00.000Z'),
      startTime: '11:00',
      isAvailable: true,
      booking: null,
    });
    prisma.slot.updateMany.mockResolvedValue({ count: 1 });
    prisma.booking.updateMany.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '5.19.1',
      }),
    );

    await expect(bookingsService.rescheduleAdmin('PCH-REF', 'new-slot', 'admin-1')).rejects.toMatchObject({
      response: { code: 'SLOT_UNAVAILABLE' },
    });
    expect(prisma.slot.updateMany).toHaveBeenCalledTimes(1);
  });

  it('rolls back the booking and both slot states if old-slot release fails', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-11-18T08:15:00.000Z'));
    const bookingState = {
      id: 'booking-1',
      status: BookingStatus.CONFIRMED,
      slotId: 'old-slot' as string | null,
    };
    const oldSlotState = { id: 'old-slot', isAvailable: false };
    const newSlotState = { id: 'new-slot', isAvailable: true };

    prisma.booking.findUnique.mockImplementation(async () => ({ ...bookingState }));
    prisma.slot.findUnique.mockResolvedValue({
      id: 'new-slot',
      date: new Date('2026-11-20T00:00:00.000Z'),
      startTime: '11:00',
      isAvailable: true,
      booking: null,
    });
    prisma.slot.updateMany.mockImplementation(async ({ where, data }) => {
      if (where.id === 'new-slot') {
        Object.assign(newSlotState, data);
        return { count: 1 };
      }
      return { count: 0 };
    });
    prisma.booking.updateMany.mockImplementation(async ({ data }) => {
      Object.assign(bookingState, data);
      return { count: 1 };
    });
    prisma.$transaction.mockImplementation(async (callback) => {
      const bookingSnapshot = { ...bookingState };
      const oldSlotSnapshot = { ...oldSlotState };
      const newSlotSnapshot = { ...newSlotState };
      try {
        return await callback(prisma);
      } catch (error) {
        Object.assign(bookingState, bookingSnapshot);
        Object.assign(oldSlotState, oldSlotSnapshot);
        Object.assign(newSlotState, newSlotSnapshot);
        throw error;
      }
    });

    await expect(bookingsService.rescheduleAdmin('PCH-REF', 'new-slot', 'admin-1')).rejects.toMatchObject({
      response: { code: 'SLOT_NOT_FOUND' },
    });
    expect(bookingState).toEqual({
      id: 'booking-1',
      status: BookingStatus.CONFIRMED,
      slotId: 'old-slot',
    });
    expect(oldSlotState.isAvailable).toBe(false);
    expect(newSlotState.isAvailable).toBe(true);
  });
});

function adminBookingRecord(
  status: BookingStatus,
  slotId: string | null,
  slot?: { date: Date; startTime: string; endTime: string },
) {
  return {
    bookingRef: 'PCH-REF',
    status,
    appointmentType: slotId ? AppointmentType.SCHEDULED : AppointmentType.IMMEDIATE,
    totalAmount: 1500,
    notes: null,
    createdAt: new Date('2026-11-18T00:00:00.000Z'),
    patient: {
      name: 'Test Patient',
      phone: '9876543210',
      email: null,
      address: 'Pune',
      dateOfBirth: null,
    },
    service: { name: 'Doctor Home Consultation', slug: 'doctor-home-consultation' },
    slot: slot ?? (slotId ? { date: new Date('2026-11-20T00:00:00.000Z'), startTime: '11:00', endTime: '12:00' } : null),
    bookingItems: [],
    payment: null,
    serviceDetails: null,
  };
}
