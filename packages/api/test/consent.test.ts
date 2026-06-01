import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import { createTestApp } from './test-app';

describe('ConsentController', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /consents creates a consent', async () => {
    const response = await request(app.getHttpServer())
      .post('/consents')
      .send({
        dataSubjectId: 'user1',
        purpose: 'marketing',
        status: 'granted',
      });
    expect(response.status).toBe(201);
    expect(response.body.dataSubjectId).toBe('user1');
    expect(response.body.purpose).toBe('marketing');
    expect(response.body.status).toBe('granted');
  });

  it('POST /consents validates required fields and returns 400 on missing fields', async () => {
    const response = await request(app.getHttpServer())
      .post('/consents')
      .send({ dataSubjectId: 'user1' });
    expect(response.status).toBe(400);
  });

  it('GET /consents returns list of consents', async () => {
    await request(app.getHttpServer())
      .post('/consents')
      .send({ dataSubjectId: 'user1', purpose: 'marketing', status: 'granted' });

    const response = await request(app.getHttpServer()).get('/consents');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
  });

  it('GET /consents/:id returns a consent', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/consents')
      .send({ dataSubjectId: 'user1', purpose: 'marketing', status: 'granted' });

    const response = await request(app.getHttpServer()).get(`/consents/${createRes.body.id}`);
    expect(response.status).toBe(200);
    expect(response.body.id).toBe(createRes.body.id);
  });

  it('GET /consents/:id returns 404 for non-existent consent', async () => {
    const response = await request(app.getHttpServer()).get('/consents/nonexistent');
    expect(response.status).toBe(404);
  });

  it('PATCH /consents/:id updates a consent', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/consents')
      .send({ dataSubjectId: 'user1', purpose: 'marketing', status: 'granted' });

    const response = await request(app.getHttpServer())
      .patch(`/consents/${createRes.body.id}`)
      .send({ status: 'withdrawn' });
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('withdrawn');
  });

  it('GET /consents/stats returns statistics by purpose and status', async () => {
    await request(app.getHttpServer())
      .post('/consents')
      .send({ dataSubjectId: 'user1', purpose: 'marketing', status: 'granted' });
    await request(app.getHttpServer())
      .post('/consents')
      .send({ dataSubjectId: 'user2', purpose: 'analytics', status: 'denied' });

    const response = await request(app.getHttpServer()).get('/consents/stats');
    expect(response.status).toBe(200);
    expect(response.body.total).toBe(2);
    expect(response.body.byPurpose.marketing).toBe(1);
    expect(response.body.byPurpose.analytics).toBe(1);
    expect(response.body.byStatus.granted).toBe(1);
    expect(response.body.byStatus.denied).toBe(1);
  });
});
