import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import '../tests/setup.js'; // Ensure mocks load first

const app = express();
app.use(express.json());

// We must dynamically import the routes AFTER setup.js has mocked dependencies
let courseRoutes;
beforeAll(async () => {
  courseRoutes = (await import('../routes/courseRoutes.js')).default;
  app.use('/api/courses', courseRoutes);
});

describe('Course Routes', () => {
  
  test('POST /api/courses/diagnostic-quiz - should return diagnostic quiz from Gemini', async () => {
    const res = await request(app)
      .post('/api/courses/diagnostic-quiz')
      .send({ topic: 'JavaScript' });
      
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('questions');
    expect(res.body.questions.length).toBe(3);
    expect(res.body.questions[0].question).toBe('Q1');
  });

  test('POST /api/courses/generate - should generate course and save to DB', async () => {
    // Mock the User.findOne and Course.create for this specific test
    const { default: mongoose } = await import('mongoose');
    const mockUserFindOne = jest.fn().mockResolvedValue({ _id: 'user123', auth0Id: 'auth0|test-user' });
    const mockCourseCreate = jest.fn().mockResolvedValue({ _id: 'course123', topic: 'JavaScript' });
    
    mongoose.model.mockImplementation((modelName) => {
      if (modelName === 'User') return { findOne: mockUserFindOne };
      if (modelName === 'Course') return { create: mockCourseCreate };
      return {};
    });

    const res = await request(app)
      .post('/api/courses/generate')
      .send({
        topic: 'JavaScript',
        level: 'Beginner',
        language: 'English'
      });
      
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });
});
