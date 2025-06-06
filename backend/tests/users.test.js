const request = require('supertest');
const app = require('../server'); 
const pool = require('../db'); 
const bcrypt = require('bcrypt'); 

jest.mock('../db', () => ({
  query: jest.fn(),
  end: jest.fn(),
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}));

describe('Users API', () => {
  afterEach(() => {
    jest.clearAllMocks(); 
  });

  afterAll(() => {
    pool.end(); 
  });

  describe('GET /users', () => {
    it('should fetch all users for a given system_id', async () => {
      const mockUsers = [
        { user_id: 1, name: 'John', surname: 'Doe', email: 'john.doe@example.com', phone: '1234567890', role: 'employee', status: 'active', system_id: 'd2816ac4-6049-4d25-909c-dc7170b40bd6' },
        { user_id: 2, name: 'Jane', surname: 'Smith', email: 'jane.smith@example.com', phone: '0987654321', role: 'employee', status: 'inactive', system_id: 'd2816ac4-6049-4d25-909c-dc7170b40bd6' },
      ];

      pool.query.mockResolvedValue({ rows: mockUsers });

      const response = await request(app)
        .get('/users')
        .query({ system_id: 'd2816ac4-6049-4d25-909c-dc7170b40bd6' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUsers);
      expect(pool.query).toHaveBeenCalledWith('SELECT * FROM users WHERE system_id = $1', [
        'd2816ac4-6049-4d25-909c-dc7170b40bd6',
      ]);
    });

    it('should return 400 if system_id is missing', async () => {
      const response = await request(app).get('/users');
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('error_system_id_required');
    });
  });

  describe('POST /users', () => {
    it('should add a new user', async () => {
      const newUser = {
        name: 'John',
        surname: 'Doe',
        email: 'john.doe@example.com',
        phone: '1234567890',
        password: 'password123',
        role: 'employee',
        status: 'active',
        system_id: 'd2816ac4-6049-4d25-909c-dc7170b40bd6',
      };
      const mockResult = { user_id: 1, ...newUser, password: 'hashedPassword123' };

      pool.query.mockResolvedValueOnce({ rows: [] }); 
      bcrypt.hash.mockResolvedValue('hashedPassword123'); 
      pool.query.mockResolvedValueOnce({ rows: [mockResult] }); 

      const response = await request(app).post('/users').send(newUser);

      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockResult);
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE email = $1 OR phone = $2',
        [newUser.email, newUser.phone]
      );
      expect(bcrypt.hash).toHaveBeenCalledWith(newUser.password, 10);
      expect(pool.query).toHaveBeenCalledWith(
        'INSERT INTO users (name, surname, email, phone, password, role, status, system_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::uuid) RETURNING *',
        [newUser.name, newUser.surname, newUser.email, newUser.phone, 'hashedPassword123', newUser.role, newUser.status, newUser.system_id]
      );
    });

    it('should return 400 if validation fails', async () => {
      const invalidUser = {
        name: '',
        surname: 'Doe',
        email: 'invalid-email',
        phone: '123',
        password: '123',
        role: 'employee',
        status: 'active',
        system_id: 'd2816ac4-6049-4d25-909c-dc7170b40bd6',
      };

      const response = await request(app).post('/users').send(invalidUser);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('User name is required.'); 
    });

    it('should return 400 if user already exists', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ user_id: 1 }] }); 

      const newUser = {
        name: 'John',
        surname: 'Doe',
        email: 'john.doe@example.com',
        phone: '1234567890',
        password: 'password123',
        role: 'employee',
        status: 'active',
        system_id: 'd2816ac4-6049-4d25-909c-dc7170b40bd6',
      };

      const response = await request(app).post('/users').send(newUser);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('A user with this email or phone number already exists.'); 
    });
  });

  describe('PUT /users/:user_id', () => {
    it('should update an existing user', async () => {
      const updatedUser = {
        name: 'John',
        surname: 'Doe',
        email: 'updated.john.doe@example.com',
        phone: '1234567890',
        role: 'employee',
        status: 'inactive',
        system_id: 'd2816ac4-6049-4d25-909c-dc7170b40bd6',
      };
      const mockResult = { user_id: 1, ...updatedUser };

      pool.query.mockResolvedValueOnce({ rows: [mockResult] });

      const response = await request(app).put('/users/1').send(updatedUser);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResult);
    });

    it('should return 404 if user is not found', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const updatedUser = {
        name: 'Nonexistent User',
        surname: 'Doe',
        email: 'nonexistent@example.com',
        phone: '1234567890',
        role: 'employee',
        status: 'active',
        system_id: 'd2816ac4-6049-4d25-909c-dc7170b40bd6',
      };

      const response = await request(app).put('/users/999').send(updatedUser);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('User not found.');
    });
  });

  describe('DELETE /users/:user_id', () => {
    it('should delete a user if they are not in use', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ role: 'employee' }] })
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })
        .mockResolvedValueOnce({ rows: [{ user_id: 1 }] });

      const response = await request(app).delete('/users/1');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('User deleted successfully.');
    });

    it('should return 404 if user is not found', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app).delete('/users/999');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('User not found.');
    });

    it('should return 403 if user is an admin', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ role: 'admin' }] });

      const response = await request(app).delete('/users/1');

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Deleting an admin is forbidden.');
    });

    it('should return 400 if user is in use in events', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ role: 'employee' }] })
        .mockResolvedValueOnce({ rows: [{ count: '1' }] });

      const response = await request(app).delete('/users/1');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('User cannot be deleted because they are assigned to events.');
    });
  });
});