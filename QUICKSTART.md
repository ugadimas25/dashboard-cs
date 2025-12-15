# Quick Start Guide - Farmforce Dashboard

Panduan cepat untuk memulai development atau deployment.

## 🚀 Quick Start - Development Lokal

### 1. Prerequisites
- Node.js 18+ terinstall
- PostgreSQL terinstall
- Git terinstall

### 2. Setup Cepat

```bash
# Clone repository
git clone <repository-url>
cd Farmforce-Dashboard

# Install dependencies
npm install

# Copy .env template
cp .env.example .env

# Edit .env dengan database credentials Anda
# nano .env  # Linux/Mac
# notepad .env  # Windows

# Push database schema
npm run db:push

# Jalankan development server
npm run dev
```

Buka browser: http://localhost:5000

## ⚡ Quick Deploy - Ubuntu Tencent Cloud

### One-Line Setup (Run as root)

```bash
curl -o deploy.sh https://raw.githubusercontent.com/your-repo/deploy-ubuntu.sh && chmod +x deploy.sh && sudo ./deploy.sh
```

### Manual Setup (5 Menit)

```bash
# 1. Update system & install dependencies
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs postgresql postgresql-contrib nginx
sudo npm install -g pm2

# 2. Setup database
sudo -u postgres psql
CREATE DATABASE farmforce_db;
CREATE USER farmforce_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE farmforce_db TO farmforce_user;
\q

# 3. Clone & setup app
cd /var/www && sudo mkdir farmforce && sudo chown $USER:$USER farmforce
cd farmforce
git clone <repository-url> .
npm install

# 4. Configure environment
cp .env.example .env
nano .env  # Edit dengan database credentials

# 5. Build & deploy
npm run db:push
npm run build
pm2 start npm --name "farmforce-dashboard" -- start
pm2 startup && pm2 save

# 6. Setup Nginx
sudo cp nginx.conf /etc/nginx/sites-available/farmforce
sudo ln -s /etc/nginx/sites-available/farmforce /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx

# 7. Setup firewall
sudo ufw allow 22/tcp && sudo ufw allow 80/tcp && sudo ufw allow 443/tcp
sudo ufw enable
```

## 📱 Akses Aplikasi

- **Local Development**: http://localhost:5000
- **Production**: http://your-server-ip atau http://your-domain.com

## 🔧 Perintah Penting

### Development
```bash
npm run dev          # Start development server
npm run dev:client   # Start client only
npm run build        # Build for production
npm run check        # Type checking
npm run db:push      # Push database schema
```

### Production
```bash
pm2 status                    # Cek status aplikasi
pm2 logs farmforce-dashboard  # Lihat logs
pm2 restart farmforce-dashboard  # Restart aplikasi
pm2 stop farmforce-dashboard  # Stop aplikasi
pm2 start farmforce-dashboard # Start aplikasi
```

### Database
```bash
# Backup
sudo -u postgres pg_dump farmforce_db > backup.sql

# Restore
sudo -u postgres psql farmforce_db < backup.sql

# Access database
psql -U farmforce_user -d farmforce_db
```

### Nginx
```bash
sudo nginx -t                # Test konfigurasi
sudo systemctl restart nginx # Restart Nginx
sudo systemctl status nginx  # Cek status
```

## 🔒 Setup SSL (Let's Encrypt)

```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

## 📦 Update Aplikasi

```bash
cd /var/www/farmforce
git pull
npm install
npm run build
pm2 restart farmforce-dashboard
```

## 🆘 Troubleshooting Quick Fix

### Windows: NODE_ENV not recognized

Jika Anda mendapat error `'NODE_ENV' is not recognized...` saat menjalankan `npm run dev`, package.json sudah menggunakan `cross-env`. Pastikan dependencies terinstall:

```bash
npm install
```

Atau install cross-env secara manual:
```bash
npm install -D cross-env
```

### RefreshRuntime.getRefreshReg is not a function

Error ini terjadi karena cache Vite yang corrupt. Solusinya:

```bash
# Windows (PowerShell)
Remove-Item -Path "node_modules\.vite" -Recurse -Force -ErrorAction SilentlyContinue
npm run dev

# Linux/Mac
rm -rf node_modules/.vite
npm run dev
```

Jika masih error, coba reinstall dependencies:
```bash
# Windows (PowerShell)
Remove-Item -Path "node_modules" -Recurse -Force
npm install
npm run dev

# Linux/Mac
rm -rf node_modules
npm install
npm run dev
```

### Port sudah digunakan
```bash
# Linux
sudo lsof -i :5000 && kill -9 $(sudo lsof -t -i:5000)

# Windows (PowerShell)
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process -Force
```

### Database connection error
```bash
# Restart PostgreSQL
sudo systemctl restart postgresql

# Check status
sudo systemctl status postgresql
```

### PM2 not working after reboot
```bash
pm2 startup
pm2 save
```

## 📚 Dokumentasi Lengkap

Untuk panduan detail, lihat [DEPLOYMENT.md](DEPLOYMENT.md)

## 🔗 Links

- **Documentation**: See DEPLOYMENT.md
- **Node.js**: https://nodejs.org
- **PostgreSQL**: https://www.postgresql.org
- **PM2**: https://pm2.keymetrics.io

---

**Need Help?** Check DEPLOYMENT.md untuk panduan lengkap dan troubleshooting detail.
