const request = require('supertest');
const app = require('../server'); 
const pool = require('../db');

jest.mock('../db', () => ({
  query: jest.fn(),
}));

describe('Clients API', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /clients', () => {
    it('should return a list of clients for a given system_id', async () => {
      const mockClients = [
        { client_id: 1, name: 'John', surname: 'Doe', phone: '1234567890', birthday: '1990-01-01', status: 'active', system_id: 'd2816ac4-6049-4d25-909c-dc7170b40bd6' },
        { client_id: 2, name: 'Jane', surname: 'Smith', phone: '0987654321', birthday: '1985-05-15', status: 'inactive', system_id: 'd2816ac4-6049-4d25-909c-dc7170b40bd6' },
      ];

      pool.query.mockResolvedValueOnce({ rows: mockClients });

      const response = await request(app).get('/clients').query({ system_id: 'd2816ac4-6049-4d25-909c-dc7170b40bd6' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockClients);
      expect(pool.query).toHaveBeenCalledWith('SELECT * FROM clients WHERE system_id = $1', ['d2816ac4-6049-4d25-909c-dc7170b40bd6']);
    });

    it('should return 400 if system_id is not provided', async () => {
      const response = await request(app).get('/clients');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('error_system_id_required');
    });
  });

  describe('POST /clients', () => {
    it('should successfully add a new client', async () => {
      const mockClient = {
        client_id: 1,
        name: 'John',
        surname: 'Doe',
        phone: '1234567890',
        birthday: '1990-01-01',
        status: 'active',
        system_id: 'd2816ac4-6049-4d25-909c-dc7170b40bd6',
      };

      pool.query.mockResolvedValueOnce({ rows: [mockClient] });

      const response = await request(app).post('/clients').send({
        name: 'John',
        surname: 'Doe',
        phone: '1234567890',
        birthday: '1990-01-01',
        status: 'active',
        system_id: 'd2816ac4-6049-4d25-909c-dc7170b40bd6',
      });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockClient);
      expect(pool.query).toHaveBeenCalledWith(
        'INSERT INTO clients (name, surname, phone, birthday, system_id, status) VALUES ($1, $2, $3, $4::date, $5::uuid, $6) RETURNING *',
        ['John', 'Doe', '1234567890', '1990-01-01', 'd2816ac4-6049-4d25-909c-dc7170b40bd6', 'active']
      );
    });

    it('should return 400 if validation fails', async () => {
      const response = await request(app).post('/clients').send({
        name: '',
        surname: 'Doe',
        phone: '123',
        birthday: '2025-01-01', 
        status: 'active',
        system_id: 'd2816ac4-6049-4d25-909c-dc7170b40bd6',
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined(); 
    });
  });

  describe('PUT /clients/:client_id', () => {
    it('should successfully update a client', async () => {
      const mockClient = {
        client_id: 1,
        name: 'John',
        surname: 'Doe',
        phone: '1234567890',
        birthday: '1990-01-01',
        status: 'inactive',
        system_id: 'd2816ac4-6049-4d25-909c-dc7170b40bd6',
      };

      pool.query.mockResolvedValueOnce({ rows: [mockClient] });

      const response = await request(app).put('/clients/1').send({
        name: 'John',
        surname: 'Doe',
        phone: '1234567890',
        birthday: '1990-01-01',
        status: 'inactive',
        system_id: 'd2816ac4-6049-4d25-909c-dc7170b40bd6',
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockClient);
      expect(pool.query).toHaveBeenCalledWith(
        'UPDATE clients SET name = $1, surname = $2, phone = $3, birthday = $4::date, status = $5 WHERE client_id = $6 RETURNING *',
        ['John', 'Doe', '1234567890', '1990-01-01', 'inactive', '1']
      );
    });

    it('should return 404 if client is not found', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app).put('/clients/999').send({
        name: 'Nonexistent',
        surname: 'Client',
        phone: '1234567890',
        birthday: '1990-01-01',
        status: 'active',
        system_id: 'd2816ac4-6049-4d25-909c-dc7170b40bd6',
      });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Client not found.');
    });
  });

  describe('DELETE /clients/:client_id', () => {
    it('should successfully delete a client', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ count: '0' }] });
      pool.query.mockResolvedValueOnce({ rows: [{ client_id: 1 }] });

      const response = await request(app).delete('/clients/1');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Client deleted successfully');
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT COUNT(*) FROM certificates WHERE client_id = $1',
        ['1']
      );
      expect(pool.query).toHaveBeenCalledWith('DELETE FROM clients WHERE client_id = $1 RETURNING *', ['1']);
    });

    it('should return 400 if client is in use', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ count: '1' }] });

      const response = await request(app).delete('/clients/1');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Client cannot be deleted because they have active certificates. You can change their status to 'inactive'.");
    });

    it('should return 404 if client is not found', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ count: '0' }] });
      pool.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app).delete('/clients/999');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Client not found.');
    });
  });
});