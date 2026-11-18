import { Module } from '@nestjs/common';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { ServiceAreasModule } from '../service-areas/service-areas.module';
import { UploadsModule } from '../uploads/uploads.module';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { AdminBookingsController } from './admin-bookings.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, ServiceAreasModule, UploadsModule, AuthModule],
  controllers: [BookingsController, AdminBookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
