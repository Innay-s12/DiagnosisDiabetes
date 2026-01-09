// ==================== IMPORT & INIT ====================
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const mysql = require('mysql2');

const app = express();
const PORT = process.env.PORT || 3000;

});


// ==================== DATABASE CONNECTION ====================
const pool = mysql.createPool({
    host: process.env.MYSQLHOST || 'localhost',
    user: process.env.MYSQLUSER || 'root',
    password: process.env.MYSQLPASSWORD || '',
    database: process.env.MYSQLDATABASE || 'diabetes_db',
    port: process.env.MYSQLPORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const executeQuery = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        pool.query(sql, params, (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });
};

// ==================== MIDDLEWARE ====================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================== STATIC FILES ====================
// Pastikan folder 'public' atau 'frontend' berisi diagnosis.html, admin.html, dll.
app.use(express.static(path.join(__dirname, 'public'))); 
app.use(express.static(path.join(__dirname))); // Backup jika file ada di root

// ==================== API ENDPOINTS (DISESUAIKAN DENGAN HTML) ====================

// 1. Ambil Gejala (Sesuai dengan fetch('/gejala') di HTML Anda)
app.get('/gejala', async (req, res) => {
    try {
        // Sesuaikan nama tabel 'symptoms' atau 'gejala'
        const symptoms = await executeQuery('SELECT id, nama_gejala, bobot FROM symptoms ORDER BY id ASC');
        res.json({ success: true, data: symptoms });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 2. Proses Diagnosa (Sesuai dengan fetch('/diagnosa') di HTML Anda)
app.post('/diagnosa', async (req, res) => {
    const { nama_lengkap, usia, jenis_kelamin, gejala } = req.body;

    try {
        // A. Simpan atau Cari User (agar dapat user_id)
        let userResults = await executeQuery('SELECT id FROM users WHERE nama_lengkap = ?', [nama_lengkap]);
        let userId;

        if (userResults.length > 0) {
            userId = userResults[0].id;
        } else {
            const newUser = await executeQuery(
                'INSERT INTO users (nama_lengkap, usia, jenis_kelamin) VALUES (?, ?, ?)',
                [nama_lengkap, usia, jenis_kelamin]
            );
            userId = newUser.insertId;
        }

        // B. Logika Hitung Sederhana (Bisa diganti dengan rumus CF nantinya)
        const score = (gejala.length / 5) * 100; // Contoh: jika pilih 5 gejala, skor 100%
        let tingkat_risiko = 'Rendah';
        if (score > 70) tingkat_risiko = 'Tinggi';
        else if (score > 40) tingkat_risiko = 'Sedang';

        // C. Simpan ke tabel diagnoses
        await executeQuery(
            'INSERT INTO diagnoses (user_id, skor_akhir, tingkat_risiko, gejala_terpilih) VALUES (?, ?, ?, ?)',
            [userId, (score / 100), tingkat_risiko, JSON.stringify(gejala)]
        );

        // D. Kirim respon balik ke HTML
        res.json({
            success: true,
            skor_akhir: score / 100,
            tingkat_risiko: tingkat_risiko,
            diagnosis: `Berdasarkan gejala yang Anda alami, Anda memiliki risiko ${tingkat_risiko} terkena diabetes.`,
            rekomendasi: [
                { judul: "Konsultasi Dokter", deskripsi: "Segera hubungi dokter untuk tes gula darah (HBA1C)." },
                { judul: "Pola Makan", deskripsi: "Kurangi konsumsi karbohidrat olahan dan gula tinggi." }
            ]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Gagal memproses diagnosis" });
    }
});

// 3. Endpoint Dashboard Admin Tetap Dipertahankan
app.get('/api/stats', async (req, res) => {
    try {
        const [u, d, s] = await Promise.all([
            executeQuery('SELECT COUNT(*) as count FROM users'),
            executeQuery('SELECT COUNT(*) as count FROM diagnoses'),
            executeQuery('SELECT COUNT(*) as count FROM symptoms')
        ]);
        res.json({
            total_users: u[0].count,
            total_diagnoses: d[0].count,
            total_symptoms: s[0].count
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==================== SERVE HTML PAGES ====================
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'diagnosis.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));

// ==================== START SERVER ====================
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server berjalan di port ${PORT}`);
});
