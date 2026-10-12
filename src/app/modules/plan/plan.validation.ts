import * as z from 'zod';

export const createPlanSchema = z.object({
  // Define fields
  name: z.string(),
});

export const PlanSchemaValidation = {
createPlanSchema
};
  