import 'reflect-metadata';
import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import Database from 'better-sqlite3';
import { HealthController } from '../dist/health/health.controller';
import { ConsentController } from '../dist/consent/consent.controller';
import { ConsentService } from '../dist/consent/consent.service';
import { DsrController } from '../dist/dsr/dsr.controller';
import { DsrService } from '../dist/dsr/dsr.service';
import { DatabaseService } from '../dist/database/database.service';
import { HttpExceptionFilter } from '../dist/common/filters/http-exception.filter';
import { DsrWorkflowService, DsrRequest, DsrStatus } from '@privguard/engine';
import { CreateDsrDto } from '../dist/dsr/dto/create-dsr.dto';
import { NotFoundException, BadRequestException } from '@nestjs/common';

class TestDatabaseService {
  private db: Database.Database | null = null;

  onModuleInit(): void {
    this.db = new Database(':memory:');
    this.initializeTables();
  }

  onModuleDestroy(): void {
    this.db?.close();
  }

  getDatabase(): Database.Database {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  private initializeTables(): void {
    this.db?.exec(`
      CREATE TABLE IF NOT EXISTS consents (
        id TEXT PRIMARY KEY,
        data_subject_id TEXT NOT NULL,
        purpose TEXT NOT NULL CHECK(purpose IN ('marketing', 'analytics', 'functional', 'personalization')),
        status TEXT NOT NULL CHECK(status IN ('granted', 'denied', 'withdrawn')),
        timestamp TEXT NOT NULL DEFAULT (datetime('now')),
        ip_address TEXT,
        user_agent TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_consents_subject ON consents(data_subject_id);
      CREATE INDEX IF NOT EXISTS idx_consents_purpose ON consents(purpose);
    `);
  }
}

class TestDsrService {
  private readonly workflowService = new DsrWorkflowService(':memory:');

  create(dto: CreateDsrDto): DsrRequest {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    return this.workflowService.createRequest(id, dto.type, dto.dataSubjectId, dto.regulation, dto.deadlineAt);
  }

  findOne(id: string): DsrRequest | null {
    return this.workflowService.getRequest(id);
  }

  findAll(status?: string, type?: string): DsrRequest[] {
    let requests = this.workflowService.getAllRequests();
    if (status) {
      requests = requests.filter((r) => r.status === status);
    }
    if (type) {
      requests = requests.filter((r) => r.type === type);
    }
    return requests;
  }

  updateStatus(id: string, status: DsrStatus): DsrRequest {
    const request = this.workflowService.getRequest(id);
    if (!request) {
      throw new NotFoundException(`DSR request with id ${id} not found`);
    }
    try {
      return this.workflowService.transitionStatus(id, status, 'API_STATUS_UPDATE');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Invalid state transition';
      throw new BadRequestException(message);
    }
  }

  getStatistics(): { byType: Record<string, number>; byStatus: Record<string, number>; total: number } {
    return this.workflowService.getStatistics();
  }
}

@Module({
  controllers: [HealthController, ConsentController, DsrController],
  providers: [
    { provide: DatabaseService, useClass: TestDatabaseService },
    ConsentService,
    { provide: DsrService, useClass: TestDsrService },
  ],
})
class TestAppModule {}

export async function createTestApp(): Promise<INestApplication> {
  const app = await NestFactory.create(TestAppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.init();
  return app;
}
