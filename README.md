# 🧪 Sistem Informasi & Pembayaran Kas Angkatan Kimia 2026 (Aerogel)

Aplikasi web modern, responsif, dan terintegrasi untuk pengelolaan iuran kas mingguan (Rp 5.000/minggu) mahasiswa Kimia 2026 (Kelas G, H, dan I), dikelola langsung oleh Sekretaris Angkatan.

---

## 🌟 Fitur Utama

### 1. 🔐 Sistem Autentikasi Dual-Role via NIM
- **Login Mahasiswa**: Masukkan NIM (contoh: `261810301001` s/d `261810301118`) untuk mengakses Dashboard Mahasiswa.
- **Login Sekretaris (Admin)**: Masukkan NIM `261810309999` untuk mengakses Panel Admin / Sekretaris.

### 2. 💳 Pembayaran Kas Mandiri via QRIS
- Dynamic / Static QRIS resmi dengan NMID: `ID1026181030999`.
- Pilih minggu yang ingin dibayar secara fleksibel (bisa 1 minggu atau banyak minggu sekaligus).
- Kalkulasi otomatis nominal total (`Jumlah Minggu x Rp 5.000`).
- Input tanggal transfer dan unggah foto/screenshot bukti transfer serta catatan pengirim.
- Status otomatis masuk ke antrean **"Menunggu Konfirmasi"**.

### 3. 📊 Dashboard Personal Mahasiswa
- Rincian kartu per minggu (Minggu 1 s/d Minggu 16).
- Indikator status:
  - 🟢 **Lunas** (Disetujui oleh Sekretaris)
  - 🟡 **Menunggu Konfirmasi** (Dalam antrean verifikasi)
  - 🔴 **Belum Lunas** (Dapat langsung dipilih untuk dibayar)
- Progress bar kelunasan semester dan ringkasan total uang terbayar vs sisa tunggakan.

### 4. 👑 Panel Kendali Sekretaris (Admin)
- **Antrean Verifikasi**: Menampilkan seluruh pengajuan transfer mahasiswa, tinjau bukti transfer/catatan, setujui ("✓ Setujui") menjadi status **Lunas** secara instan, atau tolak ("✕ Tolak"). Fitur "Setujui Semua" untuk verifikasi massal.
- **Matriks Kas Global (118+ Mahasiswa)**:
  - Tabel grid interaktif dengan sticky column (NIM, Nama, Kelas) dan kolom W1 - W16.
  - **Interactive 1-Click Toggle**: Sekretaris dapat mengklik kotak mana saja untuk mengubah status secara langsung (misalnya mahasiswa bayar tunai di kelas).
  - Filter pencarian nama/NIM, filter per kelas (G, H, I), dan filter status kelunasan.
  - Ekspor seluruh rekapan matriks ke file **CSV / Excel**.

---

## 🛠️ Tech Stack

- **Frontend**: HTML5, Vanilla JavaScript (ES6+), Tailwind CSS (CDN), Plus Jakarta Sans & Inter font.
- **Backend & Database**: Supabase (PostgreSQL `students` & `weekly_payments` tables).
- **Deployment**: Vercel & GitHub.

---

## 🚀 Struktur Berkas

```
kas-aerogel/
├── index.html              # Halaman Login & Landing Page
├── student-dashboard.html  # Dashboard Mahasiswa & Modal QRIS
├── admin-dashboard.html    # Panel Sekretaris & Matriks Global
├── app.js                  # Logika Utama, Supabase Client & DB Service
├── vercel.json             # Konfigurasi routing Vercel
└── README.md               # Dokumentasi Proyek
```

---

&copy; 2026 Departemen Kimia - Angkatan Aerogel 2026.