# Prompt untuk Google Stitch — Tax-Ready Payroll Landing Page

> Gunakan prompt-prompt ini di [stitch.withgoogle.com](https://stitch.withgoogle.com) untuk generate desain landing page. Setelah puas dengan hasilnya, ekspor DESIGN.md atau kode HTML/CSS dari Stitch, lalu adaptasi ke React project kita.

---

## Prompt 1: Hero Section

```
Design a SaaS hero section for an Indonesian payroll tax compliance app called "Tax-Ready Payroll". 

Style: Clean white canvas background, minimal, no gradients. Single emerald green accent color (#3ecf8e) used only for the primary CTA button. Text color near-black (#171717). Font: Inter weight 500 for headline with tight letter-spacing.

Content:
- Headline: "Penggajian UMKM yang Siap Coretax"
- Subheadline: "Hitung PPh 21, BPJS, dan generate laporan siap upload ke DJP — tanpa takut salah hitung."
- Primary CTA button: "Daftar Gratis" (emerald green background, near-black text, NOT white text, rounded 6px)
- Secondary link: "Sudah punya akun? Masuk"
- Small floating badge above headline: "✨ Gratis untuk 3 Beta Tester Pertama"

Layout: Centered text, generous whitespace (96px top/bottom padding), max-width 720px for text content. No hero image, no illustration, no gradient background. The white space IS the design.

Button style: 6px border-radius (square-ish, never pill-shaped), padding 12px 24px.
```

---

## Prompt 2: Features Section (3 Cards)

```
Design a 3-column feature card section for a payroll SaaS product.

Style: White background, cards with 1px light gray border (#dfdfdf), 12px border-radius, 32px internal padding. On hover: subtle lift with soft shadow. No colored backgrounds on cards.

Cards content:
1. Icon: Calculator | Title: "Kalkulator PPh 21 TER Otomatis" | Description: "Skema TER 2026 dengan kategori A/B/C berdasarkan PP 58/2023. Tidak perlu hitung manual lagi."
2. Icon: Shield | Title: "100% Kompatibel Coretax DJP" | Description: "Generate CSV/XML siap upload + Bukti Potong BPA1 dalam format resmi pengganti 1721-A1."
3. Icon: Lock | Title: "Keamanan Standar UU PDP" | Description: "Enkripsi AES-256 untuk NIK & gaji, RBAC 3-tier, dan audit trail immutable 5 tahun."

Section heading: "Fitur Utama" centered above cards, with subtitle "Semua yang UMKM butuhkan untuk penggajian yang patuh pajak."

Typography: Card titles 18px weight 500, descriptions 16px weight 400 color #707070. Section heading 36px weight 500 with -0.72px letter-spacing.

Layout: 3 cards in a row on desktop, stack vertically on mobile. Max container width 1200px centered.
```

---

## Prompt 3: How It Works (3 Steps)

```
Design a "How It Works" section with 3 numbered steps for a payroll app.

Style: Light off-white background (#fafafa) to differentiate from white sections above. Steps displayed vertically with numbered circles on the left.

Steps:
1. "Input data karyawan dengan validasi NIK 16 digit otomatis"
2. "Klik Proses Penggajian — selesai dalam hitungan detik untuk 50 karyawan"
3. "Download laporan Coretax & BPA1, upload langsung ke portal DJP"

Number circles: 32px diameter, emerald green (#3ecf8e) background, near-black (#171717) text, weight 500.

Section heading: "Cara Kerja" with subtitle "Tiga langkah sederhana menuju penggajian yang patuh pajak."

Typography: Step text 16px weight 400 color #171717. Generous spacing between steps (24px gap).
```

---

## Prompt 4: Pricing Section (Single Card, Dark)

```
Design a single pricing card for a SaaS product in beta phase.

Style: The card uses a dark background (#1c1c1c) with white text, creating contrast against the white page. 12px border-radius. Subtle spotlight/glow effect on hover (emerald green at 10% opacity radial gradient following cursor).

Card content:
- Title: "Gratis Selama Beta" (white, 28px, weight 500)
- Subtitle: "Tanpa kartu kredit. Tanpa batas waktu beta." (gray #9a9a9a, 14px)
- Feature list with green checkmarks (#3ecf8e):
  • Max 50 karyawan aktif
  • PPh 21 TER otomatis (PP 58/2023)
  • BPJS Kesehatan & Ketenagakerjaan
  • Ekspor CSV/XML format Coretax
  • Generate BPA1 PDF per karyawan
  • Enkripsi AES-256 & Audit Trail
- CTA button at bottom: "Daftar Sekarang" (emerald green, near-black text, full width, 6px radius)

Layout: Single card centered, max-width 400px. Page background remains white.
```

---

## Prompt 5: Social Proof / Trust Section

```
Design a trust/social proof section for a B2B SaaS targeting Indonesian SMEs (UMKM).

Style: White background, minimal. No photos of people.

Content:
- Heading: "Dipercaya oleh UMKM Indonesia"
- 3 metric cards in a row:
  • "50" with label "Karyawan per perusahaan"
  • "< 30 detik" with label "Proses penggajian batch"
  • "372" with label "Unit test untuk akurasi"
- Below metrics: A single testimonial quote (placeholder):
  "Sebelumnya kami pakai Excel dan selalu takut salah hitung PPh 21. Sekarang tinggal klik dan laporan langsung siap upload ke Coretax."
  — Pemilik Klinik, Jakarta

Typography: Metric numbers 48px weight 500, labels 14px color #707070. Quote in italic 16px color #707070.

Layout: Metrics in 3 columns, testimonial below centered. Max-width 900px.
```

---

## Prompt 6: Footer

```
Design a minimal footer for a SaaS product.

Style: White background, top border 1px #dfdfdf. Padding 64px top, 24px bottom.

Content:
- Left: "Tax-Ready Payroll © 2026"
- Right: Navigation links "Masuk · Daftar · Kontak"

Typography: 13px weight 400 color #707070. Links color #707070, hover color #171717.

Layout: Flex row, space-between on desktop. Stack centered on mobile.
```

---

## Prompt 7: Full Page (Gabungan Semua Section)

```
Design a complete SaaS landing page for "Tax-Ready Payroll" — an Indonesian payroll tax compliance app for SMEs (UMKM) with 10-50 employees.

Design system:
- Background: Pure white (#ffffff), no gradients, no atmospheric effects
- Primary accent: Emerald green (#3ecf8e) — used ONLY for CTA buttons and small accent dots
- Text: Near-black (#171717) for headings, gray (#707070) for body
- Font: Inter, weight 500 for headings with negative letter-spacing, weight 400 for body
- Buttons: 6px border-radius (square-ish, never pill), near-black text on green (NOT white on green)
- Cards: 1px border #dfdfdf, 12px radius, 32px padding
- Spacing: 8px base unit, 64-96px section padding
- Max container: 1280px centered
- Rule: Only ONE green button per viewport section. Keep emerald scarce.

Sections (top to bottom):
1. Hero: Centered headline "Penggajian UMKM yang Siap Coretax", subheadline about PPh 21/BPJS/Coretax, CTA "Daftar Gratis", floating badge "Gratis untuk Beta Tester"
2. Features: 3 cards (Kalkulator TER, Kompatibel Coretax, Keamanan UU PDP)
3. How It Works: 3 numbered steps on off-white background
4. Pricing: Single dark card (#1c1c1c) with feature list and green checkmarks
5. Trust: 3 metric numbers + testimonial quote
6. Footer: Minimal with copyright and nav links

Responsive: Cards collapse to 1 column on mobile. Headline scales from 64px to 36px. Buttons maintain 36px minimum touch target.
```

---

## Tips Penggunaan di Google Stitch

1. **Mulai dari Prompt 7** (full page) untuk mendapatkan gambaran keseluruhan
2. **Iterate per section** menggunakan Prompt 1-6 jika ada bagian yang kurang pas
3. **Ekspor sebagai DESIGN.md** dari Stitch → bandingkan dengan `DESIGN.md` kita yang sudah ada
4. **Ekspor kode HTML/CSS** → adaptasi ke React components di `src/features/landing/`
5. **Jangan lupa aturan utama**: near-black text on green button, bukan white on green!

---

## Setelah Generate di Stitch

Kalau sudah puas dengan desain di Stitch:
1. Screenshot hasilnya untuk referensi visual
2. Ekspor kode (HTML/CSS atau React jika tersedia)
3. Bawa kembali ke Kiro — saya akan bantu adaptasi ke komponen React + Framer Motion yang sudah ada di `src/features/landing/`
