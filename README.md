# Farmforce Dashboard

Dashboard aplikasi untuk manajemen Farmforce dengan fitur visualisasi data dan pelaporan.

## 🚀 Quick Start

### Development Lokal

```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env dengan database credentials Anda

# Push database schema
npm run db:push

# Jalankan development server
npm run dev
```

Aplikasi akan berjalan di http://localhost:5000

### Production Build

```bash
npm run build
npm run start
```

## 📚 Dokumentasi

- **[Quick Start Guide](QUICKSTART.md)** - Panduan cepat untuk memulai
- **[Deployment Guide](DEPLOYMENT.md)** - Dokumentasi lengkap deployment
  - Deployment Lokal (Windows/Mac/Linux)
  - Deployment di Ubuntu Tencent Cloud
  - Konfigurasi Database
  - Setup SSL/HTTPS
  - Monitoring & Maintenance

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, TailwindCSS
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Authentication**: Passport.js
- **UI Components**: Radix UI, Shadcn UI
- **Charts**: Recharts
- **Form Handling**: React Hook Form + Zod

## 📦 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (full stack) |
| `npm run dev:client` | Start client development server only |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run check` | Run TypeScript type checking |
| `npm run db:push` | Push database schema changes |

**Note:** Scripts menggunakan `cross-env` untuk kompatibilitas Windows/Linux/Mac.

## 🗄️ Database Setup

### PostgreSQL

1. Install PostgreSQL
2. Buat database dan user:

```sql
CREATE DATABASE farmforce_db;
CREATE USER farmforce_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE farmforce_db TO farmforce_user;
```

3. Update `.env` file dengan database URL:

```env
DATABASE_URL=postgresql://farmforce_user:your_password@localhost:5432/farmforce_db
```

4. Push schema:

```bash
npm run db:push
```

## 🌍 Environment Variables

Copy `.env.example` ke `.env` dan sesuaikan:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
NODE_ENV=development
PORT=5000
SESSION_SECRET=your-secret-key
```

## 📁 Project Structure

```
├── client/              # Frontend React application
│   ├── public/         # Static assets
│   └── src/
│       ├── components/ # React components
│       ├── hooks/      # Custom hooks
│       ├── lib/        # Utilities & helpers
│       └── pages/      # Page components
├── server/             # Backend Express server
│   ├── index.ts       # Server entry point
│   ├── routes.ts      # API routes
│   └── storage.ts     # Data storage layer
├── shared/             # Shared types & schemas
│   └── schema.ts      # Database schema (Drizzle)
├── script/            # Build scripts
└── migrations/        # Database migrations
```

## 🔐 Security

- Environment variables untuk credentials
- Session-based authentication
- HTTPS untuk production
- CORS configuration
- Input validation dengan Zod

## 🚢 Deployment

### Ubuntu Tencent Cloud

Lihat [DEPLOYMENT.md](DEPLOYMENT.md) untuk panduan lengkap deployment di Ubuntu Tencent Cloud, termasuk:

- Setup server dari awal
- Konfigurasi Nginx
- Setup SSL dengan Let's Encrypt
- PM2 untuk process management
- Automated backup
- Monitoring

### Quick Deploy

```bash
# Di server Ubuntu
sudo ./deploy-ubuntu.sh
```

## 🔄 Update Aplikasi

```bash
git pull
npm install
npm run build
pm2 restart farmforce-dashboard  # jika menggunakan PM2
```

## 📊 Monitoring

### Development

```bash
npm run dev
```

### Production (PM2)

```bash
pm2 status                    # Check status
pm2 logs farmforce-dashboard  # View logs
pm2 monit                     # Monitoring dashboard
```

## 🔧 Troubleshooting

Lihat [DEPLOYMENT.md](DEPLOYMENT.md#troubleshooting) untuk solusi masalah umum.

## 📝 License

MIT

## 👥 Contributors

- Your Team

## 📞 Support

Untuk bantuan:
- Buka issue di repository
- Lihat dokumentasi lengkap di [DEPLOYMENT.md](DEPLOYMENT.md)
- Check [QUICKSTART.md](QUICKSTART.md) untuk panduan cepat

---

Made with ❤️ for Farmforce
