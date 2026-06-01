import Database from 'better-sqlite3';
import { DsrRequest, DsrStatus, DsrType, Regulation, AuditLog } from './types';

const VALID_TRANSITIONS: Record<string, DsrStatus[]> = {
  pending: ['verifying', 'rejected'],
  verifying: ['processing', 'rejected'],
  processing: ['completed', 'rejected'],
  completed: [],
  rejected: [],
};

export class DsrWorkflowService {
  private db: Database.Database;

  constructor(dbPath: string = ':memory:') {
    this.db = new Database(dbPath);
    this.initializeTables();
  }

  private initializeTables(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS dsr_requests (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL CHECK(type IN ('access', 'deletion', 'portability', 'correction')),
        status TEXT NOT NULL CHECK(status IN ('pending', 'verifying', 'processing', 'completed', 'rejected')),
        data_subject_id TEXT NOT NULL,
        regulation TEXT NOT NULL CHECK(regulation IN ('gdpr', 'ccpa', 'lgpd')),
        deadline_at TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        dsr_id TEXT NOT NULL,
        from_status TEXT CHECK(from_status IN ('pending', 'verifying', 'processing', 'completed', 'rejected')),
        to_status TEXT NOT NULL CHECK(to_status IN ('pending', 'verifying', 'processing', 'completed', 'rejected')),
        action TEXT NOT NULL,
        metadata TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (dsr_id) REFERENCES dsr_requests(id)
      );
    `);
  }

  createRequest(
    id: string,
    type: DsrType,
    dataSubjectId: string,
    regulation: Regulation,
    deadlineAt: string
  ): DsrRequest {
    const stmt = this.db.prepare(
      `INSERT INTO dsr_requests (id, type, status, data_subject_id, regulation, deadline_at)
       VALUES (?, ?, 'pending', ?, ?, ?)`
    );
    stmt.run(id, type, dataSubjectId, regulation, deadlineAt);

    const request = this.getRequest(id);
    if (!request) {
      throw new Error(`Failed to create DSR request with id ${id}`);
    }

    this.logAudit(id, null, 'pending', 'CREATE', { type, regulation });
    return request;
  }

  getRequest(id: string): DsrRequest | null {
    const stmt = this.db.prepare('SELECT * FROM dsr_requests WHERE id = ?');
    const row = stmt.get(id) as Record<string, unknown> | undefined;
    if (!row) return null;
    return this.mapRowToRequest(row);
  }

  getAllRequests(): DsrRequest[] {
    const stmt = this.db.prepare('SELECT * FROM dsr_requests ORDER BY created_at DESC');
    const rows = stmt.all() as Record<string, unknown>[];
    return rows.map((row) => this.mapRowToRequest(row));
  }

  transitionStatus(
    id: string,
    newStatus: DsrStatus,
    action: string = 'TRANSITION',
    metadata?: Record<string, unknown>
  ): DsrRequest {
    const request = this.getRequest(id);
    if (!request) {
      throw new Error(`DSR request with id ${id} not found`);
    }

    const allowedTransitions = VALID_TRANSITIONS[request.status];
    if (!allowedTransitions.includes(newStatus)) {
      throw new Error(
        `Invalid transition from ${request.status} to ${newStatus}. Allowed: ${allowedTransitions.join(', ') || 'none'}`
      );
    }

    const updateStmt = this.db.prepare(
      `UPDATE dsr_requests SET status = ?, updated_at = datetime('now') WHERE id = ?`
    );
    updateStmt.run(newStatus, id);

    this.logAudit(id, request.status, newStatus, action, metadata);

    const updated = this.getRequest(id);
    if (!updated) {
      throw new Error(`Failed to update DSR request with id ${id}`);
    }
    return updated;
  }

  getAuditLogs(dsrId: string): AuditLog[] {
    const stmt = this.db.prepare(
      'SELECT * FROM audit_logs WHERE dsr_id = ? ORDER BY created_at ASC'
    );
    const rows = stmt.all(dsrId) as Record<string, unknown>[];
    return rows.map((row) => this.mapRowToAuditLog(row));
  }

  getAllAuditLogs(): AuditLog[] {
    const stmt = this.db.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC');
    const rows = stmt.all() as Record<string, unknown>[];
    return rows.map((row) => this.mapRowToAuditLog(row));
  }

  private logAudit(
    dsrId: string,
    fromStatus: DsrStatus | null,
    toStatus: DsrStatus,
    action: string,
    metadata?: Record<string, unknown>
  ): void {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    const stmt = this.db.prepare(
      `INSERT INTO audit_logs (id, dsr_id, from_status, to_status, action, metadata)
       VALUES (?, ?, ?, ?, ?, ?)`
    );
    stmt.run(
      id,
      dsrId,
      fromStatus,
      toStatus,
      action,
      JSON.stringify(metadata ?? {})
    );
  }

  getStatistics(): { byType: Record<string, number>; byStatus: Record<string, number>; total: number } {
    const requests = this.getAllRequests();
    const byType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    for (const request of requests) {
      byType[request.type] = (byType[request.type] ?? 0) + 1;
      byStatus[request.status] = (byStatus[request.status] ?? 0) + 1;
    }

    return { byType, byStatus, total: requests.length };
  }

  private mapRowToRequest(row: Record<string, unknown>): DsrRequest {
    return new DsrRequest({
      id: String(row.id),
      type: String(row.type) as DsrType,
      status: String(row.status) as DsrStatus,
      dataSubjectId: String(row.data_subject_id),
      regulation: String(row.regulation) as Regulation,
      deadlineAt: String(row.deadline_at),
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
    });
  }

  private mapRowToAuditLog(row: Record<string, unknown>): AuditLog {
    return {
      id: String(row.id),
      dsrId: String(row.dsr_id),
      fromStatus: row.from_status ? (String(row.from_status) as DsrStatus) : null,
      toStatus: String(row.to_status) as DsrStatus,
      action: String(row.action),
      metadata: String(row.metadata),
      createdAt: String(row.created_at),
    };
  }

  close(): void {
    this.db.close();
  }
}
