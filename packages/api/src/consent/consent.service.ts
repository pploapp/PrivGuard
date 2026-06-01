import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateConsentDto } from './dto/create-consent.dto';
import { UpdateConsentDto } from './dto/update-consent.dto';

export interface Consent {
  id: string;
  dataSubjectId: string;
  purpose: string;
  status: string;
  timestamp: string;
  ipAddress: string | null;
  userAgent: string | null;
}

@Injectable()
export class ConsentService {
  constructor(private readonly databaseService: DatabaseService) {}

  create(dto: CreateConsentDto): Consent {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    const db = this.databaseService.getDatabase();
    const stmt = db.prepare(
      `INSERT INTO consents (id, data_subject_id, purpose, status, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?)`
    );
    stmt.run(id, dto.dataSubjectId, dto.purpose, dto.status, dto.ipAddress ?? null, dto.userAgent ?? null);

    const consent = this.findOne(id);
    if (!consent) {
      throw new Error(`Failed to create consent with id ${id}`);
    }
    return consent;
  }

  findOne(id: string): Consent | null {
    const db = this.databaseService.getDatabase();
    const stmt = db.prepare('SELECT * FROM consents WHERE id = ?');
    const row = stmt.get(id) as Record<string, unknown> | undefined;
    if (!row) return null;
    return this.mapRow(row);
  }

  findAll(dataSubjectId?: string, purpose?: string): Consent[] {
    const db = this.databaseService.getDatabase();
    let query = 'SELECT * FROM consents WHERE 1=1';
    const params: (string | undefined)[] = [];

    if (dataSubjectId) {
      query += ' AND data_subject_id = ?';
      params.push(dataSubjectId);
    }
    if (purpose) {
      query += ' AND purpose = ?';
      params.push(purpose);
    }
    query += ' ORDER BY timestamp DESC';

    const stmt = db.prepare(query);
    const rows = stmt.all(...params) as Record<string, unknown>[];
    return rows.map((row) => this.mapRow(row));
  }

  update(id: string, dto: UpdateConsentDto): Consent {
    const db = this.databaseService.getDatabase();
    const stmt = db.prepare(
      `UPDATE consents SET status = ?, timestamp = datetime('now') WHERE id = ?`
    );
    const result = stmt.run(dto.status, id);
    if (result.changes === 0) {
      throw new NotFoundException(`Consent with id ${id} not found`);
    }
    const consent = this.findOne(id);
    if (!consent) {
      throw new Error(`Failed to update consent with id ${id}`);
    }
    return consent;
  }

  getStatistics(): { byPurpose: Record<string, number>; byStatus: Record<string, number>; total: number } {
    const db = this.databaseService.getDatabase();
    const rows = db.prepare('SELECT purpose, status FROM consents').all() as Array<{
      purpose: string;
      status: string;
    }>;

    const byPurpose: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    for (const row of rows) {
      byPurpose[row.purpose] = (byPurpose[row.purpose] ?? 0) + 1;
      byStatus[row.status] = (byStatus[row.status] ?? 0) + 1;
    }

    return { byPurpose, byStatus, total: rows.length };
  }

  private mapRow(row: Record<string, unknown>): Consent {
    return {
      id: String(row.id),
      dataSubjectId: String(row.data_subject_id),
      purpose: String(row.purpose),
      status: String(row.status),
      timestamp: String(row.timestamp),
      ipAddress: row.ip_address ? String(row.ip_address) : null,
      userAgent: row.user_agent ? String(row.user_agent) : null,
    };
  }
}
