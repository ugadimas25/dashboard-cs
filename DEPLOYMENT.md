# Panduan Deployment Farmforce Dashboard

Dokumentasi lengkap untuk deploy aplikasi Farmforce Dashboard secara lokal dan di Ubuntu Tencent Cloud.

## 📋 Daftar Isi

- [Prasyarat](#prasyarat)
- [Deployment Lokal](#deployment-lokal)
- [Deployment di Ubuntu Tencent Cloud](#deployment-di-ubuntu-tencent-cloud)
- [Konfigurasi Database](#konfigurasi-database)
- [Troubleshooting](#troubleshooting)

---

## 🔧 Prasyarat

### Untuk Development Lokal
- Node.js versi 18.x atau lebih tinggi
- npm atau yarn
- PostgreSQL 14 atau lebih tinggi
- Git

### Untuk Production (Ubuntu Tencent)
- Ubuntu 20.04 LTS atau lebih tinggi
- Akses root atau sudo
- Domain (opsional, tapi disarankan)
- SSL Certificate (jika menggunakan HTTPS)

---

## 💻 Deployment Lokal

### 1. Clone Repository

```bash
git clone <repository-url>
cd Farmforce-Dashboard
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Database PostgreSQL

#### Windows (menggunakan PostgreSQL installer):

1. Download dan install PostgreSQL dari https://www.postgresql.org/download/windows/
2. Buka pgAdmin atau psql
3. Buat database baru:

```sql
CREATE DATABASE farmforce_db;
CREATE USER farmforce_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE farmforce_db TO farmforce_user;
```

#### Linux/Mac:

```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Masuk ke PostgreSQL
sudo -u postgres psql

# Buat database dan user
CREATE DATABASE farmforce_db;
CREATE USER farmforce_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE farmforce_db TO farmforce_user;
\q
```

### 4. Konfigurasi Environment Variables

Buat file `.env` di root folder project:

```env
# Database Configuration
DATABASE_URL=postgresql://farmforce_user:your_password@localhost:5432/farmforce_db

# Server Configuration
NODE_ENV=development
PORT=5000

# Session Secret (ganti dengan string random yang aman)
SESSION_SECRET=your-secret-key-here
```

**Catatan:** Jangan commit file `.env` ke repository!

### 5. Push Database Schema

```bash
npm run db:push
```

### 6. Jalankan Development Server

```bash
npm run dev
```
**Catatan untuk Windows:** Script sudah menggunakan `cross-env` untuk kompatibilitas cross-platform. Pastikan semua dependencies terinstall dengan `npm install`.
Server akan berjalan di:
- Frontend: http://localhost:5000
- API: http://localhost:5000/api

Untuk development client saja:
```bash
npm run dev:client
```

### 7. Build untuk Production (Opsional)

```bash
npm run build
npm run start
```

---

## 🚀 Deployment di Ubuntu Tencent Cloud

### 1. Persiapan Server

#### Login ke Server

```bash
ssh root@your-server-ip
```

#### Update System

```bash
sudo apt update
sudo apt upgrade -y
```

### 2. Install Node.js

```bash
# Install Node.js 20.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verifikasi instalasi
node -v
npm -v
```

### 3. Install PostgreSQL

```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Start dan enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Konfigurasi database
sudo -u postgres psql

# Di dalam PostgreSQL prompt:
CREATE DATABASE farmforce_db;
CREATE USER farmforce_user WITH PASSWORD 'strong_password_here';
GRANT ALL PRIVILEGES ON DATABASE farmforce_db TO farmforce_user;
\q
```

### 4. Install PM2 (Process Manager)

```bash
sudo npm install -g pm2
```

### 5. Setup Aplikasi

#### Clone Repository

```bash
cd /var/www
sudo mkdir farmforce
sudo chown $USER:$USER farmforce
cd farmforce
git clone <repository-url> .
```

#### Install Dependencies

```bash
npm install
```

#### Konfigurasi Environment

```bash
nano .env
```

Isi dengan:

```env
# Database Configuration
DATABASE_URL=postgresql://farmforce_user:strong_password_here@localhost:5432/farmforce_db

# Server Configuration
NODE_ENV=production
PORT=5000

# Session Secret (gunakan string random yang kuat)
SESSION_SECRET=generate-random-secret-key-here
```

Simpan dengan `Ctrl + X`, lalu `Y`, lalu `Enter`.

**Tips untuk generate secret key:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### Push Database Schema

```bash
npm run db:push
```

#### Build Aplikasi

```bash
npm run build
```

### 6. Jalankan dengan PM2

```bash
# Start aplikasi
pm2 start npm --name "farmforce-dashboard" -- start

# Set PM2 untuk auto-start saat reboot
pm2 startup
pm2 save

# Cek status
pm2 status

# Lihat logs
pm2 logs farmforce-dashboard
```

### 7. Setup Nginx sebagai Reverse Proxy

#### Install Nginx

```bash
sudo apt install nginx -y
```

#### Konfigurasi Nginx

```bash
sudo nano /etc/nginx/sites-available/farmforce
```

Isi dengan konfigurasi berikut:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Redirect HTTP to HTTPS (setelah SSL disetup)
    # return 301 https://$server_name$request_uri;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### Aktifkan Konfigurasi

```bash
# Buat symbolic link
sudo ln -s /etc/nginx/sites-available/farmforce /etc/nginx/sites-enabled/

# Test konfigurasi
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Enable Nginx auto-start
sudo systemctl enable nginx
```

### 8. Setup SSL dengan Let's Encrypt (Opsional tapi Disarankan)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Dapatkan SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal test
sudo certbot renew --dry-run
```

### 9. Setup Firewall

```bash
# Allow SSH, HTTP, dan HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Cek status
sudo ufw status
```

### 10. Optimasi PostgreSQL untuk Production

```bash
sudo nano /etc/postgresql/14/main/postgresql.conf
```

Sesuaikan konfigurasi (contoh untuk server 2GB RAM):

```conf
shared_buffers = 512MB
effective_cache_size = 1536MB
maintenance_work_mem = 128MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 5242kB
min_wal_size = 1GB
max_wal_size = 4GB
```

Restart PostgreSQL:

```bash
sudo systemctl restart postgresql
```

---

## 🗄️ Konfigurasi Database

### Backup Database

```bash
# Local
pg_dump -U farmforce_user -d farmforce_db > backup.sql

# Remote (di server)
sudo -u postgres pg_dump farmforce_db > /var/backups/farmforce_$(date +%Y%m%d).sql
```

### Restore Database

```bash
# Local
psql -U farmforce_user -d farmforce_db < backup.sql

# Remote (di server)
sudo -u postgres psql farmforce_db < /var/backups/farmforce_20241215.sql
```

### Setup Automated Backup (di Ubuntu)

```bash
# Buat script backup
sudo nano /usr/local/bin/backup-farmforce.sh
```

Isi dengan:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/farmforce"
DATE=$(date +%Y%m%d_%H%M%S)
DAYS_TO_KEEP=7

mkdir -p $BACKUP_DIR

# Backup database
sudo -u postgres pg_dump farmforce_db > $BACKUP_DIR/farmforce_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/farmforce_$DATE.sql

# Delete old backups
find $BACKUP_DIR -name "*.sql.gz" -mtime +$DAYS_TO_KEEP -delete

echo "Backup completed: farmforce_$DATE.sql.gz"
```

Buat executable dan setup cron:

```bash
sudo chmod +x /usr/local/bin/backup-farmforce.sh

# Setup cron untuk backup harian jam 2 pagi
sudo crontab -e

# Tambahkan line berikut:
0 2 * * * /usr/local/bin/backup-farmforce.sh >> /var/log/farmforce-backup.log 2>&1
```

---

## 🔄 Update Aplikasi

### Development Lokal

```bash
git pull
npm install
npm run db:push  # jika ada perubahan schema
npm run dev
```

### Production (Ubuntu)

```bash
cd /var/www/farmforce

# Backup dulu
sudo -u postgres pg_dump farmforce_db > backup_before_update.sql

# Pull update
git pull

# Install dependencies baru (jika ada)
npm install

# Update database schema (jika ada)
npm run db:push

# Rebuild aplikasi
npm run build

# Restart PM2
pm2 restart farmforce-dashboard

# Monitor logs
pm2 logs farmforce-dashboard
```

---

## 🔍 Troubleshooting

### Port sudah digunakan

```bash
# Cek process yang menggunakan port 5000
# Windows:
netstat -ano | findstr :5000

# Linux:
sudo lsof -i :5000

# Kill process
# Windows:
taskkill /PID <PID> /F

# Linux:
kill -9 <PID>
```

### Database Connection Error

1. Cek apakah PostgreSQL berjalan:
```bash
# Windows:
services.msc  # cari PostgreSQL

# Linux:
sudo systemctl status postgresql
```

2. Cek DATABASE_URL di `.env` sudah benar
3. Cek user dan password database
4. Test koneksi manual:
```bash
psql -U farmforce_user -d farmforce_db -h localhost
```

### PM2 tidak berjalan setelah reboot

```bash
pm2 startup
pm2 save
```

### Nginx Error 502 Bad Gateway

```bash
# Cek apakah aplikasi berjalan
pm2 status

# Cek logs
pm2 logs farmforce-dashboard

# Restart aplikasi
pm2 restart farmforce-dashboard

# Restart Nginx
sudo systemctl restart nginx
```

### Build Error

```bash
# Clear node_modules dan reinstall
rm -rf node_modules
rm package-lock.json
npm install
npm run build
```

### Vite Cache Issues / RefreshRuntime Errors

```bash
# Clear Vite cache
# Linux/Mac:
rm -rf node_modules/.vite

# Windows (PowerShell):
Remove-Item -Path "node_modules\.vite" -Recurse -Force -ErrorAction SilentlyContinue

# Restart dev server
npm run dev
```

### Memory Issues di Server

```bash
# Tambah swap space (untuk server dengan RAM kecil)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## 📊 Monitoring

### PM2 Monitoring

```bash
# Status aplikasi
pm2 status

# Logs real-time
pm2 logs

# Monitoring dashboard
pm2 monit

# Detailed info
pm2 info farmforce-dashboard
```

### Nginx Access Logs

```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log
```

### PostgreSQL Logs

```bash
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

### Disk Usage

```bash
df -h
du -sh /var/www/farmforce
```

---

## 🔐 Security Best Practices

1. **Selalu gunakan strong password** untuk database dan session secret
2. **Enable firewall** (ufw di Ubuntu)
3. **Update system secara berkala**:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```
4. **Setup SSL/HTTPS** menggunakan Let's Encrypt
5. **Batasi akses PostgreSQL** hanya dari localhost (kecuali perlu remote access)
6. **Backup database secara rutin**
7. **Monitor logs secara berkala**
8. **Gunakan environment variables**, jangan hardcode credentials
9. **Setup fail2ban** untuk mencegah brute force:
   ```bash
   sudo apt install fail2ban -y
   sudo systemctl enable fail2ban
   sudo systemctl start fail2ban
   ```

---

## 📞 Support

Untuk bantuan lebih lanjut:
- Cek dokumentasi Node.js: https://nodejs.org/docs
- Cek dokumentasi PostgreSQL: https://www.postgresql.org/docs/
- Cek dokumentasi PM2: https://pm2.keymetrics.io/docs/
- Cek dokumentasi Nginx: https://nginx.org/en/docs/

---

## 📝 Changelog

Dokumentasi ini dibuat pada: 15 Desember 2025

**Versi 1.0**
- Initial deployment documentation
- Local development setup
- Ubuntu Tencent Cloud production deployment
- Database configuration
- Security best practices
