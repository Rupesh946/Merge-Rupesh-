const request = require('supertest');
const app = require('../index');
const prisma = require('../config/database');
const { connectRedis, disconnectRedis } = require('../config/redis');

// Mock process.env.JWT_SECRET for testing
process.env.JWT_SECRET = 'supersecretjwtkeyforTESTING';
process.env.FRONTEND_URL = 'http://localhost:3000'; // Needed for github callback

describe('Auth Endpoints', () => {
  // Clear the database before each test
  beforeEach(async () => {
    // Delete all users to ensure a clean state for each test
    await prisma.user.deleteMany({});
  });

  // Disconnect prisma and redis after all tests are done
  afterAll(async () => {
    await prisma.$disconnect();
    await disconnectRedis();
  });

  it('should register a new user successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('message', 'User created successfully');
    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user).toHaveProperty('email', 'test@example.com');
    expect(res.body).toHaveProperty('token');

    // Verify user exists in the database
    const userInDb = await prisma.user.findUnique({
      where: { email: 'test@example.com' },
    });
    expect(userInDb).not.toBeNull();
    expect(userInDb.username).toBe('testuser');
  });

  it('should not register a user with an existing email', async () => {
    // First, register a user
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Existing User',
        username: 'existinguser',
        email: 'existing@example.com',
        password: 'password123',
      });

    // Try to register another user with the same email
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Another User',
        username: 'anotheruser',
        email: 'existing@example.com',
        password: 'anotherpassword',
      });

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('error', 'Email already registered');
  });

  it('should not register a user with an existing username', async () => {
    // First, register a user
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Existing User',
        username: 'existingusername',
        email: 'unique@example.com',
        password: 'password123',
      });

    // Try to register another user with the same username
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Another User',
        username: 'existingusername',
        email: 'anotherunique@example.com',
        password: 'anotherpassword',
      });

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('error', 'Username already taken');
  });

  it('should return validation errors for invalid registration data', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: '', // Empty name
        username: 'us', // Too short
        email: 'invalid-email', // Invalid email format
        password: '123', // Too short
      });

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('error', 'Validation failed');
    expect(res.body.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: 'email' }),
        expect.objectContaining({ path: 'password' }),
        expect.objectContaining({ path: 'username' }),
        expect.objectContaining({ path: 'name' }),
      ])
    );
  });
});
