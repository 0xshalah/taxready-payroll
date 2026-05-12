import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Link } from "react-router-dom";
import { Calculator, Shield, Lock, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedText } from "../components/AnimatedText";
import { FeatureCard } from "../components/FeatureCard";
import { FloatingBadge } from "../components/FloatingBadge";
import { SpotlightCard } from "../components/SpotlightCard";

/* ─── Hero Section ─────────────────────────────────────────────── */

function HeroSection() {
  return (
    <section className="flex min-h-[80vh] flex-col items-center justify-center px-6 py-24 text-center">
      <FloatingBadge className="mb-8">
        ✨ Gratis untuk 3 Beta Tester Pertama
      </FloatingBadge>

      <h1 className="max-w-3xl text-5xl font-medium leading-[1.1] tracking-[-1.44px] text-ink md:text-6xl md:tracking-[-1.92px]">
        <AnimatedText text="Penggajian UMKM yang Siap Coretax" />
      </h1>

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="mt-6 max-w-xl text-lg leading-relaxed text-ink-mute"
      >
        Hitung PPh 21, BPJS, dan generate laporan siap upload ke DJP — tanpa
        takut salah hitung.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="mt-10 flex flex-col items-center gap-4 sm:flex-row"
      >
        <Link to="/register">
          <Button variant="primary-green" size="lg" className="relative">
            <span className="relative z-10">Daftar Gratis</span>
            {/* Subtle glow pulse */}
            <motion.span
              className="absolute inset-0 rounded-sm bg-primary"
              animate={{ opacity: [0, 0.3, 0] }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              aria-hidden="true"
            />
          </Button>
        </Link>
        <Link
          to="/login"
          className="text-sm text-ink-mute underline-offset-4 hover:underline"
        >
          Sudah punya akun? Masuk
        </Link>
      </motion.div>
    </section>
  );
}

/* ─── Features Section ─────────────────────────────────────────── */

function FeaturesSection() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <SectionHeading
          title="Fitur Utama"
          subtitle="Semua yang UMKM butuhkan untuk penggajian yang patuh pajak."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <FeatureCard
            index={0}
            icon={<Calculator className="h-5 w-5" />}
            title="Kalkulator PPh 21 TER Otomatis"
            description="Skema TER 2026 dengan kategori A/B/C. Tidak perlu hitung manual lagi."
          />
          <FeatureCard
            index={1}
            icon={<Shield className="h-5 w-5" />}
            title="100% Kompatibel Coretax DJP"
            description="Generate CSV/XML siap upload + Bukti Potong BPA1 dalam format resmi."
          />
          <FeatureCard
            index={2}
            icon={<Lock className="h-5 w-5" />}
            title="Keamanan Standar UU PDP"
            description="Enkripsi AES-256, RBAC 3-tier, dan audit trail 5 tahun."
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
    <section className="bg-canvas-soft px-6 py-24">
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

/* ─── Footer ───────────────────────────────────────────────────── */

function Footer() {
  return (
    <footer className="border-t border-hairline px-6 py-10">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 sm:flex-row">
        <p className="text-sm text-ink-mute">Tax-Ready Payroll © 2026</p>
        <nav className="flex gap-6">
          <Link
            to="/login"
            className="text-sm text-ink-mute hover:text-ink"
          >
            Masuk
          </Link>
          <Link
            to="/register"
            className="text-sm text-ink-mute hover:text-ink"
          >
            Daftar
          </Link>
          <a
            href="mailto:kontak@taxreadypayroll.id"
            className="text-sm text-ink-mute hover:text-ink"
          >
            Kontak
          </a>
        </nav>
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
    <div className="min-h-screen bg-canvas">
      <div className="mx-auto max-w-[1280px]">
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <PricingSection />
      </div>
      <Footer />
    </div>
  );
}
