# Finance Flow Hub

Bangun sebuah aplikasi web internal bernama "Finance Request Management System".

Aplikasi ini digunakan oleh beberapa unit bisnis untuk membuat pengajuan keuangan kepada tim Finance, kemudian Finance dapat melakukan review, meminta revisi, menolak, menyetujui, memproses pembayaran, serta menyediakan surat persetujuan dan bukti transfer.

Untuk tahap pertama ini, fokus pada fondasi frontend dan struktur aplikasi menggunakan mock data.

JANGAN:

- hubungkan Supabase

- buat database sungguhan

- implementasikan Google Apps Script

- implementasikan authentication sungguhan

- membuat backend sendiri

- mengubah scope aplikasi menjadi accounting system

Tech stack:

- React

- TypeScript

- Tailwind CSS

Gunakan struktur kode yang maintainable dan modular.

Pisahkan dengan jelas:

- pages

- components

- types

- mock data

- services

- utilities

- constants

- permissions

Hindari page component yang terlalu besar.

Gunakan reusable component untuk elemen yang dipakai berulang.

==================================================

BAHASA APLIKASI

==================================================

Gunakan Bahasa Indonesia sebagai bahasa utama antarmuka.

Contoh:

Dashboard

Pengajuan Saya

Buat Pengajuan

Menunggu Review

Perlu Revisi

Disetujui

Ditolak

Sudah Dibayar

Detail Pengajuan

Riwayat Aktivitas

Dokumen Pendukung

Surat Persetujuan

Bukti Transfer

Proses Pembayaran

Kelola Pengguna

Unit Bisnis

Pengaturan Sistem

Jangan menggunakan campuran Bahasa Indonesia dan Bahasa Inggris secara acak pada UI.

Istilah teknis internal dalam source code tetap boleh menggunakan English.

==================================================

ROLE

==================================================

Terdapat empat role:

1. UNIT_USER

2. FINANCE_REVIEWER

3. FINANCE_PAYMENT

4. ADMIN

Untuk development, buat temporary Development Role Switcher agar saya dapat berpindah role tanpa login sungguhan.

Pilihan:

- Unit Bisnis

- Finance Reviewer

- Finance Payment

- Administrator

Navigasi, halaman, data, dan action yang tersedia harus berubah sesuai role.

==================================================

STATUS PENGAJUAN

==================================================

Gunakan internal status berikut:

DRAFT

SUBMITTED

UNDER_REVIEW

REVISION_REQUIRED

REJECTED

APPROVED

PAID

Tampilkan label Bahasa Indonesia pada UI:

DRAFT

→ Draf

SUBMITTED

→ Diajukan

UNDER_REVIEW

→ Sedang Direview

REVISION_REQUIRED

→ Perlu Revisi

REJECTED

→ Ditolak

APPROVED

→ Disetujui

PAID

→ Sudah Dibayar

Gunakan reusable StatusBadge untuk seluruh aplikasi.

==================================================

DESIGN DIRECTION

==================================================

Gunakan visual direction yang terinspirasi dari brand reference MAW yang telah diberikan.

JANGAN meniru layout Instagram.

Ambil hanya:

- arah warna

- mood visual

- karakter brand

- hierarchy typography

- kesan premium corporate

Desain harus terasa:

- modern

- premium

- corporate

- clean

- profesional

- minimal

- cocok untuk internal finance application

Jangan terlalu futuristic.

Jangan playful.

==================================================

DARK MODE

==================================================

Dark Mode menjadi karakter visual utama.

Gunakan warna:

Primary:

#2563EB

Primary Hover:

#1D4ED8

Main Background:

#0B1220

Sidebar / Navigation:

#111827

Card / Surface:

#1E293B

Border:

#334155

Primary Text:

#F8FAFC

Secondary Text:

#94A3B8

Gunakan subtle blue gradient hanya pada area yang benar-benar membutuhkan emphasis.

Jangan gunakan gradient berlebihan.

==================================================

LIGHT MODE

==================================================

Sediakan Light Mode yang tetap memiliki identitas visual yang sama.

Light Mode bukan sekadar inversion dari Dark Mode.

Gunakan arah warna seperti:

Main Background:

#F8FAFC

Secondary Background:

#F1F5F9

Card / Surface:

#FFFFFF

Border:

#E2E8F0

Primary Text:

#0F172A

Secondary Text:

#64748B

Primary Accent:

#2563EB

Primary Hover:

#1D4ED8

Pastikan contrast, table, form, modal, dropdown, sidebar, badge, dan card terlihat jelas pada kedua theme.

==================================================

THEME SWITCHER

==================================================

Tambahkan theme switcher:

- Light

- Dark

- System

Letakkan secara rapi di area profile/settings.

Gunakan preferensi sistem sebagai default untuk pengguna baru.

Simpan pilihan theme secara lokal agar tidak berubah setiap reload.

Pastikan tidak terjadi flash theme yang mengganggu saat halaman dimuat.

Gunakan centralized theme tokens atau CSS variables.

Jangan menulis warna dark/light secara acak di setiap component.

==================================================

STATUS COLORS

==================================================

Tetap gunakan semantic color yang mudah dikenali:

DRAFT:

gray

SUBMITTED:

blue

UNDER_REVIEW:

indigo

REVISION_REQUIRED:

amber

REJECTED:

red

APPROVED:

emerald

PAID:

teal

Pastikan semua status tetap readable di Dark Mode maupun Light Mode.

==================================================

APPLICATION SHELL

==================================================

Buat authenticated-style application shell walaupun authentication masih mock.

Desktop:

- collapsible sidebar

- top header

- main content

- user profile

- notification icon

- breadcrumb jika diperlukan

Sidebar harus memiliki:

- logo / nama aplikasi

- navigation

- active menu indicator

Gunakan compact enterprise layout.

Jangan membuat sidebar terlalu lebar.

==================================================

REUSABLE COMPONENTS

==================================================

Siapkan reusable component minimal untuk:

- AppSidebar

- AppHeader

- PageHeader

- StatCard

- StatusBadge

- DataTable

- EmptyState

- LoadingState

- ErrorState

- ConfirmationDialog

- FormField

- FileUpload

- ActivityTimeline

Tidak semuanya harus kompleks pada tahap ini.

==================================================

MOCK DATA

==================================================

Gunakan mock data realistis untuk development.

Gunakan:

- nama orang Indonesia

- nama unit bisnis realistis

- tanggal Indonesia

- nominal Rupiah

Contoh request number:

REQ-2026-0001

REQ-2026-0002

Gunakan format Rupiah seperti:

Rp5.000.000

Gunakan mock data hanya melalui data/service layer.

Jangan hardcode array data besar langsung di page component.

==================================================

UX PRINCIPLES

==================================================

Hindari:

- glassmorphism berlebihan

- shadow besar

- excessive border radius

- animasi yang tidak perlu

- random accent colors

- consumer social media style

- terlalu banyak gradient

- card untuk setiap informasi kecil

Gunakan visual hierarchy yang kuat.

Gunakan whitespace yang cukup.

Tetap pertahankan information density yang cocok untuk sistem internal perusahaan.

==================================================

HASIL STEP INI

==================================================

Untuk tahap ini, buat:

- fondasi project

- application shell

- role switcher

- role-based navigation dasar

- design system

- Dark Mode

- Light Mode

- System Theme

- contoh dashboard dasar menggunakan mock data

Belum perlu membangun keseluruhan workflow setiap role.

Jangan hubungkan backend sungguhan.

Pastikan fondasi ini siap dikembangkan pada tahap berikutnya tanpa harus melakukan redesign besar.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/82391ce8-194c-477c-b10d-8c055712a92b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
