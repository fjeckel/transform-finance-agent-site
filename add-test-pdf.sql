-- Add a test PDF for payment testing
INSERT INTO downloadable_pdfs (
  id,
  title,
  description,
  price,
  currency,
  is_premium,
  file_url,
  image_url,
  created_at,
  updated_at
) VALUES (
  '12345678-1234-1234-1234-123456789012',
  'Test Premium PDF - Payment Integration',
  'This is a test PDF for validating the Stripe payment integration.',
  9.99,
  'EUR',
  true,
  'https://example.com/test-pdf.pdf',
  'https://via.placeholder.com/300x400/13B87B/ffffff?text=Test+PDF',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  updated_at = NOW();