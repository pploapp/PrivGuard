import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DsrWorkflowService } from './dsr-workflow.service';
import { Regulation, DsrRequest } from './types';

describe('DsrWorkflowService', () => {
  let service: DsrWorkflowService;

  beforeEach(() => {
    service = new DsrWorkflowService(':memory:');
  });

  afterEach(() => {
    service.close();
  });

  describe('createRequest', () => {
    it('creates DSR with correct initial state (pending)', () => {
      const request = service.createRequest('1', 'access', 'user1', Regulation.GDPR, '2025-12-31');
      expect(request.status).toBe('pending');
      expect(request.type).toBe('access');
      expect(request.dataSubjectId).toBe('user1');
      expect(request.regulation).toBe(Regulation.GDPR);
    });
  });

  describe('transitionStatus', () => {
    it('transitions pending→verifying→processing→completed (happy path)', () => {
      service.createRequest('1', 'access', 'user1', Regulation.GDPR, '2025-12-31');

      const verifying = service.transitionStatus('1', 'verifying');
      expect(verifying.status).toBe('verifying');

      const processing = service.transitionStatus('1', 'processing');
      expect(processing.status).toBe('processing');

      const completed = service.transitionStatus('1', 'completed');
      expect(completed.status).toBe('completed');
    });

    it('throws on invalid transitions (e.g., pending→completed)', () => {
      service.createRequest('1', 'access', 'user1', Regulation.GDPR, '2025-12-31');
      expect(() => service.transitionStatus('1', 'completed')).toThrow('Invalid transition from pending to completed');
      expect(() => service.transitionStatus('1', 'pending')).toThrow('Invalid transition from pending to pending');
    });

    it('rejects from any active state', () => {
      service.createRequest('1', 'access', 'user1', Regulation.GDPR, '2025-12-31');
      service.transitionStatus('1', 'verifying');
      const rejectedFromVerifying = service.transitionStatus('1', 'rejected');
      expect(rejectedFromVerifying.status).toBe('rejected');

      service.createRequest('2', 'deletion', 'user2', Regulation.GDPR, '2025-12-31');
      const rejectedFromPending = service.transitionStatus('2', 'rejected');
      expect(rejectedFromPending.status).toBe('rejected');

      service.createRequest('3', 'portability', 'user3', Regulation.GDPR, '2025-12-31');
      service.transitionStatus('3', 'verifying');
      service.transitionStatus('3', 'processing');
      const rejectedFromProcessing = service.transitionStatus('3', 'rejected');
      expect(rejectedFromProcessing.status).toBe('rejected');
    });
  });

  describe('getStatistics', () => {
    it('returns correct counts by type and status', () => {
      service.createRequest('1', 'access', 'user1', Regulation.GDPR, '2025-12-31');
      service.createRequest('2', 'deletion', 'user2', Regulation.GDPR, '2025-12-31');
      service.createRequest('3', 'access', 'user3', Regulation.CCPA, '2025-12-31');
      service.transitionStatus('1', 'verifying');
      service.transitionStatus('2', 'rejected');

      const stats = service.getStatistics();
      expect(stats.total).toBe(3);
      expect(stats.byType.access).toBe(2);
      expect(stats.byType.deletion).toBe(1);
      expect(stats.byStatus.pending).toBe(1);
      expect(stats.byStatus.verifying).toBe(1);
      expect(stats.byStatus.rejected).toBe(1);
    });
  });

  describe('isOverdue', () => {
    it('returns true when deadline is past', () => {
      const request = service.createRequest('1', 'access', 'user1', Regulation.GDPR, '2020-01-01');
      expect(request.isOverdue()).toBe(true);
    });

    it('returns false when deadline is in the future', () => {
      const request = service.createRequest('1', 'access', 'user1', Regulation.GDPR, '2099-12-31');
      expect(request.isOverdue()).toBe(false);
    });

    it('returns false for null/empty deadline', () => {
      const requestWithEmpty = new DsrRequest({
        id: '1',
        type: 'access',
        status: 'pending',
        dataSubjectId: 'user1',
        regulation: Regulation.GDPR,
        deadlineAt: '',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      });
      expect(requestWithEmpty.isOverdue()).toBe(false);
    });
  });

  describe('daysUntilDeadline', () => {
    it('returns correct number of days', () => {
      const future = new Date();
      future.setDate(future.getDate() + 5);
      const deadline = future.toISOString().split('T')[0];
      const request = service.createRequest('1', 'access', 'user1', Regulation.GDPR, deadline);
      expect(request.daysUntilDeadline()).toBe(5);
    });
  });

  describe('audit logs', () => {
    it('logs every transition with from_status, to_status, and actor', () => {
      service.createRequest('1', 'access', 'user1', Regulation.GDPR, '2025-12-31');
      service.transitionStatus('1', 'verifying', 'VERIFY');
      service.transitionStatus('1', 'processing', 'PROCESS');

      const logs = service.getAuditLogs('1');
      expect(logs.length).toBe(3);

      expect(logs[0].fromStatus).toBeNull();
      expect(logs[0].toStatus).toBe('pending');
      expect(logs[0].action).toBe('CREATE');

      expect(logs[1].fromStatus).toBe('pending');
      expect(logs[1].toStatus).toBe('verifying');
      expect(logs[1].action).toBe('VERIFY');

      expect(logs[2].fromStatus).toBe('verifying');
      expect(logs[2].toStatus).toBe('processing');
      expect(logs[2].action).toBe('PROCESS');
    });
  });
});
