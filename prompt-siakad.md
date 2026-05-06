You are a Senior Full-Stack Laravel Developer and System Architect.

Your task is to build a **complete production-ready SIAKAD (Sistem Informasi Akademik Kampus)** web application.

---

# 🎯 TECH STACK (MANDATORY)

- Backend: Laravel 12
- Frontend: Inertia.js + React
- Styling: Tailwind CSS
- UI Components: ShadCN / Headless UI
- Database: MySQL
- Auth: Laravel Breeze (Inertia React)
- Role Permission: Spatie Laravel Permission
- Payment Gateway: Midtrans (Snap + Callback)
- State Management: React hooks (no Redux)
- Charts: ApexCharts
- Export: Laravel Excel
- Queue: Redis (optional but recommended)

---

# 🧠 SYSTEM OVERVIEW

Build a modular SIAKAD system with these core domains:

1. PMB (Penerimaan Mahasiswa Baru)
2. Akademik
3. KRS & Perkuliahan
4. Keuangan (Midtrans)
5. Mahasiswa & Dosen Management
6. Skripsi / Tugas Akhir
7. PKL / Magang
8. Laporan
9. Notifikasi
10. Pengaturan Sistem

---

# 👥 USER ROLES

- Super Admin
- Admin Akademik (BAAK)
- Dosen
- Mahasiswa
- Keuangan
- Calon Mahasiswa (PMB)

---

# 🧩 FEATURE REQUIREMENTS

## 🔵 PMB MODULE

- Register calon mahasiswa
- Form pendaftaran lengkap
- Upload dokumen
- Pilih jurusan
- Gelombang PMB
- Pembayaran pendaftaran (Midtrans)
- Verifikasi admin
- Generate NIM otomatis

---

## 🟢 AKADEMIK MODULE

- Kalender akademik
- Tahun akademik
- Kurikulum per prodi
- Mata kuliah
- Kelas kuliah
- Jadwal kuliah
- Ruangan
- Presensi mahasiswa
- Nilai & grading
- Transkrip
- Yudisium & wisuda

---

## 🟡 KRS MODULE

- Ambil mata kuliah
- Batas SKS otomatis
- Validasi bentrok jadwal
- Approval dosen wali

---

## 🟣 DOSEN MODULE

- Jadwal mengajar
- Input nilai
- Input presensi
- Approval KRS
- Upload materi & tugas

---

## 🔴 MAHASISWA MODULE

- KRS
- KHS
- Transkrip
- Jadwal
- Presensi
- Download materi
- Upload tugas

---

## 💳 KEUANGAN MODULE

- Jenis pembayaran (SPP, SKS, dll)
- Generate tagihan otomatis
- Midtrans Snap integration
- Callback handler
- Status transaksi (pending, success, failed)
- Riwayat pembayaran
- Beasiswa / potongan
- Denda

---

## 🎓 SKRIPSI MODULE

- Pengajuan judul
- Penentuan pembimbing
- Bimbingan
- Seminar proposal
- Sidang akhir

---

## 🏢 PKL MODULE

- Pendaftaran PKL
- Logbook harian
- Monitoring dosen
- Penilaian

---

## 📊 LAPORAN

- Akademik
- Mahasiswa
- Nilai
- Keuangan
- Export Excel & PDF

---

## 🔔 NOTIFICATION

- Email notification
- WhatsApp (optional hook system)

---

# 🗂️ DATABASE DESIGN (IMPORTANT)

Create migrations for:

- users (multi role)
- roles & permissions (Spatie)
- mahasiswas
- dosens
- jurusans
- prodis
- mata_kuliahs
- kurikulums
- kelas
- jadwals
- krs
- krs_details
- nilais
- presensis
- tagihans
- transaksis
- pmb
- skripsi
- pkl

Include:

- foreign keys
- indexing
- soft deletes

---

# 🔌 MIDTRANS INTEGRATION

Implement:

1. Create transaction:
   - generate snap token

2. Payment page (React)
3. Callback endpoint:
   - handle settlement
   - update tagihan status

4. Save transaction logs

---

# 🧭 SIDEBAR MENU (ROLE-BASED)

Implement dynamic sidebar:

- Show menu based on role
- Config-driven menu (config/menu.php)
- Active route highlighting

---

# 🎨 UI REQUIREMENTS

- Clean dashboard
- Modern card layout
- Responsive design
- Dark mode (optional)
- Loading skeleton
- Toast notifications

---

# ⚙️ ARCHITECTURE RULES

- Use Service Layer (Service classes)
- Use Repository pattern (optional)
- Use Form Request validation
- Use API Resources
- Keep controllers thin
- Use Traits for reusable logic

---

# 📁 PROJECT STRUCTURE

- app/Services
- app/Repositories
- app/Models
- app/Http/Controllers
- resources/js/Pages
- resources/js/Components
- config/menu.php

---

# 🔐 AUTH SYSTEM

- Laravel Breeze (Inertia React)
- Multi-role login redirect
- Middleware per role

---

# 🚀 DEPLOYMENT READY

Ensure:

- .env example
- Queue config
- Storage link
- Optimize commands
- Production-ready config

---

# 📦 OUTPUT REQUIREMENTS

Generate:

1. Full Laravel project structure
2. Migration files
3. Models + relationships
4. Controllers (resource-based)
5. React pages (Inertia)
6. Sidebar component
7. Midtrans integration
8. Sample dashboard

---

# ⚠️ IMPORTANT

- Code must be clean & scalable
- Follow Laravel best practices
- Use naming conventions properly
- Avoid hardcoding
- Write reusable components

---

# 🎯 FINAL GOAL

Build a **production-ready SIAKAD system** that:

- can be sold commercially
- scalable for universities
- modern UI
- integrated payment system

---

Start by:

1. Generating database migrations
2. Then models
3. Then controllers
4. Then frontend pages
5. Then integration

Proceed step by step.
