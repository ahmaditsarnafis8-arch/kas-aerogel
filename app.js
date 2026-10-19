// ============================================================
// KAS KIMIA 2026 (AEROGEL) - app.js
// Sistem Informasi & Pembayaran Kas Angkatan Kimia 2026
// ============================================================

const CONFIG = {
  SUPABASE_URL: 'https://mlnizfwyssooiuuvbeqz.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_YNzxL5Hv8_6CM0W_KueIYw_fv7IqQcN',
  ADMIN_NIM: '261810309999',
  WEEKLY_DUES: 5000,
  TOTAL_WEEKS: 16,
  SESSION_KEY: 'kas_aerogel_user',
  PROOF_STORAGE_KEY: 'kas_aerogel_proofs'
};

// ------------------------------------------------------------
// SUPABASE CLIENT INITIALIZATION
// ------------------------------------------------------------
let db = null;
if (typeof supabase !== 'undefined') {
  db = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
  console.log('[KasAerogel] Supabase Client Initialized');
} else {
  console.error('[KasAerogel] Supabase JS library is not loaded!');
}

// ------------------------------------------------------------
// AUTHENTICATION & SESSION MANAGEMENT
// ------------------------------------------------------------
const Auth = {
  getUser() {
    try {
      const data = localStorage.getItem(CONFIG.SESSION_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  setUser(user) {
    localStorage.setItem(CONFIG.SESSION_KEY, JSON.stringify(user));
  },

  logout() {
    localStorage.removeItem(CONFIG.SESSION_KEY);
    window.location.href = 'index.html';
  },

  async loginWithNIM(nim) {
    if (!nim || !nim.trim()) {
      return { success: false, message: 'Masukkan NIM Anda terlebih dahulu.' };
    }
    const cleanNim = nim.trim();

    // 1. Bypass instan untuk Admin Sekretaris
    if (cleanNim === CONFIG.ADMIN_NIM) {
      const adminData = {
        nim: CONFIG.ADMIN_NIM,
        nama: 'Admin Sekretaris Kimia 2026',
        kelas: 'ADMIN',
        role: 'admin'
      };
      this.setUser(adminData);
      return { success: true, user: adminData, isAdmin: true };
    }

    try {
      const { data, error } = await db
        .from('students')
        .select('*')
        .eq('nim', cleanNim)
        .maybeSingle();

      if (data) {
        this.setUser(data);
        return {
          success: true,
          user: data,
          isAdmin: data.role === 'admin' || cleanNim === CONFIG.ADMIN_NIM
        };
      }

      // Fallback jika tabel students belum bisa dibaca karena RLS
      const fallbackUser = {
        nim: cleanNim,
        nama: 'Mahasiswa ' + cleanNim,
        kelas: 'G',
        role: 'student'
      };
      this.setUser(fallbackUser);
      return { success: true, user: fallbackUser, isAdmin: false };
    } catch (err) {
      console.error('Fatal login error:', err);
      // Fallback agar tetap bisa masuk
      const fallbackUser = {
        nim: cleanNim,
        nama: 'Mahasiswa ' + cleanNim,
        kelas: 'G',
        role: 'student'
      };
      this.setUser(fallbackUser);
      return { success: true, user: fallbackUser, isAdmin: false };
    }
  },

  requireAuth(requiredRole = null) {
    const user = this.getUser();
    if (!user) {
      window.location.href = 'index.html';
      return null;
    }

    if (requiredRole === 'admin') {
      if (user.role !== 'admin' && user.nim !== CONFIG.ADMIN_NIM) {
        window.location.href = 'student-dashboard.html';
        return null;
      }
    } else if (requiredRole === 'student') {
      if (user.role === 'admin' || user.nim === CONFIG.ADMIN_NIM) {
        window.location.href = 'admin-dashboard.html';
        return null;
      }
    }

    return user;
  }
};

// ------------------------------------------------------------
// DATABASE SERVICE (SUPABASE)
// ------------------------------------------------------------
const KasDB = {
  // Fallback cache untuk beberapa NIM mahasiswa agar UI selalu informatif
  KNOWN_STUDENTS: {
    '261810301001': { nama: 'Dianatul Firdausiah', kelas: 'G' },
    '261810301002': { nama: 'Fadia Astianingrum', kelas: 'G' },
    '261810301003': { nama: 'Siti Nur Amalia', kelas: 'G' },
    '261810301004': { nama: 'Novita Yulianti', kelas: 'G' },
    '261810301041': { nama: 'M. Afri Farhan Fahmi', kelas: 'G' },
    '261810301074': { nama: 'Ahmad Itsar Nafis Aly', kelas: 'H' },
    '261810301081': { nama: 'Mahasiswa Kelas I', kelas: 'I' }
  },

  // Ambil semua mahasiswa (bisa difilter per kelas: G, H, I)
  async getStudents(kelas = null) {
    let query = db
      .from('students')
      .select('*')
      .neq('role', 'admin')
      .order('kelas', { ascending: true })
      .order('nim', { ascending: true });

    if (kelas && kelas !== 'all') {
      query = query.eq('kelas', kelas);
    }

    try {
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data;
      }
    } catch (e) {
      console.warn('Students query error (check RLS):', e);
    }

    // Fallback jika database students belum ada policy SELECT
    try {
      const { data: wp } = await db.from('weekly_payments').select('nim');
      const uniqueNims = [...new Set((wp || []).map(x => x.nim).filter(Boolean))];
      if (uniqueNims.length > 0) {
        return uniqueNims.map(nim => {
          const k = this.KNOWN_STUDENTS[nim] || {};
          return {
            nim,
            nama: k.nama || ('Mahasiswa ' + nim),
            kelas: k.kelas || 'G',
            role: 'student'
          };
        });
      }
    } catch (e) {}

    return [];
  },

  // Ambil data satu mahasiswa berdasarkan NIM
  async getStudentByNIM(nim) {
    try {
      const { data, error } = await db
        .from('students')
        .select('*')
        .eq('nim', nim)
        .maybeSingle();
      if (!error && data) return data;
    } catch (e) {}
    
    const k = this.KNOWN_STUDENTS[nim] || {};
    return {
      nim,
      nama: k.nama || ('Mahasiswa ' + nim),
      kelas: k.kelas || 'G',
      role: 'student'
    };
  },

  // Ambil pembayaran satu mahasiswa untuk seluruh minggu (lengkap dengan bukti transfer)
  async getStudentPayments(nim) {
    const { data, error } = await db
      .from('weekly_payments')
      .select('*')
      .eq('nim', nim)
      .order('week_number', { ascending: true });

    if (error) throw error;
    if (!data) return [];

    const proofs = this.getStoredProofs();

    return data.map(p => {
      const proofInfo = proofs[`${p.nim}_${p.week_number}`] || proofs[p.nim] || null;
      return {
        ...p,
        proof_image: proofInfo ? proofInfo.image : null,
        proof_note: proofInfo ? proofInfo.note : null,
        upload_time: proofInfo ? (proofInfo.timestamp || proofInfo.date) : p.payment_date
      };
    });
  },

  // Ambil semua pembayaran berstatus 'Menunggu Konfirmasi' (untuk Admin)
  async getPendingPayments() {
    // 1. Ambil records di weekly_payments yang statusnya 'Menunggu Konfirmasi'
    const { data: payments, error: pErr } = await db
      .from('weekly_payments')
      .select('*')
      .eq('status', 'Menunggu Konfirmasi')
      .order('payment_date', { ascending: false });

    if (pErr) throw pErr;
    if (!payments || payments.length === 0) return [];

    // 2. Ambil data mahasiswa terkait
    const nims = [...new Set(payments.map(p => p.nim).filter(Boolean))];
    const studentMap = {};

    if (nims.length > 0) {
      try {
        const { data: students } = await db
          .from('students')
          .select('nim, nama, kelas')
          .in('nim', nims);
        (students || []).forEach(s => { studentMap[s.nim] = s; });
      } catch (e) {
        console.warn('Could not fetch students detail:', e);
      }
    }

    // 3. Ambil data bukti transfer yang tersimpan di proof storage
    const proofs = this.getStoredProofs();

    return payments.map(p => {
      const known = this.KNOWN_STUDENTS[p.nim] || {};
      const student = studentMap[p.nim] || {
        nama: known.nama || ('Mahasiswa ' + p.nim),
        kelas: known.kelas || '-'
      };
      const proofInfo = proofs[`${p.nim}_${p.week_number}`] || proofs[p.nim] || null;
      return {
        ...p,
        nama: student.nama,
        kelas: student.kelas,
        proof_image: proofInfo ? proofInfo.image : null,
        proof_note: proofInfo ? proofInfo.note : null
      };
    });
  },

  // Ambil semua pembayaran berstatus 'Lunas' yang sudah disetujui (untuk Log Histori Admin)
  async getApprovedPaymentHistory() {
    const { data: payments, error: pErr } = await db
      .from('weekly_payments')
      .select('*')
      .eq('status', 'Lunas')
      .order('payment_date', { ascending: false });

    if (pErr) throw pErr;
    if (!payments || payments.length === 0) return [];

    const nims = [...new Set(payments.map(p => p.nim).filter(Boolean))];
    const studentMap = {};

    if (nims.length > 0) {
      try {
        const { data: students } = await db
          .from('students')
          .select('nim, nama, kelas')
          .in('nim', nims);
        (students || []).forEach(s => { studentMap[s.nim] = s; });
      } catch (e) {
        console.warn('Could not fetch students detail for history:', e);
      }
    }

    const proofs = this.getStoredProofs();

    return payments.map(p => {
      const known = this.KNOWN_STUDENTS[p.nim] || {};
      const student = studentMap[p.nim] || {
        nama: known.nama || ('Mahasiswa ' + p.nim),
        kelas: known.kelas || '-'
      };
      const proofInfo = proofs[`${p.nim}_${p.week_number}`] || proofs[p.nim] || null;
      return {
        ...p,
        nama: student.nama,
        kelas: student.kelas,
        proof_image: proofInfo ? proofInfo.image : null,
        proof_note: proofInfo ? proofInfo.note : null
      };
    });
  },

  // Mahasiswa submit pembayaran minggu tertentu
  async submitWeeklyPayment(nim, selectedWeeks, paymentDate, proofImage = null, proofNote = '') {
    if (!selectedWeeks || selectedWeeks.length === 0) {
      throw new Error('Pilih minimal 1 minggu yang ingin dibayar.');
    }

    const now = new Date();
    const timeStr = [
      String(now.getHours()).padStart(2, '0'),
      String(now.getMinutes()).padStart(2, '0'),
      String(now.getSeconds()).padStart(2, '0')
    ].join(':');

    let dateVal;
    if (paymentDate) {
      dateVal = paymentDate.includes('T') ? paymentDate : `${paymentDate}T${timeStr}`;
    } else {
      dateVal = now.toISOString();
    }

    // Simpan proof image & note ke local proof cache agar Sekretaris bisa melihat
    const proofs = this.getStoredProofs();
    const batchProof = {
      nim,
      weeks: selectedWeeks,
      date: dateVal,
      image: proofImage,
      note: proofNote,
      timestamp: dateVal
    };
    proofs[nim] = batchProof;
    selectedWeeks.forEach(w => {
      proofs[`${nim}_${w}`] = batchProof;
    });
    this.saveStoredProofs(proofs);

    // Update / Insert di Supabase weekly_payments
    // Cek record eksisting terlebih dahulu untuk masing-masing minggu
    const { data: existing, error: eErr } = await db
      .from('weekly_payments')
      .select('*')
      .eq('nim', nim)
      .in('week_number', selectedWeeks);

    if (eErr) throw eErr;

    const existingMap = {};
    (existing || []).forEach(e => { existingMap[e.week_number] = e; });

    const toUpdate = [];
    const toInsert = [];

    selectedWeeks.forEach(w => {
      if (existingMap[w]) {
        toUpdate.push({
          id: existingMap[w].id,
          status: 'Menunggu Konfirmasi',
          amount: CONFIG.WEEKLY_DUES,
          payment_date: dateVal
        });
      } else {
        toInsert.push({
          nim,
          week_number: w,
          amount: CONFIG.WEEKLY_DUES,
          status: 'Menunggu Konfirmasi',
          payment_date: dateVal
        });
      }
    });

    // Jalankan updates
    for (const item of toUpdate) {
      const { error } = await db
        .from('weekly_payments')
        .update({
          status: item.status,
          amount: item.amount,
          payment_date: item.payment_date
        })
        .eq('id', item.id);
      if (error) console.error('Error updating payment', item.id, error);
    }

    // Jalankan inserts
    if (toInsert.length > 0) {
      const { error } = await db
        .from('weekly_payments')
        .insert(toInsert);
      if (error) throw error;
    }

    return { success: true, count: selectedWeeks.length };
  },

  // Admin verifikasi pembayaran per ID (menjadi 'Lunas')
  async verifyPayment(paymentId) {
    const { data, error } = await db
      .from('weekly_payments')
      .update({ 
        status: 'Lunas',
        payment_date: new Date().toISOString()
      })
      .eq('id', paymentId)
      .select();

    if (error) throw error;
    return data;
  },

  // Admin tolak pembayaran per ID (menjadi 'Ditolak')
  async rejectPayment(paymentId) {
    const { data, error } = await db
      .from('weekly_payments')
      .update({ status: 'Ditolak' })
      .eq('id', paymentId)
      .select();

    if (error) throw error;
    return data;
  },

  // Admin verifikasi massal
  async verifyMultiplePayments(paymentIds) {
    if (!paymentIds || paymentIds.length === 0) return [];
    const { data, error } = await db
      .from('weekly_payments')
      .update({ 
        status: 'Lunas',
        payment_date: new Date().toISOString()
      })
      .in('id', paymentIds)
      .select();

    if (error) throw error;
    return data;
  },

  // Admin update status manual per cell di matriks (Lunas / Belum Lunas / Menunggu Konfirmasi)
  async toggleCellStatus(nim, weekNumber, currentStatus) {
    let newStatus = 'Lunas';
    if (currentStatus === 'Lunas') {
      newStatus = 'Belum Lunas';
    } else if (currentStatus === 'Belum Lunas') {
      newStatus = 'Lunas';
    } else {
      newStatus = 'Lunas';
    }

    const today = new Date().toISOString();

    // Cek apakah record sudah ada
    const { data: existing } = await db
      .from('weekly_payments')
      .select('id')
      .eq('nim', nim)
      .eq('week_number', weekNumber)
      .maybeSingle();

    if (existing) {
      const { data, error } = await db
        .from('weekly_payments')
        .update({
          status: newStatus,
          payment_date: newStatus === 'Lunas' ? today : null
        })
        .eq('id', existing.id)
        .select();
      if (error) throw error;
      return { status: newStatus, id: existing.id };
    } else {
      const { data, error } = await db
        .from('weekly_payments')
        .insert([{
          nim,
          week_number: weekNumber,
          amount: CONFIG.WEEKLY_DUES,
          status: newStatus,
          payment_date: newStatus === 'Lunas' ? today : null
        }])
        .select();
      if (error) throw error;
      return { status: newStatus, id: data[0].id };
    }
  },

  // Ambil data matriks global untuk Admin (semua mahasiswa + pembayaran)
  async getMatrixData(kelas = 'all') {
    const students = await this.getStudents(kelas);
    const nims = students.map(s => s.nim);

    if (nims.length === 0) {
      return { students: [], paymentMap: {} };
    }

    const { data: payments, error } = await db
      .from('weekly_payments')
      .select('*');

    if (error) throw error;

    // Build map: paymentMap[nim][week_number] = paymentObject
    const paymentMap = {};
    students.forEach(s => {
      paymentMap[s.nim] = {};
    });

    (payments || []).forEach(p => {
      if (!paymentMap[p.nim]) paymentMap[p.nim] = {};
      paymentMap[p.nim][p.week_number] = p;
    });

    return { students, paymentMap };
  },

  // Statistik agregat untuk Admin
  async getAdminStats() {
    const [studentsRes, paymentsRes, pendingRes] = await Promise.all([
      db.from('students').select('*', { count: 'exact', head: true }).neq('role', 'admin'),
      db.from('weekly_payments').select('amount').eq('status', 'Lunas'),
      db.from('weekly_payments').select('*', { count: 'exact', head: true }).eq('status', 'Menunggu Konfirmasi')
    ]);

    const totalStudents = studentsRes.count || 0;
    const totalCollected = (paymentsRes.data || []).reduce((sum, p) => sum + (p.amount || 0), 0);
    const pendingCount = pendingRes.count || 0;
    const targetTotal = totalStudents * CONFIG.TOTAL_WEEKS * CONFIG.WEEKLY_DUES;
    const percentage = targetTotal > 0 ? ((totalCollected / targetTotal) * 100).toFixed(1) : 0;

    return {
      totalStudents,
      totalCollected,
      pendingCount,
      targetTotal,
      percentage
    };
  },

  // Helper Proof Storage (client-side persistency)
  getStoredProofs() {
    try {
      const data = localStorage.getItem(CONFIG.PROOF_STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      return {};
    }
  },

  saveStoredProofs(proofs) {
    try {
      localStorage.setItem(CONFIG.PROOF_STORAGE_KEY, JSON.stringify(proofs));
    } catch (e) {
      console.warn('Could not save proof locally (storage full)');
    }
  }
};

// ------------------------------------------------------------
// UTILITY HELPERS
// ------------------------------------------------------------
const Utils = {
  formatRupiah(amount) {
    if (amount === undefined || amount === null) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  },

  formatDate(dateStr) {
    if (!dateStr) return '-';
    try {
      let d;
      if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const [y, m, day] = dateStr.split('-').map(Number);
        d = new Date(y, m - 1, day);
      } else {
        d = new Date(dateStr);
      }
      if (isNaN(d.getTime())) return dateStr;

      const datePart = d.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });

      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const seconds = String(d.getSeconds()).padStart(2, '0');

      return `${datePart} • ${hours}:${minutes}:${seconds} WIB`;
    } catch (e) {
      return dateStr;
    }
  },

  showToast(message, type = 'info') {
    const existing = document.getElementById('kas-toast');
    if (existing) existing.remove();

    const colors = {
      success: 'bg-emerald-600 text-white border-emerald-700',
      error: 'bg-rose-600 text-white border-rose-700',
      warning: 'bg-amber-600 text-white border-amber-700',
      info: 'bg-indigo-600 text-white border-indigo-700'
    };

    const icons = {
      success: '<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>',
      error: '<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>',
      warning: '<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>',
      info: '<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
    };

    const toast = document.createElement('div');
    toast.id = 'kas-toast';
    toast.className = `fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border text-sm font-medium transition-all duration-300 transform translate-y-10 opacity-0 ${colors[type] || colors.info}`;
    toast.innerHTML = `
      ${icons[type] || icons.info}
      <span>${message}</span>
    `;

    document.body.appendChild(toast);
    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-10', 'opacity-0');
      toast.classList.add('translate-y-0', 'opacity-100');
    });

    setTimeout(() => {
      toast.classList.add('translate-y-10', 'opacity-0');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  },

  // SVG QRIS Generator bawaan agar tidak tergantung file external
  getQRISDataUri(amount = 0) {
    // Return SVG data URI dengan badge QRIS standar Indonesia
    const formattedAmount = this.formatRupiah(amount);
    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 480" width="100%" height="100%" style="background:#fff; border-radius:16px; font-family:system-ui, -apple-system, sans-serif;">
      <!-- QRIS Header -->
      <rect x="0" y="0" width="400" height="70" fill="#dc2626"/>
      <text x="200" y="44" fill="#ffffff" font-size="24" font-weight="900" text-anchor="middle" letter-spacing="3">QRIS</text>
      <text x="200" y="60" fill="#fee2e2" font-size="9" text-anchor="middle">QR KODE STANDAR PEMBAYARAN NASIONAL</text>

      <!-- Merchant Info -->
      <text x="200" y="100" fill="#0f172a" font-size="14" font-weight="700" text-anchor="middle">KAS ANGKATAN KIMIA 2026</text>
      <text x="200" y="118" fill="#64748b" font-size="11" text-anchor="middle">NMID : ID1026181030999 | KELAS G, H, I</text>

      <!-- Amount Tag -->
      <rect x="50" y="132" width="300" height="34" rx="8" fill="#f8fafc" stroke="#e2e8f0"/>
      <text x="200" y="154" fill="#4338ca" font-size="14" font-weight="700" text-anchor="middle">Nominal: ${amount > 0 ? formattedAmount : 'Sesuai Jumlah Minggu'}</text>

      <!-- Realistic Stylized QR Code Matrix -->
      <g transform="translate(70, 180)">
        <!-- Outer Box -->
        <rect width="260" height="220" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5" rx="12"/>

        <!-- Top Left Position Detection Pattern -->
        <rect x="20" y="20" width="56" height="56" fill="#0f172a" rx="6"/>
        <rect x="28" y="28" width="40" height="40" fill="#ffffff" rx="4"/>
        <rect x="36" y="36" width="24" height="24" fill="#0f172a" rx="2"/>

        <!-- Top Right Position Detection Pattern -->
        <rect x="184" y="20" width="56" height="56" fill="#0f172a" rx="6"/>
        <rect x="192" y="28" width="40" height="40" fill="#ffffff" rx="4"/>
        <rect x="200" y="36" width="24" height="24" fill="#0f172a" rx="2"/>

        <!-- Bottom Left Position Detection Pattern -->
        <rect x="20" y="144" width="56" height="56" fill="#0f172a" rx="6"/>
        <rect x="28" y="152" width="40" height="40" fill="#ffffff" rx="4"/>
        <rect x="36" y="160" width="24" height="24" fill="#0f172a" rx="2"/>

        <!-- Center Branding Icon (Chemistry Flask / Aerogel) -->
        <circle cx="130" cy="110" r="22" fill="#4f46e5"/>
        <path d="M125 99 L135 99 M130 99 L130 106 L120 121 A 3 3 0 0 0 123 125 L137 125 A 3 3 0 0 0 140 121 L130 106" stroke="#ffffff" stroke-width="2.5" fill="none" stroke-linejoin="round"/>
        <circle cx="128" cy="118" r="1.5" fill="#ffffff"/>
        <circle cx="132" cy="115" r="1.5" fill="#ffffff"/>

        <!-- Simulated Data Grid Dots -->
        <g fill="#1e293b">
          <rect x="88" y="22" width="8" height="8" rx="1.5"/>
          <rect x="104" y="22" width="16" height="8" rx="1.5"/>
          <rect x="128" y="22" width="8" height="8" rx="1.5"/>
          <rect x="144" y="22" width="8" height="8" rx="1.5"/>
          <rect x="160" y="22" width="16" height="8" rx="1.5"/>

          <rect x="88" y="38" width="16" height="8" rx="1.5"/>
          <rect x="120" y="38" width="8" height="8" rx="1.5"/>
          <rect x="136" y="38" width="16" height="8" rx="1.5"/>
          <rect x="168" y="38" width="8" height="8" rx="1.5"/>

          <rect x="88" y="54" width="8" height="8" rx="1.5"/>
          <rect x="112" y="54" width="16" height="8" rx="1.5"/>
          <rect x="144" y="54" width="24" height="8" rx="1.5"/>

          <rect x="22" y="88" width="8" height="16" rx="1.5"/>
          <rect x="38" y="88" width="16" height="8" rx="1.5"/>
          <rect x="62" y="88" width="8" height="8" rx="1.5"/>
          <rect x="78" y="88" width="16" height="8" rx="1.5"/>
          <rect x="168" y="88" width="16" height="8" rx="1.5"/>
          <rect x="192" y="88" width="8" height="8" rx="1.5"/>
          <rect x="208" y="88" width="16" height="8" rx="1.5"/>

          <rect x="22" y="112" width="16" height="8" rx="1.5"/>
          <rect x="46" y="112" width="8" height="16" rx="1.5"/>
          <rect x="62" y="112" width="16" height="8" rx="1.5"/>
          <rect x="184" y="112" width="8" height="8" rx="1.5"/>
          <rect x="200" y="112" width="16" height="16" rx="1.5"/>
          <rect x="224" y="112" width="16" height="8" rx="1.5"/>

          <rect x="88" y="144" width="16" height="8" rx="1.5"/>
          <rect x="112" y="144" width="8" height="16" rx="1.5"/>
          <rect x="128" y="144" width="16" height="8" rx="1.5"/>
          <rect x="152" y="144" width="8" height="8" rx="1.5"/>
          <rect x="168" y="144" width="16" height="16" rx="1.5"/>
          <rect x="192" y="144" width="16" height="8" rx="1.5"/>
          <rect x="216" y="144" width="16" height="8" rx="1.5"/>

          <rect x="88" y="168" width="8" height="8" rx="1.5"/>
          <rect x="104" y="168" width="16" height="8" rx="1.5"/>
          <rect x="128" y="168" width="8" height="16" rx="1.5"/>
          <rect x="144" y="168" width="16" height="8" rx="1.5"/>
          <rect x="200" y="168" width="8" height="8" rx="1.5"/>
          <rect x="216" y="168" width="16" height="16" rx="1.5"/>

          <rect x="88" y="192" width="24" height="8" rx="1.5"/>
          <rect x="120" y="192" width="8" height="8" rx="1.5"/>
          <rect x="136" y="192" width="16" height="8" rx="1.5"/>
          <rect x="160" y="192" width="24" height="8" rx="1.5"/>
          <rect x="192" y="192" width="8" height="8" rx="1.5"/>
        </g>
      </g>

      <!-- Footer Brands Supported -->
      <g transform="translate(50, 420)">
        <text x="150" y="12" fill="#94a3b8" font-size="10" text-anchor="middle" font-weight="500">Mendukung: BCA, Mandiri, BRI, BNI, GoPay, OVO, ShopeePay, DANA</text>
        <text x="150" y="28" fill="#4f46e5" font-size="9" text-anchor="middle" font-weight="600">Scan menggunakan aplikasi mobile banking atau e-wallet apa saja</text>
      </g>
    </svg>
    `;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }
};

// Global expose
window.CONFIG = CONFIG;
window.Auth = Auth;
window.KasDB = KasDB;
window.Utils = Utils;