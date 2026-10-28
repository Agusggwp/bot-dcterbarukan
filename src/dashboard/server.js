import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { createAuthRouter } from './routes/auth.js';
import { createPagesRouter } from './routes/pages.js';
import { createApiRouter } from './routes/api.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createDashboardServer(client) {
  const app = express();

  // Security Headers
  app.use(
    helmet({
      contentSecurityPolicy: false, // Allows inline CDN styles and Discord CDN avatars cleanly
    })
  );

  // Rate Limiter
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Terlalu banyak permintaan dari IP ini, coba lagi nanti.',
  });
  app.use(limiter);

  // Body and cookie parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Session configuration
  app.use(
    session({
      secret: env.DASHBOARD_SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: env.DASHBOARD_BASE_URL.startsWith('https://'),
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      },
    })
  );

  // View Engine Setup (EJS)
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'ejs');

  // Routes
  app.use('/auth', createAuthRouter());
  app.use('/api', createApiRouter(client));
  app.use('/', createPagesRouter(client));

  // 404 Handler
  app.use((req, res) => {
    res.status(404).render('error', {
      title: 'Halaman Tidak Ditemukan (404)',
      message: 'Halaman yang Anda tuju tidak ditemukan pada sistem dashboard.',
    });
  });

  return app;
}

export function startDashboard(client) {
  if (!env.DASHBOARD_ENABLED) {
    logger.info('Web Dashboard is disabled in configuration (DASHBOARD_ENABLED=false).');
    return null;
  }

  const app = createDashboardServer(client);
  const server = app.listen(env.DASHBOARD_PORT, () => {
    logger.info(`🚀 Web Dashboard running on port ${env.DASHBOARD_PORT} (${env.DASHBOARD_BASE_URL})`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      logger.warn(`⚠️ Port ${env.DASHBOARD_PORT} sedang digunakan oleh aplikasi lain. Web Dashboard dilewati, namun Bot Discord tetap berjalan online!`);
    } else {
      logger.error({ error: err.message }, 'Kesalahan pada Web Dashboard server');
    }
  });

  return server;
}
