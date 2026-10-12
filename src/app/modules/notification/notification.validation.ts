import * as z from 'zod';

export const createNotificationSchema = z.object({
  // Define fields
  name: z.string(),
});

export const NotificationSchemaValidation = {
createNotificationSchema
};
  