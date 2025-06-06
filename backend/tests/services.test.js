const request = require('supertest');
const app = require('../server'); 
const pool = require('../db'); 

jest.mock('../db', () => ({
  query: jest.fn(),
  end: jest.fn(),
}));

describe('Services API', () => {
  afterEach(() => {
    jest.clearAllMocks(); 
  });

  afterAll(() => {
    pool.end(); 
  });

  describe('GET /services', () => {
    it('should fetch all services for a given system_id', async () => {
      const mockServices = [
        { service_id: 1, name: 'Personal Training', price: 100, status: 'active', system_id: 'd2816ac4-6049-4d25-909c-dc7170b40bd6' },
        { service_id: 2, name: 'Group Training', price: 50, status: 'inactive', system_id: 'd2816ac4-6049-4d25-909c-dc7170b40bd6' },
      ];

      pool.query.mockResolvedValue({ rows: mockServices });

      const response = await request(app)
        .get('/services')
        .query({ system_id: 'd2816ac4-6049-4d25-909c-dc7170b40bd6' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockServices);
      expect(pool.query).toHaveBeenCalledWith('SELECT * FROM services WHERE system_id = $1', [
        'd2816ac4-6049-4d25-909c-dc7170b40bd6',
      ]);
    });

    it('should return 400 if system_id is missing', async () => {
      const response = await request(app).get('/services');
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('error_system_id_required');
    });
  });

  describe('POST /services', () => {
    it('should add a new service', async () => {
      const newService = {
        name: 'Yoga Class',
        price: 30,
        status: 'active',
        category_id: 1,
        total_sessions: 10,
        system_id: 'd2816ac4-6049-4d25-909c-dc7170b40bd6',
      };
      const mockResult = { service_id: 3, ...newService };

      pool.query.mockResolvedValueOnce({ rows: [{ category_id: 1 }] }); 
      pool.query.mockResolvedValueOnce({ rows: [mockResult] }); 

      const response = await request(app).post('/services').send(newService);

      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockResult);
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT category_id FROM categories WHERE category_id = $1',
        [newService.category_id]
      );
      expect(pool.query).toHaveBeenCalledWith(
        'INSERT INTO services (name, status, price, category_id, total_sessions, system_id) VALUES ($1, $2, $3, $4, $5, $6::uuid) RETURNING *',
        [newService.name, newService.status, newService.price, newService.category_id, newService.total_sessions, newService.system_id]
      );
    });

    it('should return 400 if validation fails', async () => {
      const invalidService = {
        name: '',
        price: -10,
        status: 'active',
        category_id: 1,
        total_sessions: 0,
        system_id: 'd2816ac4-6049-4d25-909c-dc7170b40bd6',
      };

      const response = await request(app).post('/services').send(invalidService);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Service name is required.'); 
    });

    it('should return 404 if category is not found', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] }); 

      const newService = {
        name: 'Yoga Class',
        price: 30,
        status: 'active',
        category_id: 999,
        total_sessions: 10,
        system_id: 'd2816ac4-6049-4d25-909c-dc7170b40bd6',
      };

      const response = await request(app).post('/services').send(newService);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Category not found.'); 
    });
  });

  describe('PUT /services/:service_id', () => {
    it('should update an existing service', async () => {
      const updatedService = {
        name: 'Updated Yoga Class',
        price: 35,
        status: 'inactive',
        category_id: 1,
        total_sessions: 15,
        system_id: 'd2816ac4-6049-4d25-909c-dc7170b40bd6',
      };
      const mockResult = { service_id: 1, ...updatedService };

      pool.query.mockResolvedValueOnce({ rows: [{ category_id: 1 }] }); 
      pool.query.mockResolvedValueOnce({ rows: [mockResult] }); 

      const response = await request(app).put('/services/1').send(updatedService);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResult);
      expect(pool.query).toHaveBeenCalledWith(
        'UPDATE services SET name = $1, status = $2, price = $3, category_id = $4, total_sessions = $5 WHERE service_id = $6 RETURNING *',
        [updatedService.name, updatedService.status, updatedService.price, updatedService.category_id, updatedService.total_sessions, '1']
      );
    });

    it('should return 404 if service is not found', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ category_id: 1 }] }); 
      pool.query.mockResolvedValueOnce({ rows: [] }); 

      const updatedService = {
        name: 'Nonexistent Service',
        price: 50,
        status: 'active',
        category_id: 1,
        total_sessions: 10,
        system_id: 'd2816ac4-6049-4d25-909c-dc7170b40bd6',
      };

      const response = await request(app).put('/services/999').send(updatedService);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Service not found.'); 
    });
  });

  describe('DELETE /services/:service_id', () => {
    it('should delete a service if it is not in use', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ count: '0' }] }) 
        .mockResolvedValueOnce({ rows: [{ service_id: 1, name: 'Yoga Class' }] }); 

      const response = await request(app).delete('/services/1');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Service deleted successfully.'); 
      expect(pool.query).toHaveBeenCalledWith('SELECT COUNT(*) FROM certificates WHERE service_id = $1', ['1']);
      expect(pool.query).toHaveBeenCalledWith('DELETE FROM services WHERE service_id = $1 RETURNING *', ['1']);
    });

    it('should return 400 if service is in use', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ count: '1' }] }); 

      const response = await request(app).delete('/services/1');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Service is in use in certificates. Deletion is not allowed. You can change the status to 'inactive'.");
    });

    it('should return 404 if service is not found', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ count: '0' }] }) 
        .mockResolvedValueOnce({ rows: [] }); 

      const response = await request(app).delete('/services/999');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Service not found.');
    });
  });
});