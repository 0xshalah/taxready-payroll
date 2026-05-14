/**
 * AppRoutes — Routing utama aplikasi Tax-Ready Payroll
 * Menggunakan DashboardLayout sebagai wrapper untuk halaman terproteksi
 */

import { Routes, Route } from 'react-router-dom';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { RegisterCompanyPage } from '@/features/auth/pages/RegisterCompanyPage';
import { LandingPage } from '@/features/landing/pages/LandingPage';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';
import { EmployeeListPage } from '@/features/employees/pages/EmployeeListPage';
import { EmployeeFormPage } from '@/features/employees/pages/EmployeeFormPage';
import { PayrollProcessPage } from '@/features/payroll/pages/PayrollProcessPage';
import { PayrollHistoryPage } from '@/features/payroll/pages/PayrollHistoryPage';
import { ExportPage } from '@/features/export/pages/ExportPage';
import { SettingsPage } from '@/features/settings/pages/SettingsPage';
import { TarifChangelogPage } from '@/features/settings/pages/TarifChangelogPage';
import { AuditTrailPage } from '@/features/audit/pages/AuditTrailPage';
import { ProfilePage } from '@/features/auth/pages/ProfilePage';
import { MyPayslipsPage } from '@/features/payroll/pages/MyPayslipsPage';

export function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterCompanyPage />} />

      {/* Protected routes with DashboardLayout */}
      <Route element={<DashboardLayout />}>
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute resource="employees" action="read">
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employees"
          element={
            <ProtectedRoute resource="employees" action="read">
              <EmployeeListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employees/new"
          element={
            <ProtectedRoute resource="employees" action="write">
              <EmployeeFormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employees/:id"
          element={
            <ProtectedRoute resource="employees" action="write">
              <EmployeeFormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payroll/process"
          element={
            <ProtectedRoute resource="payroll" action="write">
              <PayrollProcessPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payroll/history"
          element={
            <ProtectedRoute resource="payroll" action="read">
              <PayrollHistoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/export"
          element={
            <ProtectedRoute resource="export" action="read">
              <ExportPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute resource="settings" action="read">
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tarif-changelog"
          element={
            <ProtectedRoute resource="tarif_changelog" action="read">
              <TarifChangelogPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/audit"
          element={
            <ProtectedRoute resource="audit" action="read">
              <AuditTrailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute resource="profile" action="read">
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-payslips"
          element={
            <ProtectedRoute resource="my_payslips" action="read">
              <MyPayslipsPage />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
}
