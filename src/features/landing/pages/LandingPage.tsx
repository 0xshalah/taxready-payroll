import { useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Calculator, Shield, Lock, Check, X, ChevronDown, FileDown, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AnimatedText } from "../components/AnimatedText";
import { FloatingBadge } from "../components/FloatingBadge";
import { SpotlightCard } from "../components/SpotlightCard";

/* ─── Hero Section with Product Mockup ──────────────────────────── */

function HeroSection() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-5xl text-center">
        <FloatingBadge className="mb-8">
          🚧 Sedang dalam masa Beta — Gratis & Terbuka
        </FloatingBadge>

        <h1 className="max-w-3xl mx-auto text-5xl font-medium leading-[1.1] tracking-[-1.44px] text-ink md:text-6xl md:tracking-[-1.92px]">
          <AnimatedText text="Penggajian UMKM yang Siap Coretax" />
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-6 max-w-xl mx-auto text-lg leading-relaxed text-ink-mute"
        >
          Hitung PPh 21, BPJS, dan generate laporan siap upload ke DJP — tanpa
          takut salah hitung.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
        >
          <Link to="/register">
            <Button variant="primary-green" size="lg" className="relative">
              <span className="relative z-10">Daftar Gratis</span>
              <motion.span
                className="absolute inset-0 rounded-sm bg-primary"
                animate={{ opacity: [0, 0.3, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                aria-hidden="true"
              />
            </Button>
          </Link>
          <Link to="/login" className="text-sm text-ink-mute underline-offset-4 hover:underline">
            Sudah punya akun? Masuk
          </Link>
        </motion.div>

        {/* Product Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.0, ease: [0.25, 0.4, 0.25, 1] }}
          className="mt-16"
        >
          <div className="relative mx-auto max-w-4xl">
            {/* Browser frame */}
            <div className="rounded-lg border border-hairline bg-canvas shadow-glass overflow-hidden">
              {/* Browser top bar */}
              <div className="flex items-center gap-2 border-b border-hairline bg-canvas-elevated/50 px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-[#ef4444]/60" />
                  <div className="h-3 w-3 rounded-full bg-[#f59e0b]/60" />
                  <div className="h-3 w-3 rounded-full bg-primary/60" />
                </div>
                <div className="flex-1 mx-8">
                  <div className="mx-auto max-w-sm rounded-sm bg-canvas border border-hairline px-3 py-1 text-xs text-ink-mute text-center">
                    localhost:5173/payroll/process
                  </div>
                </div>
              </div>
              {/* Dashboard mockup content */}
              <div className="bg-canvas-card p-6">
                {/* Top summary cards */}
                <div className="grid grid-cols-4 gap-3 mb-6">
                  {[
                    { label: "Karyawan Aktif", value: "32" },
                    { label: "Total Bruto", value: "Rp 248.5 jt" },
                    { label: "Total PPh 21", value: "Rp 12.8 jt" },
                    { label: "Total Gaji Bersih", value: "Rp 198.2 jt" },
                  ].map((card) => (
                    <div key={card.label} className="rounded-md border border-hairline p-3">
                      <p className="text-[10px] text-ink-mute">{card.label}</p>
                      <p className="text-sm font-medium text-ink mt-0.5">{card.value}</p>
                    </div>
                  ))}
                </div>
                {/* Table preview */}
                <div className="rounded-md border border-hairline overflow-hidden">
                  <div className="grid grid-cols-5 gap-0 bg-canvas-elevated/50 px-3 py-2 text-[10px] font-medium text-ink-mute uppercase">
                    <span>Nama</span><span>Bruto</span><span>PPh 21</span><span>BPJS</span><span>Gaji Bersih</span>
                  </div>
                  {[
                    { name: "Budi Santoso", bruto: "8.5 jt", pph: "127 rb", bpjs: "255 rb", net: "8.1 jt" },
                    { name: "Siti Rahayu", bruto: "6.2 jt", pph: "62 rb", bpjs: "186 rb", net: "5.9 jt" },
                    { name: "Ahmad Wijaya", bruto: "10.0 jt", pph: "200 rb", bpjs: "300 rb", net: "9.5 jt" },
                  ].map((row) => (
                    <div key={row.name} className="grid grid-cols-5 gap-0 px-3 py-2 text-[11px] text-ink border-t border-hairline">
                      <span className="font-medium">{row.name}</span>
                      <span className="font-mono">{row.bruto}</span>
                      <span className="font-mono">{row.pph}</span>
                      <span className="font-mono">{row.bpjs}</span>
                      <span className="font-mono font-medium">{row.net}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Floating accent dot */}
            <div className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-primary/20" />
            <div className="absolute -bottom-2 -left-2 h-3 w-3 rounded-full bg-primary/10" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Bento Grid Features Section ──────────────────────────────── */

function BentoFeatureCard({
  icon,
  title,
  description,
  className = "",
  index = 0,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  className?: string;
  index?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.25, 0.4, 0.25, 1] }}
      whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.06)" }}
      className={`rounded-lg border border-hairline bg-canvas p-6 transition-colors ${className}`}
    >
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-canvas-elevated/50 text-ink">
        {icon}
      </div>
      <h3 className="mb-2 text-base font-medium text-ink">{title}</h3>
      <p className="text-sm leading-relaxed text-ink-mute">{description}</p>
    </motion.div>
  );
}

function FeaturesSection() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <SectionHeading
          title="Fitur Utama"
          subtitle="Semua yang UMKM butuhkan untuk penggajian yang patuh pajak."
        />
        {/* Bento Grid: 2 large + 3 small */}
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Large card - spans 2 cols on lg */}
          <BentoFeatureCard
            index={0}
            icon={<Calculator className="h-5 w-5" />}
            title="Kalkulator PPh 21 TER Otomatis"
            description="Perhitungan akurat menggunakan skema Tarif Efektif Rata-rata (TER) 2026 dengan kategori A/B/C berdasarkan PP 58/2023. Mendukung semua status PTKP dari TK/0 hingga K/3."
            className="lg:col-span-2"
          />
          {/* Regular card */}
          <BentoFeatureCard
            index={1}
            icon={<Shield className="h-5 w-5" />}
            title="Kompatibel Coretax DJP"
            description="Generate CSV/XML siap upload + BPA1 PDF dalam format resmi."
          />
          {/* Regular card */}
          <BentoFeatureCard
            index={2}
            icon={<Lock className="h-5 w-5" />}
            title="Enkripsi AES-256"
            description="NIK dan gaji terenkripsi. Audit trail immutable 5 tahun."
          />
          {/* Large card - spans 2 cols on lg */}
          <BentoFeatureCard
            index={3}
            icon={<Zap className="h-5 w-5" />}
            title="BPJS Otomatis dengan Ceiling & Diskon"
            description="Hitung Kesehatan, JHT, JP, JKM, JKK (diskon 50% Jan-Jun 2026), dan JKP. Batas atas upah diterapkan otomatis. Tarif bisa diubah tanpa coding."
            className="lg:col-span-2"
          />
          {/* Small cards row */}
          <BentoFeatureCard
            index={4}
            icon={<FileDown className="h-5 w-5" />}
            title="Ekspor Sekali Klik"
            description="CSV, XML, atau PDF BPA1 — pilih format, download, upload ke DJP."
            className="md:col-span-1"
          />
          <BentoFeatureCard
            index={5}
            icon={<Users className="h-5 w-5" />}
            title="RBAC 3-Tier"
            description="Owner, HR Staff, Regular Staff — akses terpisah sesuai peran."
            className="md:col-span-1"
          />
          <BentoFeatureCard
            index={6}
            icon={<Calculator className="h-5 w-5" />}
            title="Batch 50 Karyawan"
            description="Proses penggajian seluruh karyawan dalam satu klik, < 30 detik."
            className="md:col-span-1 lg:col-span-1"
          />
        </div>
      </div>
    </section>
  );
}

/* ─── How It Works Section ─────────────────────────────────────── */

const steps = [
  "Input data karyawan (NIK 16 digit tervalidasi)",
  "Klik Proses Penggajian — selesai dalam hitungan detik",
  "Download laporan Coretax & BPA1, upload ke DJP",
];

function HowItWorksSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="bg-canvas-elevated/50 px-6 py-24">
      <div ref={ref} className="mx-auto max-w-3xl">
        <SectionHeading
          title="Cara Kerja"
          subtitle="Tiga langkah sederhana menuju penggajian yang patuh pajak."
        />
        <div className="mt-12 space-y-6">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -16 }}
              animate={
                isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -16 }
              }
              transition={{
                duration: 0.45,
                delay: i * 0.18,
                ease: [0.25, 0.4, 0.25, 1],
              }}
              className="flex items-start gap-4"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
                {i + 1}
              </span>
              <p className="pt-1 text-base leading-relaxed text-ink">{step}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Pricing Section ──────────────────────────────────────────── */

const pricingFeatures = [
  "Max 50 karyawan",
  "PPh 21 TER otomatis",
  "BPJS otomatis",
  "Ekspor Coretax",
  "BPA1 PDF",
];

function PricingSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="px-6 py-24">
      <div ref={ref} className="mx-auto max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
        >
          <SpotlightCard>
            <h3 className="text-2xl font-medium tracking-tight text-white">
              Gratis Selama Beta
            </h3>
            <p className="mt-2 text-sm text-ink-faint">
              Tanpa kartu kredit. Tanpa batas waktu beta.
            </p>
            <ul className="mt-6 space-y-3">
              {pricingFeatures.map((feature) => (
                <li
                  key={feature}
                  className="flex items-center gap-2 text-sm text-white/80"
                >
                  <Check className="h-4 w-4 text-primary" />
                  {feature}
                </li>
              ))}
            </ul>
            <Link to="/register" className="mt-8 block">
              <Button
                variant="primary-green"
                size="lg"
                className="w-full"
              >
                Daftar Sekarang
              </Button>
            </Link>
          </SpotlightCard>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Comparison Table ──────────────────────────────────────────── */

const comparisonRows = [
  { feature: "Perhitungan PPh 21 TER", ours: true, excel: false },
  { feature: "Kalkulasi BPJS otomatis (ceiling + diskon)", ours: true, excel: false },
  { feature: "Validasi NIK 16 digit (Coretax-ready)", ours: true, excel: false },
  { feature: "Ekspor CSV/XML format Coretax DJP", ours: true, excel: false },
  { feature: "Generate BPA1 PDF per karyawan", ours: true, excel: false },
  { feature: "Enkripsi data gaji & NIK (AES-256)", ours: true, excel: false },
  { feature: "Audit trail 5 tahun (immutable)", ours: true, excel: false },
  { feature: "Multi-user dengan RBAC", ours: true, excel: false },
  { feature: "Risiko salah hitung", ours: false, excel: true },
  { feature: "Perlu update rumus manual tiap regulasi berubah", ours: false, excel: true },
];

function ComparisonSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="px-6 py-24">
      <div ref={ref} className="mx-auto max-w-3xl">
        <SectionHeading
          title="Kenapa Bukan Excel?"
          subtitle="Bandingkan Tax-Ready Payroll dengan penggajian manual menggunakan spreadsheet."
        />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 0.4, 0.25, 1] }}
          className="mt-10 overflow-hidden rounded-lg border border-hairline"
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-hairline bg-canvas-elevated/50">
                <th className="px-4 py-3 text-left font-medium text-ink">Fitur</th>
                <th className="px-4 py-3 text-center font-medium text-primary">Tax-Ready Payroll</th>
                <th className="px-4 py-3 text-center font-medium text-ink-mute">Excel Manual</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row, i) => (
                <tr key={i} className="border-b border-hairline last:border-0">
                  <td className="px-4 py-3 text-ink">{row.feature}</td>
                  <td className="px-4 py-3 text-center">
                    {row.ours ? (
                      <Check className="mx-auto h-5 w-5 text-primary" />
                    ) : (
                      <X className="mx-auto h-5 w-5 text-ink-faint" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {row.excel ? (
                      <Check className="mx-auto h-5 w-5 text-error" />
                    ) : (
                      <X className="mx-auto h-5 w-5 text-ink-faint" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── FAQ Accordion ────────────────────────────────────────────── */

const faqItems = [
  {
    question: "Apakah benar-benar gratis?",
    answer: "Ya, selama masa beta tidak ada biaya apapun. Anda mendapat akses penuh ke semua fitur termasuk kalkulator PPh 21, BPJS, ekspor Coretax, dan BPA1 PDF. Tanpa kartu kredit, tanpa batas waktu.",
  },
  {
    question: "Bagaimana keamanan data karyawan saya?",
    answer: "Data NIK dan gaji dienkripsi menggunakan AES-256 (standar perbankan). Sistem menggunakan Row Level Security di database sehingga data antar perusahaan terisolasi sepenuhnya. Audit trail tidak dapat dihapus atau dimodifikasi selama 5 tahun.",
  },
  {
    question: "Apakah kompatibel dengan Coretax DJP?",
    answer: "Dibangun mengikuti spesifikasi Coretax DJP yang berlaku saat ini. Sistem menghasilkan file CSV/XML dengan format yang sesuai portal Coretax DJP. Validasi NIK 16 digit juga memastikan data tidak ditolak saat pelaporan. Catatan: format Coretax dapat berubah sewaktu-waktu oleh DJP — kami akan memperbarui aplikasi mengikuti perubahan tersebut.",
  },
  {
    question: "Berapa lama setup awal?",
    answer: "Kurang dari 10 menit. Daftar akun, input data karyawan (NIK, nama, gaji pokok, status PTKP), dan Anda sudah bisa langsung proses penggajian pertama.",
  },
  {
    question: "Berapa maksimal karyawan yang bisa dikelola?",
    answer: "Saat ini mendukung hingga 50 karyawan aktif per perusahaan. Proses penggajian batch untuk 50 karyawan selesai dalam waktu kurang dari 30 detik.",
  },
  {
    question: "Apakah bisa digunakan untuk laporan tahunan (SPT)?",
    answer: "Untuk MVP saat ini, sistem fokus pada perhitungan bulanan dan ekspor BPA1. Fitur rekap tahunan dan SPT PPh 21 akan tersedia di versi berikutnya.",
  },
];

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-hairline last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between py-5 text-left transition-colors hover:text-primary"
        aria-expanded={isOpen}
      >
        <span className="pr-4 text-base font-medium text-ink">{question}</span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0"
        >
          <ChevronDown className="h-5 w-5 text-ink-mute" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 0.4, 0.25, 1] }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-sm leading-relaxed text-ink-mute">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FAQSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="bg-canvas-elevated/50 px-6 py-24">
      <div ref={ref} className="mx-auto max-w-2xl">
        <SectionHeading
          title="Pertanyaan Umum"
          subtitle="Jawaban untuk pertanyaan yang sering ditanyakan oleh pemilik UMKM."
        />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 0.4, 0.25, 1] }}
          className="mt-10 rounded-lg border border-hairline bg-canvas px-6"
        >
          {faqItems.map((item, i) => (
            <FAQItem key={i} question={item.question} answer={item.answer} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Footer ───────────────────────────────────────────────────── */

function Footer() {
  return (
    <footer className="border-t border-hairline px-6 py-10">
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-ink-mute">Tax-Ready Payroll © 2026 — Proyek Open Source</p>
          <nav className="flex gap-6">
            <Link to="/login" className="text-sm text-ink-mute hover:text-ink">Masuk</Link>
            <Link to="/register" className="text-sm text-ink-mute hover:text-ink">Daftar</Link>
            <a href="https://github.com/0xshalah/taxready-payroll/issues" target="_blank" rel="noopener noreferrer" className="text-sm text-ink-mute hover:text-ink">Laporkan Bug</a>
          </nav>
        </div>
        <p className="text-[11px] text-ink-faint text-center leading-relaxed">
          ⚠️ <strong>Disclaimer:</strong> Hasil perhitungan bersifat estimasi berdasarkan data yang diinput pengguna. 
          Bukan nasihat pajak profesional. Pengguna bertanggung jawab atas kepatuhan pelaporan pajak. 
          Format Coretax DJP dapat berubah sewaktu-waktu — selalu verifikasi dengan portal resmi DJP.
          Konsultasikan dengan konsultan pajak berlisensi untuk kepastian hukum.
        </p>
      </div>
    </footer>
  );
}

/* ─── Section Heading Helper ───────────────────────────────────── */

function SectionHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
      transition={{ duration: 0.45, ease: [0.25, 0.4, 0.25, 1] }}
      className="text-center"
    >
      <h2 className="text-3xl font-medium tracking-[-0.72px] text-ink">
        {title}
      </h2>
      <p className="mt-3 text-base text-ink-mute">{subtitle}</p>
    </motion.div>
  );
}

/* ─── Main Landing Page ────────────────────────────────────────── */

export function LandingPage() {
  return (
    <div className="min-h-screen bg-canvas dark:bg-mesh">
      {/* Floating theme toggle */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <div className="mx-auto max-w-[1280px]">
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <ComparisonSection />
        <PricingSection />
        <FAQSection />
      </div>
      <Footer />
    </div>
  );
}

