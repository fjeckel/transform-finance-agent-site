-- Sample SQL to add English translations for episodes
-- This will help test the translation system

-- First, let's see what episodes exist (run this to check your current episodes)
-- SELECT id, title, description FROM episodes WHERE status = 'published' ORDER BY episode_number DESC LIMIT 5;

-- Example: Add English translation for the latest episode
-- Replace the episode_id with actual episode ID from your database
INSERT INTO episodes_translations (
  episode_id,
  language_code,
  title,
  description,
  content,
  summary,
  translation_status,
  translation_method,
  translated_at
) VALUES (
  -- Replace with actual episode ID
  (SELECT id FROM episodes WHERE status = 'published' ORDER BY episode_number DESC LIMIT 1),
  'en',
  'English Title of Latest Episode',
  'This is the English description of the latest episode. It provides insight into finance transformation topics.',
  'This is the full English content of the episode...',
  'English summary of the episode discussing key finance transformation strategies.',
  'approved',
  'manual',
  NOW()
) ON CONFLICT (episode_id, language_code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  content = EXCLUDED.content,
  summary = EXCLUDED.summary,
  translation_status = EXCLUDED.translation_status,
  updated_at = NOW();

-- Add French translation as well
INSERT INTO episodes_translations (
  episode_id,
  language_code,
  title,
  description,
  content,
  summary,
  translation_status,
  translation_method,
  translated_at
) VALUES (
  (SELECT id FROM episodes WHERE status = 'published' ORDER BY episode_number DESC LIMIT 1),
  'fr',
  'Titre français du dernier épisode',
  'Description française de ce dernier épisode sur la transformation financière.',
  'Contenu complet en français de cet épisode...',
  'Résumé français de l\'épisode sur les stratégies de transformation financière.',
  'approved',
  'manual',
  NOW()
) ON CONFLICT (episode_id, language_code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  content = EXCLUDED.content,
  summary = EXCLUDED.summary,
  translation_status = EXCLUDED.translation_status,
  updated_at = NOW();

-- Verify the translations were added
-- SELECT 
--   e.title as original_title,
--   et.language_code,
--   et.title as translated_title,
--   et.description as translated_description,
--   et.translation_status
-- FROM episodes e
-- LEFT JOIN episodes_translations et ON e.id = et.episode_id
-- WHERE e.status = 'published'
-- ORDER BY e.episode_number DESC, et.language_code;