import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  HttpException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ServiceAreasService } from '../service-areas/service-areas.service';
import { AppointmentType, BookingStatus, PaymentStatus } from '@pch/shared';
import { CreateBookingDto } from './dto/create-booking.dto';
import { AdminBookingQueryDto } from './dto/admin-booking-query.dto';
import { UploadsService, type UploadedFile, type StoredUpload } from '../uploads/uploads.service';
import { isFutureSlot } from '../slots/slot-time.util';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly serviceAreasService: ServiceAreasService,
    private readonly uploadsService: UploadsService,
  ) {}

  async create(dto: CreateBookingDto, prescriptionFile?: UploadedFile) {
    const service = await this.prisma.service.findFirst({
      where: { id: dto.serviceId, isActive: true },
      include: { serviceItems: { where: { isActive: true } } },
    });

    if (!service) {
      throw new NotFoundException({ message: 'Service not found', code: 'SERVICE_NOT_FOUND' });
    }

    const pinSupported = await this.serviceAreasService.validatePinForService(
      dto.patientPinCode,
      dto.serviceId,
    );
    if (!pinSupported) {
      throw new BadRequestException({
        message: 'Sorry, this service is currently unavailable in your area.',
        code: 'AREA_NOT_SUPPORTED',
      });
    }

    if (dto.appointmentType === AppointmentType.SCHEDULED && !dto.slotId) {
      throw new BadRequestException({
        message: 'A time slot is required for scheduled appointments',
        code: 'VALIDATION_ERROR',
      });
    }

    if (
      service.slug === 'blood-test-at-home' &&
      (!dto.serviceItemIds || dto.serviceItemIds.length === 0)
    ) {
      throw new BadRequestException({
        message: 'Select at least one blood test.',
        code: 'VALIDATION_ERROR',
      });
    }

    if (
      service.slug === 'xray-at-home' &&
      (!dto.serviceItemIds || dto.serviceItemIds.length !== 1)
    ) {
      throw new BadRequestException({
        message: 'Select one X-Ray type.',
        code: 'VALIDATION_ERROR',
      });
    }

    const isMedicineDelivery = service.slug === 'medicine-home-delivery';
    if (isMedicineDelivery && !prescriptionFile) {
      throw new BadRequestException({
        message: 'A prescription upload is required for medicine delivery.',
        code: 'VALIDATION_ERROR',
      });
    }
    if (prescriptionFile && !isMedicineDelivery) {
      throw new BadRequestException({
        message: 'Prescription uploads are only accepted for medicine delivery.',
        code: 'VALIDATION_ERROR',
      });
    }
    if (prescriptionFile) {
      this.uploadsService.validateFile(prescriptionFile);
    }

    let totalAmount = 0;
    let validatedItemIds: string[] = [];

    if (service.basePrice !== null) {
      totalAmount = service.basePrice;
    } else if (dto.serviceItemIds && dto.serviceItemIds.length > 0) {
      const selectedItems = service.serviceItems.filter((item: { id: string; price: number }) =>
        dto.serviceItemIds!.includes(item.id),
      );
      if (selectedItems.length !== dto.serviceItemIds.length) {
        throw new BadRequestException({
          message: 'One or more selected service items are invalid',
          code: 'INVALID_SERVICE_ITEM',
        });
      }
      totalAmount = selectedItems.reduce(
        (sum: number, item: { price: number }) => sum + item.price,
        0,
      );
      validatedItemIds = selectedItems.map((item: { id: string }) => item.id);
    } else if (isMedicineDelivery) {
      totalAmount = 0;
    } else {
      throw new BadRequestException({
        message: 'Service items are required for this service',
        code: 'VALIDATION_ERROR',
      });
    }

    let ageAtBooking: number | undefined;
    if (dto.patientDateOfBirth) {
      const dob = new Date(dto.patientDateOfBirth);
      const today = new Date();
      ageAtBooking = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        ageAtBooking--;
      }
    }

    const bookingRef = await this.generateBookingRef();
    const prescriptionFileKey = prescriptionFile
      ? await this.uploadsService.saveFile(
          prescriptionFile,
          'prescriptions',
          bookingRef,
          'prescription',
        )
      : undefined;

    try {
      const booking = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const patient = await tx.patient.upsert({
          where: { phone: dto.patientPhone },
          update: {
            name: dto.patientName,
            address: dto.patientAddress,
            ...(dto.patientEmail && { email: dto.patientEmail }),
            ...(dto.patientDateOfBirth && { dateOfBirth: new Date(dto.patientDateOfBirth) }),
          },
          create: {
            name: dto.patientName,
            phone: dto.patientPhone,
            address: dto.patientAddress,
            ...(dto.patientEmail && { email: dto.patientEmail }),
            ...(dto.patientDateOfBirth && { dateOfBirth: new Date(dto.patientDateOfBirth) }),
          },
        });

        if (dto.slotId) {
          const slot = await tx.slot.findUnique({ where: { id: dto.slotId } });
          if (!slot || !slot.isAvailable || !isFutureSlot(slot.date, slot.startTime)) {
            throw new ConflictException({
              message: 'The selected time slot is no longer available. Please choose another slot.',
              code: 'SLOT_UNAVAILABLE',
            });
          }

          const reserved = await tx.slot.updateMany({
            where: { id: dto.slotId, isAvailable: true, booking: { is: null } },
            data: { isAvailable: false },
          });
          if (reserved.count !== 1) {
            throw new ConflictException({
              message: 'The selected time slot is no longer available. Please choose another slot.',
              code: 'SLOT_UNAVAILABLE',
            });
          }
        }

        const serviceDetails = toPrismaJsonObject(dto.serviceDetails ?? {});
        if (dto.patientAlternatePhone) {
          serviceDetails.alternatePhone = dto.patientAlternatePhone;
        }
        if (dto.patientMapsLink) {
          serviceDetails.mapsLink = dto.patientMapsLink;
        }
        if (dto.patientPinCode) {
          serviceDetails.pinCode = dto.patientPinCode;
        }
        if (dto.gender) {
          serviceDetails.gender = dto.gender;
        }
        if (prescriptionFileKey) {
          serviceDetails.prescriptionFileKey = prescriptionFileKey;
        }

        const newBooking = await tx.booking.create({
          data: {
            bookingRef,
            patientId: patient.id,
            serviceId: dto.serviceId,
            slotId: dto.slotId ?? null,
            appointmentType: dto.appointmentType,
            status: BookingStatus.PAYMENT_PENDING,
            totalAmount,
            notes: dto.notes ?? null,
            serviceDetails,
            ageAtBooking: ageAtBooking ?? null,
            bookingItems: {
              create: validatedItemIds.map((itemId) => {
                const item = service.serviceItems.find(
                  (serviceItem: { id: string; name: string; price: number }) =>
                    serviceItem.id === itemId,
                );
                if (!item) {
                  throw new BadRequestException({
                    message: 'One or more selected service items are invalid',
                    code: 'INVALID_SERVICE_ITEM',
                  });
                }

                return { serviceItemId: itemId, name: item.name, price: item.price };
              }),
            },
            payment: {
              create: {
                amount: totalAmount,
                status: PaymentStatus.PENDING,
              },
            },
          },
          include: {
            service: { select: { name: true, slug: true } },
            slot: { select: { date: true, startTime: true, endTime: true } },
            bookingItems: true,
            payment: { select: { id: true, amount: true, status: true, rejectionReason: true } },
          },
        });

        return {
          bookingRef: newBooking.bookingRef,
          status: newBooking.status,
          appointmentType: newBooking.appointmentType,
          totalAmount: newBooking.totalAmount,
          service: newBooking.service,
          slot: newBooking.slot,
          bookingItems: newBooking.bookingItems,
          payment: newBooking.payment,
          createdAt: newBooking.createdAt,
        };
      });

      return booking;
    } catch (error) {
      if (prescriptionFileKey) {
        try {
          await this.uploadsService.deleteFile(prescriptionFileKey);
        } catch (cleanupError) {
          this.logger.error(
            `Booking creation failed and prescription cleanup failed for ${bookingRef}: ${
              cleanupError instanceof Error ? cleanupError.message : String(cleanupError)
            }`,
          );
        }
      }
      if (isSlotBookingUniqueConstraintError(error)) {
        throw slotUnavailableError(
          'The selected time slot is no longer available. Please choose another slot.',
        );
      }
      if (prescriptionFileKey && !(error instanceof HttpException)) {
        throw new InternalServerErrorException({
          message:
            'Booking could not be completed; your prescription was not attached. Please retry.',
          code: 'BOOKING_CREATION_FAILED',
        });
      }
      throw error;
    }
  }

  async findByRef(bookingRef: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { bookingRef },
      include: {
        service: { select: { name: true, slug: true } },
        slot: { select: { date: true, startTime: true, endTime: true } },
        bookingItems: true,
        payment: { select: { id: true, amount: true, status: true } },
      },
    });

    if (!booking) {
      throw new NotFoundException({ message: 'Booking not found', code: 'BOOKING_NOT_FOUND' });
    }

    return {
      bookingRef: booking.bookingRef,
      status: booking.status,
      appointmentType: booking.appointmentType,
      totalAmount: booking.totalAmount,
      service: booking.service,
      slot: booking.slot,
      bookingItems: booking.bookingItems,
      payment: booking.payment,
      createdAt: booking.createdAt,
    };
  }

  async listAdmin(filters: AdminBookingQueryDto) {
    const date = filters.date ? new Date(`${filters.date}T00:00:00.000Z`) : undefined;
    const nextDate = date ? new Date(date.getTime() + 24 * 60 * 60 * 1000) : undefined;
    const search = filters.search?.trim();
    const where: Prisma.BookingWhereInput = {
      ...(filters.status && { status: filters.status }),
      ...(filters.appointmentType && { appointmentType: filters.appointmentType }),
      ...(filters.serviceId && { serviceId: filters.serviceId }),
      ...(date &&
        nextDate && {
          slot: { date: { gte: date, lt: nextDate } },
        }),
      ...(search && {
        OR: [
          { bookingRef: { contains: search, mode: 'insensitive' } },
          { patient: { name: { contains: search, mode: 'insensitive' } } },
          { patient: { phone: { contains: search } } },
        ],
      }),
    };
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 20;

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const [items, total] = await Promise.all([
        tx.booking.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          select: {
            bookingRef: true,
            status: true,
            totalAmount: true,
            createdAt: true,
            patient: { select: { name: true, phone: true } },
            service: { select: { name: true, slug: true } },
            slot: { select: { date: true, startTime: true, endTime: true } },
            payment: { select: { status: true } },
          },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        tx.booking.count({ where }),
      ]);

      return {
        items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    });
  }

  async getAdminByRef(bookingRef: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { bookingRef },
      include: {
        patient: {
          select: { name: true, phone: true, email: true, address: true, dateOfBirth: true },
        },
        service: { select: { name: true, slug: true } },
        slot: { select: { date: true, startTime: true, endTime: true } },
        bookingItems: { select: { id: true, name: true, price: true } },
        payment: {
          select: {
            id: true,
            amount: true,
            status: true,
            proofFileKey: true,
            submittedAt: true,
            verifiedAt: true,
            rejectedAt: true,
            rejectionReason: true,
          },
        },
      },
    });
    if (!booking) {
      throw new NotFoundException({ message: 'Booking not found', code: 'BOOKING_NOT_FOUND' });
    }

    const details =
      booking.serviceDetails && typeof booking.serviceDetails === 'object'
        ? (booking.serviceDetails as Record<string, unknown>)
        : {};
    const { prescriptionFileKey, ...publicDetails } = details;
    return {
      bookingRef: booking.bookingRef,
      status: booking.status,
      appointmentType: booking.appointmentType,
      totalAmount: booking.totalAmount,
      notes: booking.notes,
      createdAt: booking.createdAt,
      patient: booking.patient,
      service: booking.service,
      slot: booking.slot,
      bookingItems: booking.bookingItems,
      serviceDetails: publicDetails,
      payment: booking.payment
        ? {
            ...booking.payment,
            proofAvailable: Boolean(booking.payment.proofFileKey),
            proofFileKey: undefined,
          }
        : null,
      prescriptionAvailable: typeof prescriptionFileKey === 'string',
    };
  }

  async cancelAdmin(bookingRef: string, adminId: string) {
    let releasedSlotId: string | null = null;
    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const booking = await tx.booking.findUnique({
        where: { bookingRef },
        select: { id: true, status: true, slotId: true },
      });
      if (!booking) throw bookingNotFoundError();
      if (booking.status !== BookingStatus.CONFIRMED) throw invalidBookingStatusError();

      const cancelled = await tx.booking.updateMany({
        where: {
          id: booking.id,
          status: BookingStatus.CONFIRMED,
          slotId: booking.slotId,
        },
        data: { status: BookingStatus.CANCELLED, slotId: null },
      });
      if (cancelled.count !== 1) throw invalidBookingStatusError();

      if (booking.slotId) {
        const released = await tx.slot.updateMany({
          where: { id: booking.slotId, booking: { is: null } },
          data: { isAvailable: true },
        });
        if (released.count !== 1) throw slotNotFoundError();
        releasedSlotId = booking.slotId;
      }
    });

    this.logger.log(
      `Booking status changed: ${bookingRef} CONFIRMED -> CANCELLED by admin ${adminId}${
        releasedSlotId ? `; released slot ${releasedSlotId}` : ''
      }`,
    );
    return this.getAdminByRef(bookingRef);
  }

  async rescheduleAdmin(bookingRef: string, newSlotId: string, adminId: string) {
    let previousSlotId: string | null = null;
    try {
      await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const booking = await tx.booking.findUnique({
          where: { bookingRef },
          select: { id: true, status: true, slotId: true },
        });
        if (!booking) throw bookingNotFoundError();
        if (booking.status !== BookingStatus.CONFIRMED) throw invalidBookingStatusError();
        previousSlotId = booking.slotId;
        if (booking.slotId === newSlotId) {
          throw slotUnavailableError('Choose a different slot from the current appointment.');
        }

        const newSlot = await tx.slot.findUnique({
          where: { id: newSlotId },
          select: {
            id: true,
            date: true,
            startTime: true,
            isAvailable: true,
            booking: { select: { id: true } },
          },
        });
        if (!newSlot) throw slotNotFoundError();
        if (!isFutureSlot(newSlot.date, newSlot.startTime)) {
          throw new BadRequestException({
            message: 'The selected slot is in the past.',
            code: 'SLOT_IN_PAST',
          });
        }
        if (!newSlot.isAvailable || newSlot.booking) throw slotUnavailableError();

        const reserved = await tx.slot.updateMany({
          where: { id: newSlot.id, isAvailable: true, booking: { is: null } },
          data: { isAvailable: false },
        });
        if (reserved.count !== 1) throw slotUnavailableError();

        const reassigned = await tx.booking.updateMany({
          where: {
            id: booking.id,
            status: BookingStatus.CONFIRMED,
            slotId: booking.slotId,
          },
          data: {
            slotId: newSlot.id,
            appointmentType: AppointmentType.SCHEDULED,
            status: BookingStatus.RESCHEDULED,
          },
        });
        if (reassigned.count !== 1) throw invalidBookingStatusError();

        if (booking.slotId) {
          const released = await tx.slot.updateMany({
            where: { id: booking.slotId, booking: { is: null } },
            data: { isAvailable: true },
          });
          if (released.count !== 1) throw slotNotFoundError();
        }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw slotUnavailableError();
      }
      throw error;
    }

    this.logger.log(
      `Booking status changed: ${bookingRef} CONFIRMED -> RESCHEDULED by admin ${adminId}; slot ${
        previousSlotId ?? 'none'
      } -> ${newSlotId}`,
    );
    return this.getAdminByRef(bookingRef);
  }

  async completeAdmin(bookingRef: string, adminId: string) {
    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const booking = await tx.booking.findUnique({
        where: { bookingRef },
        select: { id: true, status: true },
      });
      if (!booking) throw bookingNotFoundError();
      if (booking.status !== BookingStatus.CONFIRMED) throw invalidBookingStatusError();

      const completed = await tx.booking.updateMany({
        where: { id: booking.id, status: BookingStatus.CONFIRMED },
        data: { status: BookingStatus.COMPLETED },
      });
      if (completed.count !== 1) throw invalidBookingStatusError();
    });

    this.logger.log(
      `Booking status changed: ${bookingRef} CONFIRMED -> COMPLETED by admin ${adminId}`,
    );
    return this.getAdminByRef(bookingRef);
  }

  async getAdminFile(bookingRef: string, kind: 'proof' | 'prescription'): Promise<StoredUpload> {
    const booking = await this.prisma.booking.findUnique({
      where: { bookingRef },
      select: {
        payment: { select: { proofFileKey: true } },
        serviceDetails: true,
      },
    });
    if (!booking) {
      throw new NotFoundException({ message: 'Booking not found', code: 'BOOKING_NOT_FOUND' });
    }
    const details =
      booking.serviceDetails && typeof booking.serviceDetails === 'object'
        ? (booking.serviceDetails as Record<string, unknown>)
        : {};
    const key =
      kind === 'proof'
        ? booking.payment?.proofFileKey
        : typeof details.prescriptionFileKey === 'string'
          ? details.prescriptionFileKey
          : null;
    if (!key) {
      throw new NotFoundException({ message: 'File not found', code: 'FILE_NOT_FOUND' });
    }
    return this.uploadsService.readFile(key);
  }

  private async generateBookingRef(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const count = await this.prisma.booking.count({
      where: { createdAt: { gte: new Date(today.setHours(0, 0, 0, 0)) } },
    });
    const seq = String(count + 1).padStart(4, '0');
    return `PCH-${dateStr}-${seq}`;
  }
}

function toPrismaJsonObject(
  value: Record<string, unknown>,
): Record<string, Prisma.InputJsonValue | null> {
  const result: Record<string, Prisma.InputJsonValue | null> = {};
  for (const [key, entry] of Object.entries(value)) {
    const jsonValue = toPrismaJsonValue(entry);
    if (jsonValue !== undefined) result[key] = jsonValue;
  }
  return result;
}

function toPrismaJsonValue(value: unknown): Prisma.InputJsonValue | null | undefined {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (Array.isArray(value)) {
    const result: (Prisma.InputJsonValue | null)[] = [];
    for (const entry of value) {
      result.push(toPrismaJsonValue(entry) ?? null);
    }
    return result;
  }
  if (typeof value === 'object') {
    return toPrismaJsonObject(value as Record<string, unknown>);
  }
  return undefined;
}

function bookingNotFoundError(): NotFoundException {
  return new NotFoundException({ message: 'Booking not found', code: 'BOOKING_NOT_FOUND' });
}

function invalidBookingStatusError(): ConflictException {
  return new ConflictException({
    message: "This operation is not allowed for the booking's current status.",
    code: 'INVALID_BOOKING_STATUS',
  });
}

function slotNotFoundError(): NotFoundException {
  return new NotFoundException({ message: 'Slot not found.', code: 'SLOT_NOT_FOUND' });
}

function slotUnavailableError(
  message = 'The selected time slot is no longer available.',
): ConflictException {
  return new ConflictException({ message, code: 'SLOT_UNAVAILABLE' });
}

function isSlotBookingUniqueConstraintError(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
    return false;
  }

  const target = error.meta?.target;
  return Array.isArray(target)
    ? target.some((field) => typeof field === 'string' && field.toLowerCase() === 'slotid')
    : typeof target === 'string' && target.toLowerCase().includes('slotid');
}
