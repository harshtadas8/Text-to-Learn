import { jest } from '@jest/globals';

// 1. Mock Mongoose so we don't connect to a real DB
jest.unstable_mockModule('mongoose', () => ({
  default: {
    connect: jest.fn().mockResolvedValue(true),
    connection: {
      on: jest.fn(),
    },
    Schema: class {
      constructor() {}
      index() {} // mock .index()
      static Types = {
        ObjectId: String
      };
    },
    model: jest.fn().mockReturnValue({
      findOne: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([])
        })
      })
    }),
  }
}));

// 2. Mock ioredis so we don't connect to real Redis
jest.unstable_mockModule('ioredis', () => {
  return {
    default: class Redis {
      on = jest.fn();
      get = jest.fn();
      set = jest.fn();
      setex = jest.fn();
      del = jest.fn();
      incr = jest.fn();
      expire = jest.fn();
      keys = jest.fn().mockResolvedValue([]);
    }
  };
});

// 3. Mock BullMQ
jest.unstable_mockModule('bullmq', () => ({
  Queue: class {
    add = jest.fn().mockResolvedValue({ id: 'mock-job-id' });
    on = jest.fn();
  },
  Worker: class {
    on = jest.fn();
  }
}));

// 4. Mock requireAuth middleware to bypass Auth0
jest.unstable_mockModule('../middlewares/requireAuth.js', () => ({
  default: (req, res, next) => {
    req.auth = { payload: { sub: 'auth0|test-user' } };
    next();
  }
}));


// Mock Gemini Service to not make real API calls
jest.unstable_mockModule('../services/ai/gemini.service.js', () => ({
  generateDiagnosticQuizWithGemini: jest.fn().mockResolvedValue({
    questions: [
      { question: "Q1", options: ["A", "B", "C", "D"], correctAnswer: "A", explanation: "Ex1" },
      { question: "Q2", options: ["A", "B", "C", "D"], correctAnswer: "A", explanation: "Ex2" },
      { question: "Q3", options: ["A", "B", "C", "D"], correctAnswer: "A", explanation: "Ex3" }
    ]
  }),
  generateCourseWithGemini: jest.fn().mockResolvedValue({
    modules: [
      {
        title: "Test Module",
        lessons: [
          {
            title: "Test Lesson",
            content: [{ type: "paragraph", text: "Hello World" }]
          }
        ]
      }
    ]
  })
}));
