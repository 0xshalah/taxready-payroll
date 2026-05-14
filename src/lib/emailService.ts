/**
 * Email Service — Kirim notifikasi via Supabase Edge Function (send-email)
 * yang menggunakan Resend API sebagai provider.
 *
 * Semua pengiriman email bersifat fire-and-forget (non-blocking).
 * Kegagalan email tidak menghentikan operasi utama.
 */

import { supabase } from '@/lib/supabase';

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

/**
 * Kirim email via Edge Function send-email.
 * Non-blocking — tidak throw error jika gagal.
 */
async function sendEmail(params: SendEmailParams): Promise<void> {
  try {
    const { error } = await supabase.functions.invoke('send-email', {
      body: params,
    });

    if (error) {
      console.warn('[EmailService] Gagal kirim email:', error.message);
    }
  } catch (err) {
    console.warn('[EmailService] Exception:', err);
  }
}

// ─── Email Templates ──────────────────────────────────────────────────────────

/**
 * Escape HTML special characters to prevent HTML injection in email templates.
 * CWE-79: Improper Neutralization of Input During Web Page Generation
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

const baseStyle = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  max-width: 600px;
  margin: 0 auto;
  background: #ffffff;
  color: #171717;
`;

const headerStyle = `
  background: #171717;
  padding: 24px 32px;
  border-radius: 8px 8px 0 0;
`;

const bodyStyle = `
  padding: 32px;
  border: 1px solid #dfdfdf;
  border-top: none;
  border-radius: 0 0 8px 8px;
`;

const footerStyle = `
  padding: 16px 32px;
  text-align: center;
  color: #9a9a9a;
  font-size: 12px;
`;

const primaryBtn = `
  display: inline-block;
  background: #3ecf8e;
  color: #171717;
  padding: 10px 24px;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 500;
  font-size: 14px;
  margin-top: 16px;
`;

function baseTemplate(content: string): string {
  return `
    <div style="${baseStyle}">
      <div style="${headerStyle}">
        <span style="color: #3ecf8e; font-weight: 600; font-size: 18px;">Tax-Ready Payroll</span>
      </div>
      <div style="${bodyStyle}">
        ${content}
      </div>
      <div style="${footerStyle}">
        <p>Disclaimer: Hasil perhitungan bersifat estimasi. Bukan nasihat pajak profesional.</p>
        <p>© ${new Date().getFullYear()} Tax-Ready Payroll. Semua hak dilindungi.</p>
      </div>
    </div>
  `;
}

// ─── Notification Functions ───────────────────────────────────────────────────

/**
 * Notifikasi ke Owner setelah proses penggajian selesai.
 */
export async function sendPayrollCompletedEmail(params: {
  ownerEmail: string;
  ownerNama: string;
  companyName: string;
  period: string; // "Mei 2026"
  employeeCount: number;
  totalNetPay: number;
  successCount: number;
  failedCount: number;
}): Promise<void> {
  const formatRp = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;
  // CWE-79: Escape all user-controlled values before HTML interpolation
  const ownerNama = escapeHtml(params.ownerNama);
  const period = escapeHtml(params.period);
  const companyName = escapeHtml(params.companyName);

  const html = baseTemplate(`
    <h2 style="margin: 0 0 8px; font-size: 20px; font-weight: 600;">Penggajian Berhasil Diproses</h2>
    <p style="color: #707070; margin: 0 0 24px;">Halo ${ownerNama},</p>
    <p>Proses penggajian untuk periode <strong>${period}</strong> di <strong>${companyName}</strong> telah selesai.</p>

    <div style="background: #fafafa; border: 1px solid #dfdfdf; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #707070; font-size: 14px;">Total Karyawan</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600;">${params.employeeCount}</td>
        </tr>
        <tr style="border-top: 1px solid #dfdfdf;">
          <td style="padding: 8px 0; color: #707070; font-size: 14px;">Berhasil Diproses</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #065f46;">${params.successCount}</td>
        </tr>
        ${params.failedCount > 0 ? `
        <tr style="border-top: 1px solid #dfdfdf;">
          <td style="padding: 8px 0; color: #707070; font-size: 14px;">Gagal Diproses</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #991b1b;">${params.failedCount}</td>
        </tr>` : ''}
        <tr style="border-top: 2px solid #dfdfdf;">
          <td style="padding: 12px 0 8px; font-weight: 600;">Total Gaji Bersih</td>
          <td style="padding: 12px 0 8px; text-align: right; font-weight: 700; font-size: 18px; color: #3ecf8e;">${formatRp(params.totalNetPay)}</td>
        </tr>
      </table>
    </div>

    <p style="font-size: 14px; color: #707070;">Silakan login ke dashboard untuk melihat detail dan mengekspor laporan ke Coretax DJP.</p>
    ${params.failedCount > 0 ? `<p style="font-size: 14px; color: #991b1b;">⚠️ ${params.failedCount} karyawan gagal diproses. Periksa data karyawan tersebut.</p>` : ''}
  `);

  await sendEmail({
    to: params.ownerEmail,
    subject: `✅ Penggajian ${period} Selesai — ${companyName}`,
    html,
  });
}

/**
 * Notifikasi ke karyawan bahwa slip gaji sudah tersedia.
 */
export async function sendPayslipReadyEmail(params: {
  employeeEmail: string;
  employeeNama: string;
  companyName: string;
  period: string;
  netPay: number;
}): Promise<void> {
  const formatRp = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;
  const employeeNama = escapeHtml(params.employeeNama);
  const period = escapeHtml(params.period);
  const companyName = escapeHtml(params.companyName);

  const html = baseTemplate(`
    <h2 style="margin: 0 0 8px; font-size: 20px; font-weight: 600;">Slip Gaji Tersedia</h2>
    <p style="color: #707070; margin: 0 0 24px;">Halo ${employeeNama},</p>
    <p>Slip gaji Anda untuk periode <strong>${period}</strong> dari <strong>${companyName}</strong> sudah tersedia.</p>

    <div style="background: #ecfdf5; border: 1px solid #6ee7b7; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
      <p style="margin: 0; color: #065f46; font-size: 14px;">Gaji Bersih (Take-Home Pay)</p>
      <p style="margin: 8px 0 0; font-size: 28px; font-weight: 700; color: #065f46;">${formatRp(params.netPay)}</p>
    </div>

    <p style="font-size: 14px; color: #707070;">Login ke aplikasi untuk melihat rincian lengkap slip gaji Anda.</p>
    <p style="font-size: 12px; color: #9a9a9a; margin-top: 16px;">Hasil perhitungan bersifat estimasi. Hubungi HR jika ada pertanyaan.</p>
  `);

  await sendEmail({
    to: params.employeeEmail,
    subject: `💰 Slip Gaji ${period} — ${companyName}`,
    html,
  });
}

/**
 * Notifikasi ke user baru yang diundang.
 */
export async function sendWelcomeEmail(params: {
  userEmail: string;
  userNama: string;
  companyName: string;
  role: string;
  temporaryPassword: string; // kept for API compat but NOT used in email body
  appUrl: string;
}): Promise<void> {
  const roleLabel = params.role === 'owner' ? 'Owner' : params.role === 'hr_staff' ? 'HR Staff' : 'Regular Staff';
  const userNama = escapeHtml(params.userNama);
  const companyName = escapeHtml(params.companyName);
  const userEmail = escapeHtml(params.userEmail);
  const appUrl = escapeHtml(params.appUrl);

  const html = baseTemplate(`
    <h2 style="margin: 0 0 8px; font-size: 20px; font-weight: 600;">Selamat Datang di Tax-Ready Payroll</h2>
    <p style="color: #707070; margin: 0 0 24px;">Halo ${userNama},</p>
    <p>Anda telah ditambahkan ke <strong>${companyName}</strong> sebagai <strong>${roleLabel}</strong>.</p>

    <div style="background: #fafafa; border: 1px solid #dfdfdf; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0 0 8px; font-size: 14px; color: #707070;">Informasi akun Anda:</p>
      <p style="margin: 4px 0; font-size: 14px;"><strong>Email:</strong> ${userEmail}</p>
      <p style="margin: 4px 0; font-size: 14px; color: #707070;">Gunakan password yang Anda buat saat registrasi untuk login.</p>
    </div>

    <p style="font-size: 14px; color: #707070;">Klik tombol di bawah untuk mulai menggunakan aplikasi.</p>
    <a href="${appUrl}/login" style="${primaryBtn}">Login Sekarang</a>
  `);

  await sendEmail({
    to: params.userEmail,
    subject: `🎉 Akun Tax-Ready Payroll Anda Sudah Siap — ${params.companyName}`,
    html,
  });
}
