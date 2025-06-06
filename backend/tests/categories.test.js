const request = require('supertest');
const app = require('../server'); 
const pool = require('../db'); 

jest.mock('../db', () => ({
  query: jest.fn(),
  end: jest.fn(),
}));

describe('Categories API', () => {
  afterEach(() => {
    jest.clearAllMocks(); 
  });

  afterAll(() => {
    pool.end(); 
  });

  describe('GET /categories', () => {
    it('should fetch all categories for a given system_id', async () => {
      const mockCategories = [
        { category_id: 1, name: 'Fitness', status: 'active', system_id: 'd2816ac4-6049-4d25-909c-dc7170b40bd6' },
        { category_id: 2, name: 'Yoga', status: 'inactive', system_id: 'd2816ac4-6049-4d25-909c-dc7170b40bd6' },
      ];

      pool.query.mockResolvedValue({ rows: mockCategories });

      const response = await request(app)
        .get('/categories')
        .query({ system_id: 'd2816ac4-6049-4d25-909c-dc7170b40bd6' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockCategories);
      expect(pool.query).toHaveBeenCalledWith('SELECT * FROM categories WHERE system_id = $1', [
        'd2816ac4-6049-4d25-909c-dc7170b40bd6',
      ]);
    });

    it('should return 400 if system_id is missing', async () => {
      const response = await request(app).get('/categories');
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('error_system_id_required');
    });
  });

  describe('POST /categories', () => {
    it('should add a new category', async () => {
      const newCategory = { name: 'Pilates', status: 'active', system_id: 'd2816ac4-6049-4d25-909c-dc7170b40bd6' };
      const mockResult = { category_id: 3, ...newCategory };

      pool.query.mockResolvedValue({ rows: [mockResult] });

      const response = await request(app).post('/categories').send(newCategory);

      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockResult);
      expect(pool.query).toHaveBeenCalledWith(
        'INSERT INTO categories (name, status, system_id) VALUES ($1, $2, $3::uuid) RETURNING *',
        [newCategory.name, newCategory.status, newCategory.system_id]
      );
    });

    it('should return 400 if validation fails', async () => {
      const invalidCategory = { name: '', status: 'active', system_id: 'd2816ac4-6049-4d25-909c-dc7170b40bd6' };

      const response = await request(app).post('/categories').send(invalidCategory);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Category name is required.');
    });
  });

  describe('PUT /categories/:category_id', () => {
    it('should update an existing category', async () => {
      const updatedCategory = { name: 'Updated Category', status: 'inactive', payment_percentage: 0.5, system_id: 'd2816ac4-6049-4d25-909c-dc7170b40bd6' };
      const mockResult = { category_id: 1, ...updatedCategory };

      pool.query.mockResolvedValue({ rows: [mockResult] });

      const response = await request(app).put('/categories/1').send(updatedCategory);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResult);
      expect(pool.query).toHaveBeenCalledWith(
        'UPDATE categories SET name = $1, status = $2, payment_percentage = $3 WHERE category_id = $4 RETURNING *',
        [updatedCategory.name, updatedCategory.status, updatedCategory.payment_percentage, '1']
      );
    });

    it('should return 404 if category is not found', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const response = await request(app).put('/categories/999').send({
        name: 'Nonexistent Category',
        status: 'active',
        payment_percentage: 0.2,
        system_id: 'd2816ac4-6049-4d25-909c-dc7170b40bd6'
      });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Category not found.');
    });
  });

  describe('DELETE /categories/:category_id', () => {
    it('should delete a category if it is not in use', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [] }) 
        .mockResolvedValueOnce({ rows: [{ category_id: 1, name: 'Fitness' }] }); 

      const response = await request(app).delete('/categories/1');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Category deleted successfully.');
      expect(pool.query).toHaveBeenCalledWith('SELECT 1 FROM services WHERE category_id = $1 LIMIT 1', ['1']);
      expect(pool.query).toHaveBeenCalledWith('DELETE FROM categories WHERE category_id = $1 RETURNING *', ['1']);
    });

    it('should return 400 if category is in use', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ category_id: 1 }] });

      const response = await request(app).delete('/categories/1');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Category cannot be deleted because it is used in services.');
    });

    it('should return 404 if category is not found', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [] }) 
        .mockResolvedValueOnce({ rows: [] }); 

      const response = await request(app).delete('/categories/999');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Category not found.');
    });
  });
});