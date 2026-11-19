import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PatientQueryDto } from './dto/patient-query.dto';

@Injectable()
export class PatientsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(filters: PatientQueryDto) {
    const search = filters.search?.trim();
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 20;
    const where: Prisma.PatientWhereInput = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      this.prisma.patient.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          address: true,
          dateOfBirth: true,
          createdAt: true,
          _count: { select: { bookings: true } },
          bookings: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            select: {
              createdAt: true,
              serviceDetails: true,
            },
          },
        },
      }),
      this.prisma.patient.count({ where }),
    ]);

    return {
      items: items.map((patient) => {
        const details =
          patient.bookings[0]?.serviceDetails &&
          typeof patient.bookings[0].serviceDetails === 'object'
            ? (patient.bookings[0].serviceDetails as Record<string, unknown>)
            : {};
        return {
          id: patient.id,
          name: patient.name,
          phone: patient.phone,
          alternatePhone:
            typeof details.alternatePhone === 'string' ? details.alternatePhone : null,
          email: patient.email,
          address: patient.address,
          pinCode: typeof details.pinCode === 'string' ? details.pinCode : null,
          mapsLink: typeof details.mapsLink === 'string' ? details.mapsLink : null,
          dateOfBirth: patient.dateOfBirth,
          gender:
            typeof details.gender === 'string' &&
            ['MALE', 'FEMALE', 'OTHER'].includes(details.gender)
              ? (details.gender as 'MALE' | 'FEMALE' | 'OTHER')
              : null,
          createdAt: patient.createdAt,
          bookingCount: patient._count.bookings,
          lastBookingAt: patient.bookings[0]?.createdAt ?? null,
        };
      }),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getById(patientId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        address: true,
        dateOfBirth: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { bookings: true } },
      },
    });
    if (!patient) {
      throw new NotFoundException({ message: 'Patient not found', code: 'PATIENT_NOT_FOUND' });
    }
    const latest = await this.prisma.booking.findFirst({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
      select: { serviceDetails: true },
    });
    const details =
      latest?.serviceDetails && typeof latest.serviceDetails === 'object'
        ? (latest.serviceDetails as Record<string, unknown>)
        : {};
    return {
      id: patient.id,
      name: patient.name,
      phone: patient.phone,
      alternatePhone: typeof details.alternatePhone === 'string' ? details.alternatePhone : null,
      email: patient.email,
      address: patient.address,
      pinCode: typeof details.pinCode === 'string' ? details.pinCode : null,
      mapsLink: typeof details.mapsLink === 'string' ? details.mapsLink : null,
      dateOfBirth: patient.dateOfBirth,
      gender:
        typeof details.gender === 'string' && ['MALE', 'FEMALE', 'OTHER'].includes(details.gender)
          ? (details.gender as 'MALE' | 'FEMALE' | 'OTHER')
          : null,
      createdAt: patient.createdAt,
      updatedAt: patient.updatedAt,
      bookingCount: patient._count.bookings,
    };
  }

  async getBookingHistory(patientId: string, filters: PatientQueryDto) {
    const patientExists = await this.prisma.patient.findUnique({
      where: { id: patientId },
      select: { id: true },
    });
    if (!patientExists) {
      throw new NotFoundException({ message: 'Patient not found', code: 'PATIENT_NOT_FOUND' });
    }

    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 20;
    const [items, total] = await Promise.all([
      this.prisma.booking.findMany({
        where: { patientId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          bookingRef: true,
          status: true,
          appointmentType: true,
          totalAmount: true,
          createdAt: true,
          service: { select: { name: true, slug: true } },
          slot: { select: { date: true, startTime: true, endTime: true } },
        },
      }),
      this.prisma.booking.count({ where: { patientId } }),
    ]);

    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }
}
