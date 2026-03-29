import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/Erick Vega Blog' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string().optional(),
    draft: z.boolean().optional().default(false),
  }),
});

const updates = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/Erick Vega Updates Posts' }),
  schema: z.object({
    date: z.coerce.date(),
    draft: z.boolean().optional().default(false),
    images: z.array(z.string()).optional(),
  }),
});

export const collections = { blog, updates };
