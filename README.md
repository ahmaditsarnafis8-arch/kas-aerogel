# 🧪 Sistem Informasi & Pembayaran Kas Angkatan Kimia 2026 (Aerogel)

Aplikasi web modern, responsif, dan terintegrasi untuk pengelolaan iuran kas mingguan (Rp 5.000/minggu) mahasiswa Kimia 2026 (Kelas G, H, dan I), dikelola langsung oleh Bendahara Angkatan.

---

## 🌟 Fitur Utama

### 1. 🔐 Sistem Autentikasi Dual-Role via NIM
- **Login Mahasiswa**: Masukkan NIM (contoh: `261810301001` s/d `261810301118`) untuk mengakses Dashboard Mahasiswa.
- **Login Bendahara (Admin)**: Masukkan NIM `261810309999` untuk mengakses Panel Admin / Bendahara Angkatan.

### 2. 💳 Pembayaran Kas Mandiri via QRIS & Auto Kompres Gambar
- Dynamic / Static QRIS resmi dengan NMID: `ID1026181030999`.
- Pilih minggu yang ingin dibayar secara fleksibel (bisa 1 minggu atau banyak minggu sekaligus).
- Kalkulasi otomatis nominal total (`Jumlah Minggu x Rp 5.000`).
- **Auto Image Compression**: Sistem otomatis mengecilkan resolusi dan mengompresi gambar di bawah **500 KB** di browser tanpa merusak ketajaman teks bukti transfer.
- **Supabase Storage Integration**: File terkompresi dikirim ke Supabase Storage (`bukti-transfer`), dan URL publik disimpan di database agar efisien dan hemat kapasitas.
- Input tanggal transfer dan catatan pengirim opsional.
- Status otomatis masuk ke antrean **"Menunggu Konfirmasi"**.

### 3. 📊 Dashboard Personal Mahasiswa
- Rincian kartu per minggu (Minggu 1 s/d Minggu 16).
- Tab **"Riwayat Pembayaran"** untuk memantau status persetujuan, nominal, dan waktu unggah.
- Indikator status:
  - 🟢 **Lunas** (Disetujui oleh Bendahara)
  - 🟡 **Menunggu Konfirmasi** (Dalam antrean verifikasi)
  - 🔴 **Belum Lunas** (Dapat langsung dipilih untuk dibayar)
  - ⛔ **Ditolak** (Foto bukti dihapus otomatis dari storage, opsi bayar ulang)
- Progress bar kelunasan semester dan ringkasan total uang terbayar vs sisa tunggakan.

### 4. 👑 Panel Kendali Bendahara (Admin)
- **Antrean Verifikasi**: Menampilkan seluruh pengajuan transfer mahasiswa, tinjau bukti transfer/catatan, setujui ("✓ Setujui") menjadi status **Lunas** secara instan, atau tolak ("✕ Tolak" yang menghapus file gambar bukti transfer dari Supabase Storage & database untuk menghemat storage). Fitur "Setujui Semua" untuk verifikasi massal.
- **Log Histori Bayar**: Tab rekapan riwayat pembayaran mahasiswa yang telah disetujui, dikelompokkan rapi per mahasiswa lengkap dengan metrik total terbayar dan ekspor CSV.
- **Matriks Kas Global (118+ Mahasiswa)**:
  - Tabel grid interaktif dengan sticky column (NIM, Nama, Kelas) dan kolom W1 - W16.
  - **Interactive 1-Click Toggle**: Bendahara dapat mengklik kotak mana saja untuk mengubah status secara langsung (misalnya mahasiswa bayar tunai di kelas).
  - Filter pencarian nama/NIM, filter per kelas (G, H, I), dan filter status kelunasan.
  - Ekspor seluruh rekapan matriks ke file **CSV / Excel**.

---

## 🛠️ Tech Stack

- **Frontend**: HTML5, Vanilla JavaScript (ES6+), HTML5 Canvas Image Compression, Tailwind CSS (CDN), Plus Jakarta Sans & Inter font.
- **Backend & Database**: Supabase (PostgreSQL tables `students` & `weekly_payments`, Supabase Storage `bukti-transfer`).
- **Deployment**: Vercel & GitHub.

---

## 🚀 Struktur Berkas

```
kas-aerogel/
├── index.html              # Halaman Login & Landing Page
├── student-dashboard.html  # Dashboard Mahasiswa, Riwayat Pembayaran & Modal QRIS (Auto Kompres)
├── admin-dashboard.html    # Panel Bendahara, Log Histori & Matriks Global
├── app.js                  # Logika Utama, Client Supabase, DB Service & ImageCompressor
├── supabase_setup.sql      # Script SQL untuk Setup Bucket Storage & Kolom proof_url
├── vercel.json             # Konfigurasi routing Vercel
└── README.md               # Dokumentasi Proyek
```

---

&copy; 2026 Departemen Kimia - Angkatan Aerogel 2026.