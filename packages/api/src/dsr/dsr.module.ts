import { Module } from '@nestjs/common';
import { DsrController } from './dsr.controller';
import { DsrService } from './dsr.service';

@Module({
  controllers: [DsrController],
  providers: [DsrService],
})
export class DsrModule {}
