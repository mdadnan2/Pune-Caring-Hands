import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PatientQueryDto } from './dto/patient-query.dto';
import { PatientsService } from './patients.service';

@Controller('admin/patients')
@UseGuards(JwtAuthGuard)
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get()
  list(@Query() query: PatientQueryDto) {
    return this.patientsService.list(query);
  }

  @Get(':patientId')
  get(@Param('patientId') patientId: string) {
    return this.patientsService.getById(patientId);
  }

  @Get(':patientId/bookings')
  bookings(@Param('patientId') patientId: string, @Query() query: PatientQueryDto) {
    return this.patientsService.getBookingHistory(patientId, query);
  }
}
