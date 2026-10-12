import * as z from 'zod';

export const createQuizzSchema = z.object({
  // Define fields
  name: z.string(),
});

export const QuizzSchemaValidation = {
createQuizzSchema
};
  