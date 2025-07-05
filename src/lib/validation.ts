import { z } from 'zod';

// Episode validation schema
export const episodeSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  season: z.number().min(1, 'Season must be at least 1').max(100, 'Season must be less than 100'),
  episode_number: z.number().min(1, 'Episode number must be at least 1').max(1000, 'Episode number must be less than 1000'),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  content: z.string().max(10000, 'Content must be less than 10000 characters').optional(),
  status: z.enum(['draft', 'published', 'scheduled', 'archived']),
  series: z.enum(['wtf', 'finance_transformers', 'cfo_memo']).default('wtf'),
  publish_date: z.string().optional(),
  duration: z.string().optional(),
  image_url: z.string().url('Invalid image URL').optional().or(z.literal('')),
  audio_url: z.string().url('Invalid audio URL').optional().or(z.literal('')),
});

// Show note validation schema
export const showNoteSchema = z.object({
  timestamp: z.string().min(1, 'Timestamp is required'),
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  content: z.string().max(500, 'Content must be less than 500 characters').optional(),
});

// Guest validation schema
export const guestSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  bio: z.string().max(1000, 'Bio must be less than 1000 characters').optional(),
  image_url: z.string().url('Invalid image URL').optional().or(z.literal('')),
});

// Platform link validation schema
export const platformLinkSchema = z.object({
  platform_name: z.string().min(1, 'Platform name is required').max(50, 'Platform name must be less than 50 characters'),
  platform_url: z.string().url('Invalid platform URL'),
});

export type EpisodeFormData = z.infer<typeof episodeSchema>;
export type ShowNoteFormData = z.infer<typeof showNoteSchema>;
export type GuestFormData = z.infer<typeof guestSchema>;
export type PlatformLinkFormData = z.infer<typeof platformLinkSchema>;