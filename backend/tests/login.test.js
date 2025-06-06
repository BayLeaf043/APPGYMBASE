const request = require('supertest');
const app = require('../server'); 
const pool = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

jest.mock('../db', () => ({
  query: jest.fn(),
}));

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
}));

describe('Login API', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return a token and user details for valid credentials', async () => {
    const mockUser = {
      user_id: 1,
      name: 'John',
      surname: 'Doe',
      email: 'john.doe@example.com',
      password: 'hashedPassword123',
      role: 'employee',
      system_id: 'd2816ac4-6049-4d25-909c-dc7170b40bd6',
    };

    pool.query.mockResolvedValueOnce({ rows: [mockUser] });
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue('mockToken');

    const response = await request(app).post('/login').send({
      email: 'john.doe@example.com',
      password: 'password123',
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      token: 'mockToken',
      user: {
        surname: mockUser.surname,
        name: mockUser.name,
        role: mockUser.role,
        system_id: mockUser.system_id,
      },
    });
    expect(pool.query).toHaveBeenCalledWith('SELECT * FROM users WHERE email = $1', ['john.doe@example.com']);
    expect(bcrypt.compare).toHaveBeenCalledWith('password123', mockUser.password);
    expect(jwt.sign).toHaveBeenCalledWith(
      { userId: mockUser.system_id, role: mockUser.role },
      'your-secret-key',
      { expiresIn: '7d' }
    );
  });

  it('should return 400 for invalid email', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const response = await request(app).post('/login').send({
      email: 'invalid@example.com',
      password: 'password123',
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('error_invalid_credentials');
    expect(pool.query).toHaveBeenCalledWith('SELECT * FROM users WHERE email = $1', ['invalid@example.com']);
  });

  it('should return 400 for invalid password', async () => {
    const mockUser = {
      user_id: 1,
      name: 'John',
      surname: 'Doe',
      email: 'john.doe@example.com',
      password: 'hashedPassword123',
      role: 'employee',
      system_id: 'd2816ac4-6049-4d25-909c-dc7170b40bd6',
    };

    pool.query.mockResolvedValueOnce({ rows: [mockUser] });
    bcrypt.compare.mockResolvedValue(false);

    const response = await request(app).post('/login').send({
      email: 'john.doe@example.com',
      password: 'wrongPassword',
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid email or password.');
    expect(pool.query).toHaveBeenCalledWith('SELECT * FROM users WHERE email = $1', ['john.doe@example.com']);
    expect(bcrypt.compare).toHaveBeenCalledWith('wrongPassword', mockUser.password);
  });

  it('should return 500 for server errors', async () => {
    pool.query.mockRejectedValueOnce(new Error('Database error'));

    const response = await request(app).post('/login').send({
      email: 'john.doe@example.com',
      password: 'password123',
    });

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Login failed. Please try again later.');
    expect(pool.query).toHaveBeenCalledWith('SELECT * FROM users WHERE email = $1', ['john.doe@example.com']);
  });
});