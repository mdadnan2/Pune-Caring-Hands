import 'reflect-metadata';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PatientQueryDto } from './dto/patient-query.dto';
import { PatientsService } from './patients.service';

describe('PatientsService', () => {
  it('searches by name or phone and returns pagination metadata', async () => {
    const prisma = {
      patient: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'patient-1',
            name: 'Asha Patil',
            phone: '9876543210',
            email: null,
            address: 'Pune',
            dateOfBirth: null,
            createdAt: new Date(),
            _count: { bookings: 3 },
            bookings: [{ createdAt: new Date(), serviceDetails: { pinCode: '411045' } }],
          },
        ]),
        count: jest.fn().mockResolvedValue(21),
        findUnique: jest.fn(),
      },
      booking: { findMany: jest.fn(), count: jest.fn() },
    };

    const service = new PatientsService(prisma as unknown as PrismaService);
    const result = await service.list(
      Object.assign(new PatientQueryDto(), { search: 'Asha', page: 2, pageSize: 10 }),
    );

    expect(prisma.patient.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { name: { contains: 'Asha', mode: 'insensitive' } },
            { phone: { contains: 'Asha' } },
          ],
        },
        skip: 10,
        take: 10,
      }),
    );
    expect(result).toMatchObject({ total: 21, page: 2, pageSize: 10, totalPages: 3 });
  });

  it('returns patient details and paginated booking history', async () => {
    const prisma = {
      patient: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'patient-1',
          name: 'Asha Patil',
          phone: '9876543210',
          email: null,
          address: 'Pune',
          dateOfBirth: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: { bookings: 2 },
        }),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      booking: {
        findFirst: jest
          .fn()
          .mockResolvedValue({ serviceDetails: { pinCode: '411045', gender: 'FEMALE' } }),
        findMany: jest.fn().mockResolvedValue([{ bookingRef: 'PCH-1' }]),
        count: jest.fn().mockResolvedValue(2),
      },
    };

    const service = new PatientsService(prisma as unknown as PrismaService);
    const detail = await service.getById('patient-1');
    const history = await service.getBookingHistory(
      'patient-1',
      Object.assign(new PatientQueryDto(), { page: 1, pageSize: 20 }),
    );

    expect(detail).toMatchObject({ bookingCount: 2, pinCode: '411045', gender: 'FEMALE' });
    expect(history).toMatchObject({ total: 2, page: 1, pageSize: 20, totalPages: 1 });
  });

  it('rejects unknown patients', async () => {
    const prisma = {
      patient: { findUnique: jest.fn().mockResolvedValue(null) },
      booking: { findFirst: jest.fn(), findMany: jest.fn(), count: jest.fn() },
    };
    const service = new PatientsService(prisma as unknown as PrismaService);

    await expect(service.getById('missing')).rejects.toMatchObject({
      response: { code: 'PATIENT_NOT_FOUND' },
    });
  });
});
