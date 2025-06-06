const request = require('supertest');
const app = require('../server'); 
const pool = require('../db');

jest.mock('../db', () => ({
  query: jest.fn(),
}));

describe('Salary API', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /salary', () => {
    it('should return 400 if date range is not provided', async () => {
      const response = await request(app).get('/salary').query({
        startDate: '2025-06-01',
        endDate: '2025-06-30',
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('error_system_id_required');
    });

    it('should return 400 if system_id is not provided', async () => {
      const response = await request(app).get('/salary').query({
        system_id: 'd2816ac4-6049-4d25-909c-dc7170b40bd6',
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('error_dates_required');
    });

    it('should return 400 if startDate is greater than endDate', async () => {
      const response = await request(app).get('/salary').query({
        system_id: 'd2816ac4-6049-4d25-909c-dc7170b40bd6',
        startDate: '2025-06-30',
        endDate: '2025-06-01',
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid date range. The start date must be before the end date.');
    });

    it('should return 200 if all parameters are valid', async () => {
      const mockRecords = [
        { record_id: "1", payment_amount: "1000", created_at: '2025-06-01', system_id: 'd2816ac4-6049-4d25-909c-dc7170b40bd6' },
        { record_id: "2", payment_amount: "1500", created_at: '2025-06-02', system_id: 'd2816ac4-6049-4d25-909c-dc7170b40bd6' },
      ];

      pool.query.mockResolvedValueOnce({ rows: mockRecords });

      const response = await request(app).get('/salary').query({
        system_id: 'd2816ac4-6049-4d25-909c-dc7170b40bd6',
        startDate: '2025-06-01',
        endDate: '2025-06-30',
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockRecords);
      expect(pool.query).toHaveBeenCalledWith(
    expect.stringContaining('SELECT * FROM salary_records'),
    ['d2816ac4-6049-4d25-909c-dc7170b40bd6', '2025-06-01', '2025-06-30']
  );
    });
  });

  describe('GET /salary/report', () => {
    it('should return 400 if user_id is not provided', async () => {
      const response = await request(app).get('/salary/report').query({
        startDate: '2025-06-01',
        endDate: '2025-06-30',
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('User ID is required.');
    });

    it('should return 400 if date range is not provided', async () => {
      const response = await request(app).get('/salary/report').query({
        user_id: "1",
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Start date and end date are required.');
    });

    it('should return 400 if startDate is greater than endDate', async () => {
      const response = await request(app).get('/salary/report').query({
        user_id: "1",
        startDate: '2025-06-30',
        endDate: '2025-06-01',
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid date range. The start date must be before the end date.');
    });

    it('should return 200 if all parameters are valid', async () => {
      const mockReport = [
        {
          record_id: "1",
          payment_amount: 1000,
          event_id: "1",
          event_date: '2025-06-01',
          event_name: 'Yoga Class',
          start_time: '10:00',
          end_time: '11:00',
          client_id: "1",
          client_surname: 'Doe',
          client_name: 'John',
          certificate_id: "1",
          service_name: 'Yoga Training',
          user_id: "1",
        },
      ];

      pool.query.mockResolvedValueOnce({ rows: mockReport });

      const response = await request(app).get('/salary/report').query({
        user_id: "1",
        startDate: '2025-06-01',
        endDate: '2025-06-30',
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockReport);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        ["1", '2025-06-01', '2025-06-30']
      );
    });
  });
});