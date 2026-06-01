import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Database from 'better-sqlite3';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private db: Database.Database | null = null;

  onModuleInit(): void {
    this.db = new Database('./privguard.sqlite');
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
