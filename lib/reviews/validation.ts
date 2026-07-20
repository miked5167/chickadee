import { z } from 'zod'

export const reviewSubmissionSchema = z.object({
  company_id: z.string().uuid('Company identifier is invalid.'),
  rating: z.number().int().min(1, 'Rating must be between 1 and 5.').max(5, 'Rating must be between 1 and 5.'),
  title: z.string().trim().min(1, 'Review title cannot be blank.').max(100, 'Review title is too long.').nullable().optional(),
  review_text: z.string().trim().min(50, 'Review must be at least 50 characters.').max(1000, 'Review must be no more than 1000 characters.'),
  experience_confirmed: z.literal(true, { error: 'You must confirm this review is based on your experience.' }),
})

export const reviewListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  sort: z.enum(['newest', 'highest', 'lowest']).default('newest'),
})

export type ReviewSubmission = z.infer<typeof reviewSubmissionSchema>
