// backend/setup-database.js
const mysql = require('mysql2');
require('dotenv').config();

const connection = mysql.createConnection({
    host: process.env.MYSQLHOST || 'localhost',
    user: process.env.MYSQLUSER || 'root',
    password: process.env.MYSQLPASSWORD || '',
    port: process.env.MYSQLPORT || 3306
});

async function setupDatabase() {
    try {
        // Create database
        await connection.promise().query(
            `CREATE DATABASE IF NOT EXISTS ${process.env.MYSQLDATABASE || 'diabetes_db'}`
        );
        
        console.log('✅ Database created/verified');
        
        // Use database
        await connection.promise().query(
            `USE ${process.env.MYSQLDATABASE || 'diabetes_db'}`
        );
        
        // Create tables
        const tables = [
            // Admin table
            `CREATE TABLE IF NOT EXISTS admin (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(50) UNIQUE NOT NULL,
                sandi VARCHAR(100) NOT NULL,
                nama_lengkap VARCHAR(100),
                email VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,
            
            // Users table
            `CREATE TABLE IF NOT EXISTS users (
                id INT PRIMARY KEY AUTO_INCREMENT,
                nama_lengkap VARCHAR(100) NOT NULL,
                email VARCHAR(100),
                tanggal_lahir DATE,
                jenis_kelamin ENUM('Laki-laki', 'Perempuan'),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,
            
            // Symptoms table
            `CREATE TABLE IF NOT EXISTS symptoms (
                id INT PRIMARY KEY AUTO_INCREMENT,
                kode VARCHAR(20) UNIQUE NOT NULL,
                nama_gejala TEXT NOT NULL,
                kategori VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,
            
            // Diagnoses table
            `CREATE TABLE IF NOT EXISTS diagnoses (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT,
                skor_akhir DECIMAL(5,2),
                tingkat_risiko ENUM('Rendah', 'Sedang', 'Tinggi'),
                gejala_terpilih TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            )`,
            
            // Recommendations table
            `CREATE TABLE IF NOT EXISTS recommendations (
                id INT PRIMARY KEY AUTO_INCREMENT,
                tingkat_risiko ENUM('Rendah', 'Sedang', 'Tinggi') NOT NULL,
                rekomendasi TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`
        ];
        
        for (const tableSql of tables) {
            await connection.promise().query(tableSql);
        }
        
        console.log('✅ All tables created/verified');
        
        // Insert sample admin (username: admin, password: admin123)
        await connection.promise().query(`
            INSERT IGNORE INTO admin (name, sandi, nama_lengkap, email) 
            VALUES ('admin', 'admin123', 'Administrator', 'admin@diabetes.com')
        `);
        
        // Insert sample symptoms
        const sampleSymptoms = [
            ['G001', 'Sering haus dan banyak minum', 'Gejala Umum'],
            ['G002', 'Sering buang air kecil', 'Gejala Umum'],
            ['G003', 'Cepat lapar', 'Gejala Umum'],
            ['G004', 'Penurunan berat badan tanpa sebab', 'Gejala Umum'],
            ['G005', 'Penglihatan kabur', 'Gejala Lanjut']
        ];
        
        for (const symptom of sampleSymptoms) {
            await connection.promise().query(`
                INSERT IGNORE INTO symptoms (kode, nama_gejala, kategori) 
                VALUES (?, ?, ?)
            `, symptom);
        }
        
        // Insert sample recommendations
        const sampleRecommendations = [
            ['Rendah', 'Pertahankan pola makan sehat dan rutin berolahraga'],
            ['Sedang', 'Periksa gula darah rutin dan konsultasi dengan dokter'],
            ['Tinggi', 'Segera konsultasi dengan dokter spesialis dan lakukan pemeriksaan lengkap']
        ];
        
        for (const rec of sampleRecommendations) {
            await connection.promise().query(`
                INSERT IGNORE INTO recommendations (tingkat_risiko, rekomendasi) 
                VALUES (?, ?)
            `, rec);
        }
        
        console.log('✅ Sample data inserted');
        console.log('🎉 Database setup completed successfully!');
        
    } catch (error) {
        console.error('❌ Database setup error:', error);
    } finally {
        connection.end();
    }
}

setupDatabase();
