import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import { createTestApp } from './test-app';

describe('DsrController', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /dsr creates a DSR request', async () => {
    const response = await request(app.getHttpServer())
      .post('/dsr')
      .send({
        type: 'access',
        dataSubjectId: 'user1',
        regulation: 'gdpr',
        deadlineAt: '2099-12-31',
      });
    expect(response.status).toBe(201);
    expect(response.body.status).toBe('pending');
    expect(response.body.type).toBe('access');
  });

  it('POST /dsr validates required fields and returns 400 on missing fields', async () => {
    const response = await request(app.getHttpServer())
      .post('/dsr')
      .send({ type: 'access' });
    expect(response.status).toBe(400);
  });

  it('GET /dsr returns list of DSRs', async () => {
    await request(app.getHttpServer())
      .post('/dsr')
      .send({ type: 'access', dataSubjectId: 'user1', regulation: 'gdpr', deadlineAt: '2099-12-31' });

    const response = await request(app.getHttpServer()).get('/dsr');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
  });

  it('GET /dsr supports ?status= filtering', async () => {
    await request(app.getHttpServer())
      .post('/dsr')
      .send({ type: 'access', dataSubjectId: 'user1', regulation: 'gdpr', deadlineAt: '2099-12-31' });

    const response = await request(app.getHttpServer()).get('/dsr?status=pending');
    expect(response.status).toBe(200);
    expect(response.body.every((r: { status: string }) => r.status === 'pending')).toBe(true);
  });

  it('GET /dsr supports ?type= filtering', async () => {
    await request(app.getHttpServer())
      .post('/dsr')
      .send({ type: 'deletion', dataSubjectId: 'user2', regulation: 'ccpa', deadlineAt: '2099-12-31' });

    const response = await request(app.getHttpServer()).get('/dsr?type=deletion');
    expect(response.status).toBe(200);
    expect(response.body.every((r: { type: string }) => r.type === 'deletion')).toBe(true);
  });

  it('GET /dsr/:id returns a DSR', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/dsr')
      .send({ type: 'access', dataSubjectId: 'user1', regulation: 'gdpr', deadlineAt: '2099-12-31' });

    const response = await request(app.getHttpServer()).get(`/dsr/${createRes.body.id}`);
    expect(response.status).toBe(200);
    expect(response.body.id).toBe(createRes.body.id);
  });

  it('GET /dsr/:id returns 404 for non-existent DSR', async () => {
    const response = await request(app.getHttpServer()).get('/dsr/nonexistent');
    expect(response.status).toBe(404);
  });

  it('PATCH /dsr/:id/status transitions status and validates transition', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/dsr')
      .send({ type: 'access', dataSubjectId: 'user1', regulation: 'gdpr', deadlineAt: '2099-12-31' });

    const response = await request(app.getHttpServer())
      .patch(`/dsr/${createRes.body.id}/status`)
      .send({ status: 'verifying' });
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('verifying');
  });

  it('PATCH /dsr/:id/status returns 400 on invalid transition', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/dsr')
      .send({ type: 'access', dataSubjectId: 'user1', regulation: 'gdpr', deadlineAt: '2099-12-31' });

    const response = await request(app.getHttpServer())
      .patch(`/dsr/${createRes.body.id}/status`)
      .send({ status: 'completed' });
    expect(response.status).toBe(400);
  });

  it('GET /dsr/stats returns statistics by type and status', async () => {
    await request(app.getHttpServer())
      .post('/dsr')
      .send({ type: 'access', dataSubjectId: 'user1', regulation: 'gdpr', deadlineAt: '2099-12-31' });
    await request(app.getHttpServer())
      .post('/dsr')
      .send({ type: 'deletion', dataSubjectId: 'user2', regulation: 'ccpa', deadlineAt: '2099-12-31' });

    const response = await request(app.getHttpServer()).get('/dsr/stats');
    expect(response.status).toBe(200);
    expect(response.body.total).toBe(2);
    expect(response.body.byType.access).toBe(1);
    expect(response.body.byType.deletion).toBe(1);
    expect(response.body.byStatus.pending).toBe(2);
  });
});
