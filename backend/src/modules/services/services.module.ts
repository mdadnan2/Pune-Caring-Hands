import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AdminServicesController, ServicesController } from './services.controller';
import { ServicesService } from './services.service';

@Module({
  imports: [AuthModule],
  controllers: [ServicesController, AdminServicesController],
  providers: [ServicesService],
  exports: [ServicesService],
})
export class ServicesModule {}
