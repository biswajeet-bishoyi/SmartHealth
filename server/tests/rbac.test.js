require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../server');
const User = require('../models/User');

const MONGO_TEST_URI = process.env.MONGO_URI?.replace('/smarthealthne', '/smarthealthne_test')
  || 'mongodb://localhost:27017/smarthealthne_test';

let communityToken, workerToken, adminToken;

beforeAll(async () => {
  await mongoose.connect(MONGO_TEST_URI);
  await User.deleteMany({});

  // Create test accounts
  const [comm, worker, admin] = await Promise.all([
    request(app).post('/api/auth/register').send({
      name: 'Comm', email: 'comm@rbac.test', password: 'pass1234',
      role: 'COMMUNITY_MEMBER', district: 'Kamrup', state: 'Assam',
    }),
    request(app).post('/api/auth/register').send({
      name: 'Worker', email: 'worker@rbac.test', password: 'pass1234',
      role: 'HEALTH_WORKER', district: 'Kamrup', state: 'Assam',
    }),
    request(app).post('/api/auth/register').send({
      name: 'Admin', email: 'admin@rbac.test', password: 'pass1234',
      role: 'NATIONAL_ADMIN', district: 'Kamrup', state: 'Assam',
    }),
  ]);

  communityToken = comm.body.data.token;
  workerToken = worker.body.data.token;
  adminToken = admin.body.data.token;
});

afterAll(async () => {
  await User.deleteMany({});
  await mongoose.disconnect();
});

describe('RBAC — Admin-only endpoints', () => {
  test('community member cannot access admin dashboard (403)', async () => {
    const res = await request(app).get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${communityToken}`);
    expect(res.status).toBe(403);
  });

  test('health worker cannot access admin dashboard (403)', async () => {
    const res = await request(app).get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${workerToken}`);
    expect(res.status).toBe(403);
  });

  test('admin can access admin dashboard (200)', async () => {
    const res = await request(app).get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });
});

describe('RBAC — Health worker endpoints', () => {
  test('community member cannot access health worker dashboard (403)', async () => {
    const res = await request(app).get('/api/health-worker/dashboard')
      .set('Authorization', `Bearer ${communityToken}`);
    expect(res.status).toBe(403);
  });

  test('health worker can access health worker dashboard (200)', async () => {
    const res = await request(app).get('/api/health-worker/dashboard')
      .set('Authorization', `Bearer ${workerToken}`);
    expect(res.status).toBe(200);
  });

  test('admin can access health worker dashboard (200)', async () => {
    // Admin also gets HW access per route config
    const res = await request(app).get('/api/health-worker/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });
});

describe('RBAC — Unauthenticated requests', () => {
  test('returns 401 for protected routes without token', async () => {
    const res = await request(app).get('/api/reports');
    expect(res.status).toBe(401);
  });
});
