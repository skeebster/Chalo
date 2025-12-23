import { z } from 'zod';
import { insertPlaceSchema, insertScreenshotSchema, insertUserPreferencesSchema, insertWeekendPlanSchema, places, screenshots, userPreferences, weekendPlans } from './schema';

// Shared error schemas
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  places: {
    list: {
      method: 'GET' as const,
      path: '/api/places',
      input: z.object({
        search: z.string().optional(),
        category: z.string().optional(),
        sort: z.enum(['created_at', 'distance', 'rating']).optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof places.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/places/:id',
      responses: {
        200: z.custom<typeof places.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/places',
      input: insertPlaceSchema,
      responses: {
        201: z.custom<typeof places.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/places/:id',
      input: insertPlaceSchema.partial(),
      responses: {
        200: z.custom<typeof places.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/places/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
    import: {
      method: 'POST' as const,
      path: '/api/places/import',
      responses: {
        200: z.object({ success: z.boolean(), count: z.number() }),
      },
    },
    extract: {
      method: 'POST' as const,
      path: '/api/places/extract',
      input: z.object({
        imageUrl: z.string().optional(),
        imageData: z.string().optional(), // Base64
        fileType: z.enum(['image', 'pdf']).default('image'),
      }),
      responses: {
        200: z.object({ 
          success: z.boolean(), 
          places: z.array(z.custom<Partial<typeof places.$inferSelect>>()) 
        }),
      },
    }
  },
  plans: {
    list: {
      method: 'GET' as const,
      path: '/api/plans',
      responses: {
        200: z.array(z.custom<typeof weekendPlans.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/plans',
      input: insertWeekendPlanSchema,
      responses: {
        201: z.custom<typeof weekendPlans.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/plans/:id',
      input: insertWeekendPlanSchema.partial(),
      responses: {
        200: z.custom<typeof weekendPlans.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/plans/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
    share: {
      method: 'POST' as const,
      path: '/api/plans/:id/share',
      responses: {
        200: z.object({ shareCode: z.string(), shareUrl: z.string() }),
        404: errorSchemas.notFound,
      },
    },
    getShared: {
      method: 'GET' as const,
      path: '/api/shared/:shareCode',
      responses: {
        200: z.object({
          plan: z.custom<typeof weekendPlans.$inferSelect>(),
          places: z.array(z.custom<typeof places.$inferSelect>()),
        }),
        404: errorSchemas.notFound,
      },
    },
  },
  preferences: {
    get: {
      method: 'GET' as const,
      path: '/api/preferences',
      responses: {
        200: z.custom<typeof userPreferences.$inferSelect>(), // Assuming single user/preference for MVP
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/preferences',
      input: insertUserPreferencesSchema,
      responses: {
        200: z.custom<typeof userPreferences.$inferSelect>(),
      },
    },
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
