import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import '../tests/setup.js'; 

const app = express();
app.use(express.json());

let srsRoutes;
beforeAll(async () => {
  srsRoutes = (await import('../routes/srsRoutes.js')).default;
  app.use('/api/srs', srsRoutes);
});

describe('SRS Routes', () => {
  test('GET /api/srs/due - should return due flashcards', async () => {
    const { default: mongoose } = await import('mongoose');
    
    mongoose.model().find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([
          { _id: 'card1', front: 'A', back: 'B', dueDate: new Date() }
        ])
      })
    });

    const res = await request(app).get('/api/srs/due');
      
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0]._id).toBe('card1');
  });

  test('POST /api/srs/review - should update flashcard via SM-2', async () => {
    const { default: mongoose } = await import('mongoose');
    const mockSave = jest.fn().mockResolvedValue(true);
    
    mongoose.model().findOne.mockResolvedValue({
      _id: 'card1',
      front: 'A',
      back: 'B',
      repetition: 0,
      interval: 0,
      easeFactor: 2.5,
      save: mockSave
    });

    const res = await request(app)
      .post('/api/srs/review')
      .send({ cardId: 'card1', quality: 4 });
      
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.interval).toBeGreaterThan(0); // Because SM2 algorithm increases it
  });
});
