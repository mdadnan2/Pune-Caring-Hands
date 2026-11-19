import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PatientQueryDto } from './dto/patient-query.dto';
import { PatientsController } from './patients.controller';

describe('PatientsController', () => {
  it('uses the shared admin JWT guard', () => {
    expect(Reflect.getMetadata('__guards__', PatientsController)).toContain(JwtAuthGuard);
  });

  it('delegates list, detail, and history requests to the service', async () => {
    const patientsService = {
      list: jest.fn().mockResolvedValue({ items: [] }),
      getById: jest.fn().mockResolvedValue({ id: 'patient-1' }),
      getBookingHistory: jest.fn().mockResolvedValue({ items: [] }),
    };
    const controller = new PatientsController(patientsService as never);
    const query = Object.assign(new PatientQueryDto(), { page: 1, pageSize: 20 });

    await expect(controller.list(query)).resolves.toEqual({ items: [] });
    await expect(controller.get('patient-1')).resolves.toEqual({ id: 'patient-1' });
    await expect(controller.bookings('patient-1', query)).resolves.toEqual({ items: [] });
  });
});
