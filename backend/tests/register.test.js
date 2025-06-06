const request = require('supertest');
const app = require('../server');
const pool = require('../db');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

jest.mock('../db', () => ({
  query: jest.fn(),
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}));

jest.mock('uuid', () => ({
  v4: jest.fn(),
}));

describe('Register API', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully register an admin user', async () => {
    const mockUser = {
      system_id: 'mock-system-id',
      surname: 'Doe',
      name: 'John',
      email: 'john.doe@example.com',
      phone: '1234567890',
      password: 'hashedPassword123',
      role: 'admin',
    };

    uuidv4.mockReturnValue('mock-system-id');
    bcrypt.hash.mockResolvedValue('hashedPassword123');
    pool.query
      .mockResolvedValueOnce({ rows: [] }) 
      .mockResolvedValueOnce({ rows: [mockUser] }); 

    const response = await request(app).post('/register').send({
      surname: 'Doe',
      name: 'John',
      email: 'john.doe@example.com',
      phone: '1234567890',
      password: 'password123',
    });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      success: true,
      user: mockUser,
    });
    expect(pool.query).toHaveBeenCalledWith(
      'SELECT * FROM users WHERE email = $1 OR phone = $2',
      ['john.doe@example.com', '1234567890']
    );
    expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
    expect(pool.query).toHaveBeenCalledWith(
      'INSERT INTO users (system_id, surname, name, email, phone, password, role) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      ['mock-system-id', 'Doe', 'John', 'john.doe@example.com', '1234567890', 'hashedPassword123', 'admin']
    );
  });

  it('should return 400 if email or phone already exists', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ user_id: 1 }] }); 

    const response = await request(app).post('/register').send({
      surname: 'Doe',
      name: 'John',
      email: 'existing@example.com',
      phone: '1234567890',
      password: 'password123',
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('error_user_exists');
    expect(pool.query).toHaveBeenCalledWith(
      'SELECT * FROM users WHERE email = $1 OR phone = $2',
      ['existing@example.com', '1234567890']
    );
  });

  it('should return 400 if data validation fails', async () => {
    const response = await request(app).post('/register').send({
      surname: '',
      name: 'John',
      email: 'invalid-email',
      phone: '123',
      password: '123',
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined(); 
  });

  it('should return 500 if there is a server error', async () => {
    pool.query.mockRejectedValueOnce(new Error('Database error'));

    const response = await request(app).post('/register').send({
      surname: 'Doe',
      name: 'John',
      email: 'john.doe@example.com',
      phone: '1234567890',
      password: 'password123',
    });

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Failed to register the administrator.');
    expect(pool.query).toHaveBeenCalledWith(
      'SELECT * FROM users WHERE email = $1 OR phone = $2',
      ['john.doe@example.com', '1234567890']
    );
  });
});