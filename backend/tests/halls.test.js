const request = require('supertest');
const app = require('../server'); 
const pool = require('../db'); 

jest.mock('../db', () => ({
  query: jest.fn(),
  end: jest.fn(),
}));

describe('Halls API', () => {
  afterEach(() => {
    jest.clearAllMocks(); 
  });

  afterAll(() => {
    jest.clearAllMocks();
    pool.end();
  });

  describe('GET /halls', () => {
    it('should fetch all halls for a given system_id', async () => {
      const mockHalls = [
        { hall_id: 1, name: 'Main Hall', status: 'active', system_id: 'd2816ac4-6049-4d25-909c-dc7170b40bd6' },
        { hall_id: 2, name: 'Secondary Hall', status: 'inactive', system_id: 'd2816ac4-6049-4d25-909c-dc7170b40bd6' },
      ];

      pool.query.mockResolvedValue({ rows: mockHalls });

      const response = await request(app)
        .get('/halls')
        .query({ system_id: 'd2816ac4-6049-4d25-909c-dc7170b40bd6' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockHalls);
      expect(pool.query).toHaveBeenCalledWith('SELECT * FROM halls WHERE system_id = $1', [
        'd2816ac4-6049-4d25-909c-dc7170b40bd6',
      ]);
    });

    it('should return 400 if system_id is missing', async () => {
      const response = await request(app).get('/halls');
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('error_system_id_required');
    });
  });

  describe('POST /halls', () => {
    it('should add a new hall', async () => {
      const newHall = { name: 'New Hall', status: 'active', system_id: 'd2816ac4-6049-4d25-909c-dc7170b40bd6' };
      const mockResult = { hall_id: 3, ...newHall };

      pool.query.mockResolvedValue({ rows: [mockResult] });

      const response = await request(app).post('/halls').send(newHall);

      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockResult);
      expect(pool.query).toHaveBeenCalledWith(
        'INSERT INTO halls (name, status, system_id) VALUES ($1, $2, $3::uuid) RETURNING *',
        [newHall.name, newHall.status, newHall.system_id]
      );
    });

    it('should return 400 if validation fails', async () => {
      const invalidHall = { name: '', status: 'active', system_id: 'd2816ac4-6049-4d25-909c-dc7170b40bd6' };

      const response = await request(app).post('/halls').send(invalidHall);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Hall name is required.');
    });
  });

  describe('PUT /halls/:hall_id', () => {
    it('should update an existing hall', async () => {
      const updatedHall = { name: 'Updated Hall', status: 'inactive', system_id: 'd2816ac4-6049-4d25-909c-dc7170b40bd6' };
      const mockResult = { hall_id: 1, ...updatedHall };

      pool.query.mockResolvedValue({ rows: [mockResult] });

      const response = await request(app).put('/halls/1').send(updatedHall);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResult);
      expect(pool.query).toHaveBeenCalledWith(
        'UPDATE halls SET name = $1, status = $2 WHERE hall_id = $3 RETURNING *',
        [updatedHall.name, updatedHall.status, '1']
      );
    });

    it('should return 404 if hall is not found', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const response = await request(app).put('/halls/999').send({ name: 'Nonexistent Hall', status: 'active', system_id: 'd2816ac4-6049-4d25-909c-dc7170b40bd6' });


      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Hall not found.');
    });
  });

  describe('DELETE /halls/:hall_id', () => {
    it('should delete a hall if it is not in use', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ count: '0' }] }) 
        .mockResolvedValueOnce({ rows: [{ hall_id: 1, name: 'Main Hall' }] }); 

      const response = await request(app).delete('/halls/1');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Hall deleted successfully.');
      expect(pool.query).toHaveBeenCalledWith('SELECT COUNT(*) FROM events WHERE hall_id = $1', ['1']);
      expect(pool.query).toHaveBeenCalledWith('DELETE FROM halls WHERE hall_id = $1 RETURNING *', ['1']);
    });

    it('should return 400 if hall is in use', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ count: '1' }] });

      const response = await request(app).delete('/halls/1');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("The hall is in use in events. Deletion is not allowed. You can change the status to 'inactive'.");
    });

    it('should return 404 if hall is not found', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ count: '0' }] }) 
        .mockResolvedValueOnce({ rows: [] }); 

      const response = await request(app).delete('/halls/999');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Hall not found.');
    });
  });
});