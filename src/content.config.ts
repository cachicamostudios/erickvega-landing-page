import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string().optional(),
    draft: z.boolean().optional().default(false),
  }),
});

const updates = defineCollection({
  type: 'content',
  schema: z.object({
    date: z.coerce.date(),
    draft: z.boolean().optional().default(false),
    images: z.array(z.string()).optional(),
  }),
});

export const collections = { blog, updates };
