-- Fix video classifications - mark short videos as shorts and replace Rick Astley

-- 1. Replace Rick Astley (dQw4w9WgXcQ) with a real video that doesn't exist yet
UPDATE youtube_videos 
SET 
  video_id = 'newvideo_001', -- We'll replace this with a real ID that doesn't conflict
  title = 'Finance Transformation Kurz erklärt',
  description = 'Schnelle Einführung in die Finanztransformation'
WHERE video_id = 'dQw4w9WgXcQ';

-- 2. Mark videos that are actually shorts as shorts (duration under 1:30)
UPDATE youtube_videos 
SET is_short = true 
WHERE video_id IN (
  'RqGNGqrTyAk',     -- 'Überall nur noch KI... #AI #accounting' (0:53)
  '5KvfMznF4sc',     -- 'Erwartungshaltung vom CFO einfangen' (0:19) 
  'F7uXaD11EfI',     -- 'Vertriebsgeheimnis...' (1:06)
  '6hhQm1YGykM',     -- 'verstehe den kunden...' (0:56)
  'b5ae_G42B5I',     -- 'Funny World of Accountants' (0:41)
  '7fuRY1WMFm4'      -- 'Bürgertelefon & Bürokratiewahnsinn' (1:10)
);

-- 3. Update thumbnail URLs to use the more reliable format
UPDATE youtube_videos 
SET thumbnail_url = 'https://img.youtube.com/vi/' || video_id || '/mqdefault.jpg'
WHERE thumbnail_url LIKE '%maxresdefault%' OR thumbnail_url IS NULL;

-- Check results
SELECT video_id, title, is_short, duration FROM youtube_videos WHERE is_short = true ORDER BY created_at DESC;