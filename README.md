# DISCORD BOT ENTERPRISE EDITION
> Arsitektur Modular, Skalabel, Database-Driven, Web Dashboard, dan Siap Produksi 24/7 di Ubuntu Server dengan PM2.

---

## 📌 Daftar Isi
1. [Tentang Proyek](#-tentang-proyek)
2. [Teknologi Utama](#-teknologi-utama)
3. [Arsitektur Direktori](#-arsitektur-direktori)
4. [Privileged Gateway Intents (Discord Developer Portal)](#-privileged-gateway-intents)
5. [Instalasi & Menjalankan Lokal](#-instalasi--menjalankan-lokal)
6. [Panduan Registrasi Slash Commands](#-panduan-registrasi-slash-commands)
7. [Panduan Deployment Ubuntu Server & PM2](#-panduan-deployment-ubuntu-server--pm2)
8. [Panduan Backup & Restore Database](#-panduan-backup--restore-database)
9. [Fitur Lengkap Bot](#-fitur-lengkap-bot)
10. [Web Admin Dashboard](#-web-admin-dashboard)
11. [Panduan Troubleshooting](#-panduan-troubleshooting)

---

## 🚀 Tentang Proyek

**Discord Bot Enterprise Edition** dirancang dengan standar arsitektur perangkat lunak enterprise:
- **Clean Architecture & Repository Pattern**: Seluruh akses data database diisolasi di layer repositories (`src/repositories/`), memisahkan logika bisnis dari library database.
- **ACID Transaction & Concurrency Safe**: Mencegah race condition pada pemberian XP, transaksi saldo ekonomi virtual, penambahan tiket beruntun, serta pendaftaran giveaway.
- **Idempotent Background Scheduler**: Pemulihan giveaway dan pengingat (reminder) otomatis pasca restart tanpa duplicate notifications.
- **Role Hierarchy & Permission Guard**: Melindungi server dari abuse; moderator tidak dapat menindak dirinya sendiri, bot tidak dapat menindak peran di atasnya, dan Server Owner kebal moderasi.
- **Web Admin Dashboard**: Dashboard modern dark-mode dengan autentikasi Discord OAuth2, proteksi sesi aman, dan otorisasi Administrator level server.

---

## 🛠 Teknologi Utama

| Komponen | Teknologi | Keterangan |
| :--- | :--- | :--- |
| **Runtime** | Node.js v20+ LTS (Tested on v24) | High-performance asynchronous event loop |
| **Discord API** | `discord.js` v14.18.0 | Gateway v10, Application Slash Commands & Components |
| **Module System** | ES Modules (ESM) | Modern native JavaScript imports |
| **Database & ORM**| PostgreSQL / MySQL + Prisma ORM v6 | Schema migration, connection pooling, indexed queries |
| **Validation** | Zod v3 | Strict schema validation saat startup dan request API |
| **Logging** | Pino v9 + Pino-Pretty | Structured JSON logging dengan otomatisasi redaksi rahasia |
| **Web Dashboard** | Express.js + EJS + Helmet | Rate limiting, Session cookies, CSRF-safe |
| **Process Manager**| PM2 | Fork mode, cluster-safe, auto-restart, log management |
| **Test Suite** | Vitest v3 + Supertest | Unit & Integration testing |

---

## 📂 Arsitektur Direktori

```text
discord-bot/
├── src/
│   ├── index.js                  # Entry point aplikasi (Bot + Web Dashboard)
│   ├── bot.js                    # Kelas inisialisasi Discord Client & Loaders
│   ├── config/
│   │   ├── env.js                # Validasi environment variable dengan Zod
│   │   └── constants.js          # Warna, emoji, batas limit, terjemahan izin
│   ├── commands/                 # Slash commands per kategori modular
│   │   ├── utility/              # help, ping, botinfo, serverinfo, remind, poll, setup, dll.
│   │   ├── moderation/           # ban, kick, timeout, warn, purge, slowmode, massrole, dll.
│   │   ├── tickets/              # ticket-setup panel interaktif
│   │   ├── leveling/             # rank, leaderboard
│   │   ├── economy/              # balance, daily, weekly, work, shop, buy, inventory
│   │   └── giveaways/            # giveaway-create, giveaway-end, giveaway-reroll
│   ├── events/                   # Discord gateway event handlers (ready, interaction, message, dll.)
│   ├── interactions/
│   │   ├── buttons/              # Handler interaksi tombol (tiket, giveaway)
│   │   └── modals/               # Modal dialog submission handler
│   ├── services/                 # Business logic (moderation, welcome, antispam, tickets)
│   ├── repositories/             # Layer interaksi Prisma ORM & caching
│   ├── schedulers/
│   │   └── jobManager.js         # Interval background job (giveaways, reminders)
│   ├── database/
│   │   └── client.js             # PrismaClient singleton & graceful disconnection
│   ├── dashboard/                # Web Admin Express Server
│   │   ├── server.js             # Setup Express, Helmet, Session, Rate Limit
│   │   ├── middleware/           # Autentikasi sesi & otorisasi Administrator
│   │   ├── routes/               # OAuth2 Discord auth, Web Pages, REST API
│   │   └── views/                # EJS templates (landing page, server selector, dashboard)
│   └── utils/                    # Logger Pino, Embed builder, Time parser, Permission guard
├── prisma/
│   └── schema.prisma             # Skema Prisma lengkap dengan indeks dan relasi
├── scripts/
│   └── deploy-commands.js        # Script registrasi slash commands terisolasi
├── tests/                        # Vitest unit & integration test suites
├── logs/                         # File log PM2 dan bot
├── ecosystem.config.cjs          # Konfigurasi proses PM2 untuk server Ubuntu
├── .env.example                  # Template konfigurasi environment aman
└── package.json
```

---

## 🔑 Privileged Gateway Intents

Sebelum menjalankan bot, Anda **WAJIB** mengaktifkan Privileged Intents di [Discord Developer Portal](https://discord.com/developers/applications):

1. Masuk ke aplikasi bot Anda di Discord Developer Portal.
2. Pilih menu **Bot** pada bilah sisi kiri.
3. Gulir ke bawah ke bagian **Privileged Gateway Intents**:
   - ✅ **SERVER MEMBERS INTENT**: Wajib aktif untuk membaca daftar anggota saat `/serverinfo`, sistem auto-role, welcome message, dan proteksi hirarki.
   - ✅ **MESSAGE CONTENT INTENT**: Wajib aktif untuk sistem leveling XP pesan, deteksi flood anti-spam, dan respon AFK otomatis.
4. Klik **Save Changes**.

---

## 💻 Instalasi & Menjalankan Lokal

### 1. Prasyarat
- Node.js versi 20.0.0 ke atas.
- npm versi 10 ke atas.
- Database PostgreSQL (atau MySQL) yang dapat diakses.

### 2. Kloning & Instal Dependensi
```bash
git clone <url-repository-anda>
cd BOT-DC
npm install
```

### 3. Konfigurasi Environment (`.env`)
Salin file `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```
Isi variabel penting pada `.env`:
```env
NODE_ENV=development
LOG_LEVEL=debug
DISCORD_TOKEN=MTAy...token_bot_anda
DISCORD_CLIENT_ID=123456789012345678
DISCORD_GUILD_ID=123456789012345678 # Opsional untuk uji coba instan
DATABASE_URL="postgresql://bot_user:password@localhost:5432/discord_bot?schema=public"

# Dashboard
DASHBOARD_ENABLED=true
DASHBOARD_PORT=3000
DASHBOARD_BASE_URL=http://localhost:3000
DASHBOARD_SESSION_SECRET=kunci_rahasia_acak_minimal_32_karakter
DISCORD_CLIENT_SECRET=secret_oauth_dari_developer_portal
```

### 4. Generate Prisma Client & Migrasi Database
```bash
npm run prisma:generate
npx prisma db push # Atau: npm run prisma:migrate
```

### 5. Jalankan Pengujian Otomatis
```bash
npm test
```

### 6. Registrasi Slash Commands
- Untuk pengujian instan di server privat (Guild Command):
  ```bash
  npm run deploy:commands:guild
  ```
- Untuk mendaftarkan perintah ke seluruh server (Global Command, butuh beberapa menit propagate di Discord):
  ```bash
  npm run deploy:commands
  ```

### 7. Jalankan Bot
```bash
# Mode pengembangan dengan auto-reload:
npm run dev

# Atau mode standar:
npm start
```

---

## 🐧 Panduan Deployment Ubuntu Server & PM2

Berikut adalah prosedur langkah-demi-langkah memasang dan menjalankan bot pada Ubuntu Server 22.04 / 24.04 LTS:

### Langkah 1: Update Server & Pasang Node.js LTS
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential

# Pasang Node.js 20 LTS via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verifikasi versi
node -v
npm -v
```

### Langkah 2: Pasang Database PostgreSQL
```bash
sudo apt install -y postgresql postgresql-contrib

# Buat Database dan Pengguna
sudo -u postgres psql
```
Di dalam console PostgreSQL:
```sql
CREATE DATABASE discord_bot;
CREATE USER bot_user WITH ENCRYPTED PASSWORD 'GantiPasswordKuatIni123!';
GRANT ALL PRIVILEGES ON DATABASE discord_bot TO bot_user;
\q
```

### Langkah 3: Pasang PM2 Secara Global
```bash
sudo npm install -g pm2
```

### Langkah 4: Siapkan Project di Ubuntu Server
```bash
cd /opt
sudo git clone <url-repo-anda> discord-bot
sudo chown -R $USER:$USER /opt/discord-bot
cd /opt/discord-bot

# Instal dependensi produksi secara bersih
npm ci --omit=dev

# Konfigurasi .env
cp .env.example .env
nano .env # Sesuaikan DISCORD_TOKEN, DATABASE_URL, dll.

# Generate Prisma Client & Migrate
npx prisma generate
npx prisma migrate deploy

# Deploy Slash Commands ke Discord
npm run deploy:commands
```

### Langkah 5: Jalankan Aplikasi Menggunakan PM2
File konfigurasi `ecosystem.config.cjs` telah dikonfigurasi dalam mode `fork` (menghindari duplikasi gateway), batas memori `600M`, dan restart backoff.

```bash
# Jalankan bot dengan konfigurasi production
pm2 start ecosystem.config.cjs --env production

# Periksa status proses
pm2 status

# Periksa log berjalan
pm2 logs discord-bot

# Simpan konfigurasi PM2 agar otomatis hidup kembali saat server reboot
pm2 save
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp /home/$USER
```

### Langkah 6: Log Rotation (Mencegah Hard Disk Penuh)
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

### Langkah 7: Update Aplikasi di Masa Mendatang
Jika Anda melakukan update kode dari Git:
```bash
cd /opt/discord-bot
git pull
npm ci --omit=dev
npx prisma generate
npx prisma migrate deploy
npm run deploy:commands
pm2 reload discord-bot
```

---

## 💾 Panduan Backup & Restore Database

### 1. Backup PostgreSQL
Jalankan perintah ini secara berkala (atau pasang di cron):
```bash
pg_dump -U bot_user -h localhost discord_bot > /opt/backups/discord_bot_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Restore PostgreSQL
Jika server mengalami kegagalan dan ingin mengembalikan data:
```bash
psql -U bot_user -h localhost -d discord_bot < /opt/backups/discord_bot_backup.sql
```

---

## 📋 Fitur Lengkap Bot

### 1. Moderasi & Anti-Abuse
- `/ban`, `/unban`, `/kick` dengan pencatatan audit log & nomor kasus sekuensial.
- `/timeout`, `/untimeout` berbasis Discord native timeout (maksimal 28 hari).
- `/warn`, `/warnings`, `/clearwarnings` sistem peringatan formal tercatat di database.
- `/purge` membersihkan hingga 100 pesan (menghormati batas Discord 14 hari).
- `/slowmode`, `/lock`, `/unlock` kontrol lalu lintas pesan saluran.
- `/nick` perubahan nickname dengan proteksi hirarki.
- `/case`, `/modlogs` pencarian riwayat pelanggaran.
- `/massrole` perubahan peran massal dengan rate-limited batching.
- **Automod**: Anti-flood spam, anti-mention spam, anti-raid spike protection, dan filter link undangan tak berizin.

### 2. Tiket Dukungan (Ticket Support System)
- `/ticket-setup` panel tiket interaktif dengan tombol `Buat Tiket`.
- Channel privat otomatis dengan permission terisolasi hanya untuk pelapor dan tim staf/admin.
- Tombol `Klaim Tiket`, `Tutup Tiket`, dan `Transkrip`.
- Penyimpanan berkas transkrip teks/HTML percakapan secara permanen.
- Batas maksimal 3 tiket terbuka per pengguna untuk mencegah spam tiket.

### 3. Leveling & XP
- Perolehan XP acak (15 - 25 XP) per pesan dengan jeda cooldown (default: 60s).
- Kurva matematika: $\text{Level} = \lfloor 0.1 \times \sqrt{\text{XP}} \rfloor$.
- Notifikasi Level-Up otomatis dan pembagian Role Reward otomatis sesuai konfigurasi server.
- `/rank` kartu profil peringkat pengguna.
- `/leaderboard` papan peringkat berhalaman (pagination).

### 4. Ekonomi Virtual Server
- Operasi saldo ACID aman terhadap race condition.
- `/balance` cek saldo dompet dan bank.
- `/daily` klaim hadiah harian (cooldown 24 jam).
- `/weekly` klaim bonus mingguan (cooldown 7 hari).
- `/work` bekerja mendapatkan upah (cooldown 1 jam).
- `/shop` & `/buy` katalog barang virtual dengan inventaris `/inventory`.

### 5. Giveaways
- `/giveaway-create` pembuatan giveaway interaktif berbasis tombol `Ikuti Giveaway`.
- Penyimpanan peserta unik di database (`GiveawayEntry` constraint).
- Pemilihan pemenang secara acak dan adil (Fisher-Yates shuffle algorithm).
- `/giveaway-end` mengakhiri giveaway lebih awal.
- `/giveaway-reroll` mengundi ulang pemenang baru dari peserta terdaftar.
- Pemulihan giveaway otomatis pasca restart bot tanpa efek ganda.

### 6. Utility & Fun Commands
- `/help`, `/ping`, `/botinfo`, `/serverinfo`, `/userinfo`, `/avatar`, `/uptime`, `/invite`, `/support`.
- `/report` mengirim laporan pengguna langsung ke saluran ModLog staf.
- `/suggestion` voting saran server dengan reaksi otomatis 👍/👎.
- `/poll` jajak pendapat hingga 5 pilihan interaktif.
- `/remind` pengingat database yang dieksekusi oleh JobManager scheduler.
- `/announce` pengumuman formal ke saluran publik.
- `/setup` konfigurasi cepat saluran dan role staf.
- `/calculate` kalkulator aritmatika aman (tanpa `eval`).
- `/choose`, `/coinflip`, `/dice`, `/quote`, `/8ball`, `/ship`, `/afk`, `/countdown`, `/embed-builder`, `/serverstats`.

---

## 🌐 Web Admin Dashboard

Dashboard berjalan di `http://localhost:3000` (atau domain Nginx Anda):
1. **Discord OAuth2**: Pengguna login dengan akun Discord mereka secara aman.
2. **Server Selector**: Menampilkan daftar server yang dikelola bot di mana pengguna memiliki hak `Administrator`.
3. **Konfigurasi Tabbed**:
   - Saluran ModLog, Peran Mod, Peran Admin.
   - Tombol toggle Automod (Anti-Spam, Anti-Raid, Link Filter).
   - Pengaturan sambutan (Welcome message, channel, auto-role).
   - Pengaturan rasio XP Leveling.
   - Tabel audit kasus moderasi terkini.
4. **Keamanan Sesi**: Dilindungi oleh Helmet, rate limiting per IP, cookie `httpOnly`, dan otorisasi ganda pada setiap endpoint API.

---

## ❓ Panduan Troubleshooting

| Masalah | Kemungkinan Penyebab | Solusi |
| :--- | :--- | :--- |
| **Error: Disallowed Intents** | Intents `GuildMembers` atau `MessageContent` belum diaktifkan di portal. | Buka Discord Developer Portal > Bot > Aktifkan **Server Members** dan **Message Content** Intents. |
| **Perintah Slash Tidak Muncul** | Belum menjalankan script deploy atau masih dalam proses propagate global. | Jalankan `npm run deploy:commands:guild` untuk pengujian instan di server pengembangan Anda. |
| **Hirarki Peran Ditolak** | Peran bot di Discord berada di bawah peran target yang ingin dimoderasi. | Buka Server Settings > Roles > Geser peran Bot ke posisi paling atas di atas peran anggota biasa. |
| **Prisma Database Connection Error** | Service PostgreSQL mati atau `DATABASE_URL` di `.env` salah. | Periksa `sudo systemctl status postgresql` dan pastikan kredensial di `.env` sudah benar. |
| **PM2 Bot Restart Loop** | Error sintaks atau token bot tidak valid. | Periksa log kesalahan dengan mengetik: `pm2 logs discord-bot --lines 100`. |

---

## 📄 Lisensi
Hak Cipta © 2026. Lisensi MIT. Dibuat untuk keandalan dan stabilitas tingkat enterprise.
