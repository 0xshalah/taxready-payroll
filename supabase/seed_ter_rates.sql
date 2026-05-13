-- ============================================================
-- SEED: Tarif TER PPh 21 (PP 58/2023)
-- ============================================================
-- INSTRUKSI:
-- 1. Jalankan migrasi 001-005 terlebih dahulu
-- 2. Register akun pertama di aplikasi (akan membuat company)
-- 3. Ambil company_id dari tabel companies:
--    SELECT id FROM companies LIMIT 1;
-- 4. Ganti 'YOUR_COMPANY_ID' di bawah dengan UUID yang didapat
-- 5. Jalankan script ini di Supabase SQL Editor
-- ============================================================

-- Ganti UUID ini dengan company_id Anda yang sebenarnya
DO $$
DECLARE
  v_company_id UUID;
BEGIN
  -- Ambil company_id pertama (sesuaikan jika perlu)
  SELECT id INTO v_company_id FROM companies LIMIT 1;
  
  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Tidak ada company ditemukan. Register akun terlebih dahulu.';
  END IF;

  -- Hapus data TER lama jika ada
  DELETE FROM ter_rates WHERE company_id = v_company_id;

  -- ═══════════════════════════════════════════════════════════
  -- KATEGORI A: TK/0, TK/1, K/0
  -- ═══════════════════════════════════════════════════════════
  INSERT INTO ter_rates (company_id, category, lower_bound, upper_bound, rate_percent) VALUES
  (v_company_id, 'A', 0, 5400000, 0),
  (v_company_id, 'A', 5400001, 5650000, 0.25),
  (v_company_id, 'A', 5650001, 5950000, 0.5),
  (v_company_id, 'A', 5950001, 6300000, 0.75),
  (v_company_id, 'A', 6300001, 6750000, 1),
  (v_company_id, 'A', 6750001, 7500000, 1.25),
  (v_company_id, 'A', 7500001, 8550000, 1.5),
  (v_company_id, 'A', 8550001, 9650000, 1.75),
  (v_company_id, 'A', 9650001, 10050000, 2),
  (v_company_id, 'A', 10050001, 10350000, 2.25),
  (v_company_id, 'A', 10350001, 10700000, 2.5),
  (v_company_id, 'A', 10700001, 11050000, 3),
  (v_company_id, 'A', 11050001, 11600000, 3.5),
  (v_company_id, 'A', 11600001, 12500000, 4),
  (v_company_id, 'A', 12500001, 13750000, 5),
  (v_company_id, 'A', 13750001, 15100000, 6),
  (v_company_id, 'A', 15100001, 16950000, 7),
  (v_company_id, 'A', 16950001, 19750000, 8),
  (v_company_id, 'A', 19750001, 24150000, 9),
  (v_company_id, 'A', 24150001, 26450000, 10),
  (v_company_id, 'A', 26450001, 28000000, 11),
  (v_company_id, 'A', 28000001, 30050000, 12),
  (v_company_id, 'A', 30050001, 32400000, 13),
  (v_company_id, 'A', 32400001, 35400000, 14),
  (v_company_id, 'A', 35400001, 39100000, 15),
  (v_company_id, 'A', 39100001, 43850000, 16),
  (v_company_id, 'A', 43850001, 47800000, 17),
  (v_company_id, 'A', 47800001, 51400000, 18),
  (v_company_id, 'A', 51400001, 56300000, 19),
  (v_company_id, 'A', 56300001, 62200000, 20),
  (v_company_id, 'A', 62200001, 68600000, 21),
  (v_company_id, 'A', 68600001, 77500000, 22),
  (v_company_id, 'A', 77500001, 89000000, 23),
  (v_company_id, 'A', 89000001, 103000000, 24),
  (v_company_id, 'A', 103000001, 125000000, 25),
  (v_company_id, 'A', 125000001, 157000000, 26),
  (v_company_id, 'A', 157000001, 206000000, 27),
  (v_company_id, 'A', 206000001, 337000000, 28),
  (v_company_id, 'A', 337000001, 454000000, 29),
  (v_company_id, 'A', 454000001, 550000000, 30),
  (v_company_id, 'A', 550000001, 695000000, 31),
  (v_company_id, 'A', 695000001, 910000000, 32),
  (v_company_id, 'A', 910000001, 1400000000, 33),
  (v_company_id, 'A', 1400000001, 999999999999, 34);

  -- ═══════════════════════════════════════════════════════════
  -- KATEGORI B: TK/2, TK/3, K/1, K/2
  -- ═══════════════════════════════════════════════════════════
  INSERT INTO ter_rates (company_id, category, lower_bound, upper_bound, rate_percent) VALUES
  (v_company_id, 'B', 0, 6200000, 0),
  (v_company_id, 'B', 6200001, 6500000, 0.25),
  (v_company_id, 'B', 6500001, 6850000, 0.5),
  (v_company_id, 'B', 6850001, 7300000, 0.75),
  (v_company_id, 'B', 7300001, 9200000, 1),
  (v_company_id, 'B', 9200001, 10750000, 1.5),
  (v_company_id, 'B', 10750001, 11250000, 2),
  (v_company_id, 'B', 11250001, 11600000, 2.5),
  (v_company_id, 'B', 11600001, 12600000, 3),
  (v_company_id, 'B', 12600001, 13600000, 4),
  (v_company_id, 'B', 13600001, 14950000, 5),
  (v_company_id, 'B', 14950001, 16400000, 6),
  (v_company_id, 'B', 16400001, 18450000, 7),
  (v_company_id, 'B', 18450001, 21850000, 8),
  (v_company_id, 'B', 21850001, 26000000, 9),
  (v_company_id, 'B', 26000001, 27700000, 10),
  (v_company_id, 'B', 27700001, 29350000, 11),
  (v_company_id, 'B', 29350001, 31450000, 12),
  (v_company_id, 'B', 31450001, 33950000, 13),
  (v_company_id, 'B', 33950001, 37100000, 14),
  (v_company_id, 'B', 37100001, 41100000, 15),
  (v_company_id, 'B', 41100001, 45800000, 16),
  (v_company_id, 'B', 45800001, 49500000, 17),
  (v_company_id, 'B', 49500001, 53800000, 18),
  (v_company_id, 'B', 53800001, 58500000, 19),
  (v_company_id, 'B', 58500001, 64000000, 20),
  (v_company_id, 'B', 64000001, 71000000, 21),
  (v_company_id, 'B', 71000001, 80000000, 22),
  (v_company_id, 'B', 80000001, 93000000, 23),
  (v_company_id, 'B', 93000001, 109000000, 24),
  (v_company_id, 'B', 109000001, 129000000, 25),
  (v_company_id, 'B', 129000001, 163000000, 26),
  (v_company_id, 'B', 163000001, 211000000, 27),
  (v_company_id, 'B', 211000001, 374000000, 28),
  (v_company_id, 'B', 374000001, 459000000, 29),
  (v_company_id, 'B', 459000001, 555000000, 30),
  (v_company_id, 'B', 555000001, 704000000, 31),
  (v_company_id, 'B', 704000001, 957000000, 32),
  (v_company_id, 'B', 957000001, 1405000000, 33),
  (v_company_id, 'B', 1405000001, 999999999999, 34);

  -- ═══════════════════════════════════════════════════════════
  -- KATEGORI C: K/3
  -- ═══════════════════════════════════════════════════════════
  INSERT INTO ter_rates (company_id, category, lower_bound, upper_bound, rate_percent) VALUES
  (v_company_id, 'C', 0, 6600000, 0),
  (v_company_id, 'C', 6600001, 6950000, 0.25),
  (v_company_id, 'C', 6950001, 7350000, 0.5),
  (v_company_id, 'C', 7350001, 7800000, 0.75),
  (v_company_id, 'C', 7800001, 8850000, 1),
  (v_company_id, 'C', 8850001, 9800000, 1.25),
  (v_company_id, 'C', 9800001, 10950000, 1.5),
  (v_company_id, 'C', 10950001, 11200000, 1.75),
  (v_company_id, 'C', 11200001, 12050000, 2),
  (v_company_id, 'C', 12050001, 12950000, 3),
  (v_company_id, 'C', 12950001, 14150000, 4),
  (v_company_id, 'C', 14150001, 15550000, 5),
  (v_company_id, 'C', 15550001, 17050000, 6),
  (v_company_id, 'C', 17050001, 19500000, 7),
  (v_company_id, 'C', 19500001, 22700000, 8),
  (v_company_id, 'C', 22700001, 26600000, 9),
  (v_company_id, 'C', 26600001, 28100000, 10),
  (v_company_id, 'C', 28100001, 30100000, 11),
  (v_company_id, 'C', 30100001, 32600000, 12),
  (v_company_id, 'C', 32600001, 35400000, 13),
  (v_company_id, 'C', 35400001, 38900000, 14),
  (v_company_id, 'C', 38900001, 43000000, 15),
  (v_company_id, 'C', 43000001, 47400000, 16),
  (v_company_id, 'C', 47400001, 51200000, 17),
  (v_company_id, 'C', 51200001, 55800000, 18),
  (v_company_id, 'C', 55800001, 60400000, 19),
  (v_company_id, 'C', 60400001, 66700000, 20),
  (v_company_id, 'C', 66700001, 74500000, 21),
  (v_company_id, 'C', 74500001, 83200000, 22),
  (v_company_id, 'C', 83200001, 95600000, 23),
  (v_company_id, 'C', 95600001, 110000000, 24),
  (v_company_id, 'C', 110000001, 134000000, 25),
  (v_company_id, 'C', 134000001, 169000000, 26),
  (v_company_id, 'C', 169000001, 221000000, 27),
  (v_company_id, 'C', 221000001, 390000000, 28),
  (v_company_id, 'C', 390000001, 463000000, 29),
  (v_company_id, 'C', 463000001, 561000000, 30),
  (v_company_id, 'C', 561000001, 709000000, 31),
  (v_company_id, 'C', 709000001, 965000000, 32),
  (v_company_id, 'C', 965000001, 1419000000, 33),
  (v_company_id, 'C', 1419000001, 999999999999, 34);

  RAISE NOTICE 'Seed TER berhasil! Total: 125 baris (44 Kat.A + 40 Kat.B + 41 Kat.C) untuk company_id: %', v_company_id;
END $$;
