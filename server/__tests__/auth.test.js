import request from 'supertest';
import { createApp } from '../src/app.js';

const app = createApp();

describe('Health & auth API', () => {
  it('GET /api/health returns success envelope', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ok');
  });

  it('POST /api/auth/register validates password complexity', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: `test-${Date.now()}@example.com`,
      password: 'weak',
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/auth/login rejects invalid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'nobody@example.com',
      password: 'WrongPass1',
    });
    expect([401, 429]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });
});
