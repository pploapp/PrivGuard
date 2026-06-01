export enum ConsentPurpose {
  Marketing = 'marketing',
  Analytics = 'analytics',
  Functional = 'functional',
  Personalization = 'personalization',
}

export enum Regulation {
  GDPR = 'gdpr',
  CCPA = 'ccpa',
  LGPD = 'lgpd',
}

export type DsrType = 'access' | 'deletion' | 'portability' | 'correction';

export type DsrStatus = 'pending' | 'verifying' | 'processing' | 'completed' | 'rejected';

export class DsrRequest {
  id: string;
  type: DsrType;
  status: DsrStatus;
  dataSubjectId: string;
  regulation: Regulation;
  deadlineAt: string;
  createdAt: string;
  updatedAt: string;

  constructor(props: {
    id: string;
    type: DsrType;
    status: DsrStatus;
    dataSubjectId: string;
    regulation: Regulation;
    deadlineAt: string;
    createdAt: string;
    updatedAt: string;
  }) {
    this.id = props.id;
    this.type = props.type;
    this.status = props.status;
    this.dataSubjectId = props.dataSubjectId;
    this.regulation = props.regulation;
    this.deadlineAt = props.deadlineAt;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  isOverdue(): boolean {
    return new Date(this.deadlineAt) < new Date();
  }

  daysUntilDeadline(): number {
    const diff = new Date(this.deadlineAt).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }
}

export interface AuditLog {
  id: string;
  dsrId: string;
  fromStatus: DsrStatus | null;
  toStatus: DsrStatus;
  action: string;
  metadata: string;
  createdAt: string;
}

export interface StateTransition {
  from: DsrStatus | null;
  to: DsrStatus;
  validator?: (request: DsrRequest, metadata?: Record<string, unknown>) => boolean;
}
