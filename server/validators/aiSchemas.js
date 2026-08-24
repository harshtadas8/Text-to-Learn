import { z } from 'zod';

export const CourseSchema = z.object({
  courseTitle: z.string(),
  level: z.string(),
  description: z.string(),
  modules: z.array(
    z.object({
      moduleIndex: z.number(),
      moduleTitle: z.string(),
      learningObjective: z.string(),
      lessons: z.array(
        z.object({
          lessonIndex: z.number(),
          title: z.string()
        })
      ),
      resources: z.object({
        videos: z.array(z.string()),
        blogs: z.array(z.string())
      })
    })
  )
});

export const QuizSchema = z.object({
  questions: z.array(z.object({
    question: z.string(),
    options: z.array(z.string()).length(4),
    correctAnswer: z.string(),
    explanation: z.string()
  }))
});

export const DiagnosticQuizSchema = QuizSchema;

export const RemedialLessonSchema = z.object({
  title: z.string(),
  content: z.array(z.object({
    type: z.enum(['paragraph', 'heading', 'bullet_list']),
    text: z.string().optional(),
    items: z.array(z.string()).optional()
  })),
  quiz: QuizSchema.optional()
});

export const FlashcardSchema = z.object({
  cards: z.array(z.object({
    front: z.string(),
    back: z.string()
  }))
});

export const TeachBackEvaluationSchema = z.object({
  score: z.number().min(0).max(100),
  whatWasMissed: z.array(z.string()),
  whatWasWrong: z.array(z.string()),
  whatWasGood: z.array(z.string())
});

export const AnalysisSchema = z.object({
  newStrongTopics: z.array(z.string()),
  newWeakTopics: z.array(z.string())
});

export const EvaluatorSchema = z.object({
  isValid: z.boolean(),
  feedback: z.string(),
  fixedCourse: CourseSchema
});
