import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createDashboardServer } from '../src/dashboard/server.js';

describe('Web Admin Dashboard Security & Routes', () => {
  // Mock discord client
  const mockClient = {
    guilds: {
      cache: new Map([
        ['guild-1', { id: 'guild-1', name: 'Server Uji Coba', memberCount: 50, iconURL: () => null }],
      ]),
    },
    users: {
      cache: new Map([['user-1', {}]]),
    },
    ws: { ping: 25 },
  };

  const app = createDashboardServer(mockClient);

  it('GET / returns 200 and loads landing page', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Discord Enterprise');
  });

  it('GET /health returns JSON metrics with status UP', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('UP');
    expect(res.body).toHaveProperty('nodeVersion');
    expect(res.body).toHaveProperty('memoryUsageMb');
    expect(res.body).toHaveProperty('botPingMs');
  });

  it('GET /guilds redirects unauthenticated users to /auth/login', async () => {
    const res = await request(app).get('/guilds');
    expect(res.status).toBe(302);
    expect(res.header.location).toBe('/auth/login');
  });

  it('GET /guilds/guild-1 redirects unauthenticated users to /auth/login', async () => {
    const res = await request(app).get('/guilds/guild-1');
    expect(res.status).toBe(302);
    expect(res.header.location).toBe('/auth/login');
  });

  it('GET /unknown-route returns 404 error page', async () => {
    const res = await request(app).get('/unknown-route');
    expect(res.status).toBe(404);
    expect(res.text).toContain('404');
  });
});
