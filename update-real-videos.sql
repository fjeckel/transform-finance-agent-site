-- Update YouTube videos with real data from @WTFFinanceTransformers channel

-- Replace Rick Astley (dQw4w9WgXcQ) with real video
UPDATE youtube_videos 
SET 
  video_id = 'F7uXaD11EfI',
  title = 'Vertriebsgeheimnis: Warum Fachwissen der Schlüssel zum Erfolg ist',
  description = 'Warum Fachwissen im Vertrieb entscheidend ist',
  thumbnail_url = 'https://img.youtube.com/vi/F7uXaD11EfI/mqdefault.jpg',
  duration = '1:06',
  view_count = 27,
  published_at = '2025-03-14T20:47:17Z',
  is_short = true
WHERE video_id = 'dQw4w9WgXcQ';

-- Replace the third mock video (jNQXAC9IVRw) with another real one
UPDATE youtube_videos 
SET 
  video_id = '6hhQm1YGykM',
  title = 'Verstehe den Kunden - Warum Fachwissen in der Finanzbranche überlebenswichtig ist',
  description = 'Fachwissen als Erfolgsfaktor im Finanzbereich',
  thumbnail_url = 'https://img.youtube.com/vi/6hhQm1YGykM/mqdefault.jpg',
  duration = '0:56',
  view_count = 28,
  published_at = '2025-03-13T21:13:25Z',
  is_short = true
WHERE video_id = 'jNQXAC9IVRw';

-- Add a few more real short videos
INSERT INTO youtube_videos (video_id, title, description, thumbnail_url, duration, view_count, published_at, is_short, channel_id, tags, category_id)
VALUES 
  ('b5ae_G42B5I', 'Funny World of Accountants', 'Humor aus der Welt der Buchhaltung', 'https://img.youtube.com/vi/b5ae_G42B5I/mqdefault.jpg', '0:41', 8, '2025-03-13T21:12:11Z', true, 'UC2sXuBElJDyzxKv3J8kmyng', '[]', '24'),
  ('RqGNGqrTyAk', 'Überall nur noch KI... #AI #accounting', 'KI im Accounting Bereich', 'https://img.youtube.com/vi/RqGNGqrTyAk/mqdefault.jpg', '0:53', 12, '2025-03-11T20:01:51Z', true, 'UC2sXuBElJDyzxKv3J8kmyng', '["AI", "accounting"]', '24'),
  ('5KvfMznF4sc', 'Erwartungshaltung vom CFO einfangen', 'CFO Erwartungsmanagement', 'https://img.youtube.com/vi/5KvfMznF4sc/mqdefault.jpg', '0:19', 1, '2025-03-17T20:58:26Z', true, 'UC2sXuBElJDyzxKv3J8kmyng', '["CFO", "management"]', '24')
ON CONFLICT (video_id) DO NOTHING;