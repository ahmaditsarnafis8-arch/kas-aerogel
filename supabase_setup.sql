-- ============================================================
-- SETUP SUPABASE STORAGE & DATABASE KAS AEROGEL 2026
-- Jalankan query ini di SQL Editor Dashboard Supabase Anda:
-- https://supabase.com/dashboard/project/mlnizfwyssooiuuvbeqz/sql
-- ============================================================

-- 1. Tambahkan kolom proof_url & proof_note pada tabel weekly_payments
ALTER TABLE weekly_payments ADD COLUMN IF NOT EXISTS proof_url TEXT;
ALTER TABLE weekly_payments ADD COLUMN IF NOT EXISTS proof_note TEXT;

-- 2. Buat Bucket Storage 'bukti-transfer' (Public) untuk file foto bukti terkompresi
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'bukti-transfer',
  'bukti-transfer',
  true,
  5242880, -- limit 5 MB per file
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE 
SET public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- 3. Policy RLS Storage: Izinkan akses baca publik untuk bukti transfer
DROP POLICY IF EXISTS "Public Read Bukti Transfer" ON storage.objects;
CREATE POLICY "Public Read Bukti Transfer" ON storage.objects
FOR SELECT USING (bucket_id = 'bukti-transfer');

-- 4. Policy RLS Storage: Izinkan mahasiswa mengunggah foto bukti transfer
DROP POLICY IF EXISTS "Allow Upload Bukti Transfer" ON storage.objects;
CREATE POLICY "Allow Upload Bukti Transfer" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'bukti-transfer');

-- 5. Policy RLS Storage: Izinkan Bendahara menghapus foto saat status ditolak
DROP POLICY IF EXISTS "Allow Delete Bukti Transfer" ON storage.objects;
CREATE POLICY "Allow Delete Bukti Transfer" ON storage.objects
FOR DELETE USING (bucket_id = 'bukti-transfer');
