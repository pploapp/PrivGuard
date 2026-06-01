import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { ConsentModule } from './consent/consent.module';
import { DsrModule } from './dsr/dsr.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [DatabaseModule, ConsentModule, DsrModule, HealthModule],
})
export class AppModule {}
