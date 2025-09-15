-----

# Instagram Story & Feed Sniper Bot

Bot Node.js sederhana untuk memantau akun Instagram tertentu dan mengirimkan notifikasi ke API WhatsApp saat ada konten baru yang sesuai dengan kriteria.

  

## ✨ Fitur Utama

  - **Pemantau Story**: Secara otomatis mendeteksi story baru dari akun target yang mengandung **link** (baik swipe-up maupun stiker).
  - **Pemantau Feed**: Mendeteksi postingan feed baru dari akun target yang **caption-nya mengandung kata kunci** tertentu.
  - **Notifikasi WhatsApp**: Mengirimkan pemberitahuan instan ke endpoint API WhatsApp Bot Anda, lengkap dengan fitur *tag all*.
  - **Anti-Duplikat**: Menyimpan riwayat konten yang sudah terkirim (`seen.json` & `seen-feeds.json`) untuk memastikan tidak ada notifikasi ganda.
  - **Login Persisten**: Menggunakan file sesi (`ig-session.json`) untuk menghindari login berulang kali dan mengurangi risiko akun ditandai.
  - **Konfigurasi Mudah**: Semua pengaturan (kredensial, target, kata kunci) dikelola melalui file `.env`.

-----

## 🛠️ Persiapan & Instalasi

Pastikan Anda memiliki [Node.js](https://nodejs.org/) (versi 18 atau lebih tinggi) dan npm terinstal di server atau komputer Anda.

1.  **Clone Repositori**

    ```bash
    git clone [https://github.com/Irfan225/Instagram-snipper]
    cd Instagram-snipper
    ```

2.  **Instalasi Dependensi**
    Jalankan perintah berikut untuk menginstal semua library yang dibutuhkan.

    ```bash
    npm install
    ```

3.  **Konfigurasi Environment**
    Salin file `.env.example` menjadi `.env` dan sesuaikan nilainya.

    ```bash
    cp .env.example .env
    ```

    Buka file `.env` dan isi semua variabel yang diperlukan:

      - `IG_USERNAME` & `IG_PASSWORD`: Kredensial akun Instagram yang akan digunakan.
      - `WA_BOT_ENDPOINT`: Alamat URL API WhatsApp Bot Anda.
      - `TARGET_ACCOUNTS`: Daftar akun Instagram yang ingin dipantau, pisahkan dengan koma.
      - `FILTER_KEYWORDS`: Kata kunci untuk filter caption feed, pisahkan dengan koma.
      - `POLL_INTERVAL_MS`: Interval pengecekan dalam milidetik (misal: `60000` untuk 1 menit).

-----

## 🚀 Menjalankan Bot

Untuk menjalankan bot, cukup gunakan perintah berikut dari terminal di dalam direktori proyek:

```bash
npm start
```

Bot akan mulai berjalan, melakukan login awal, dan mulai memantau akun target sesuai interval yang telah ditentukan. Semua aktivitas akan ditampilkan di console.

### Menjalankan di Latar Belakang (Rekomendasi)

Untuk produksi atau penggunaan jangka panjang di server, sangat disarankan menggunakan manajer proses seperti **PM2** agar bot tetap berjalan 24/7.

1.  **Instalasi PM2 (jika belum ada):**
    ```bash
    npm install pm2 -g
    ```
2.  **Jalankan dengan PM2:**
    ```bash
    pm2 start npm --name "ig-sniper" -- start
    ```
3.  **Memantau Log:**
    ```bash
    pm2 logs ig-sniper
    ```

-----

## 📝 Catatan Tambahan

  - **Keamanan Akun**: Menggunakan bot untuk mengotomatisasi interaksi dengan Instagram memiliki risiko. Gunakan dengan bijak dan pertimbangkan untuk menggunakan akun sekunder. Menaikkan `POLL_INTERVAL_MS` ke nilai yang lebih tinggi (misalnya 5-10 menit) dapat mengurangi risiko akun ditandai.
  - **Sesi Login**: Jika Anda mengalami masalah login, coba hapus file `ig-session.json` untuk memaksa bot melakukan login ulang penuh.

-----
