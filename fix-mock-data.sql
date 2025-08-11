-- Update the mock video IDs with real ones from your channel

UPDATE youtube_videos 
SET video_id = 'nBQKMPWrUgc', 
    thumbnail_url = 'https://img.youtube.com/vi/nBQKMPWrUgc/hqdefault.jpg'
WHERE video_id = 'nBQKMPWrUgc'; -- This one might already be correct

UPDATE youtube_videos 
SET video_id = 'F7uXaD11EfI', 
    title = 'Vertriebsgeheimnis: Warum Fachwissen der Schlüssel zum Erfolg ist',
    thumbnail_url = 'https://img.youtube.com/vi/F7uXaD11EfI/hqdefault.jpg'
WHERE video_id = 'dQw4w9WgXcQ'; -- Replace Rick Astley

UPDATE youtube_videos 
SET video_id = '6hhQm1YGykM', 
    title = 'Verstehe den Kunden - Warum Fachwissen in der Finanzbranche überlebenswichtig ist',
    thumbnail_url = 'https://img.youtube.com/vi/6hhQm1YGykM/hqdefault.jpg'
WHERE video_id = 'jNQXAC9IVRw'; -- Replace the third mock video