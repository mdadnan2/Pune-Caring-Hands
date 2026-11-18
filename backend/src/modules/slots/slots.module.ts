import { Module } from '@nestjs/common';
import { SlotsController } from './slots.controller';
import { SlotsService } from './slots.service';
import { AdminSlotsController } from './admin-slots.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [SlotsController, AdminSlotsController],
  providers: [SlotsService],
  exports: [SlotsService],
})
export class SlotsModule {}
