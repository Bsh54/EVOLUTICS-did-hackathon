/**
 * CottonPay Backend Server
 * eSignet OIDC + SSI Credential Integration
 * 
 * Architecture :
 *  - /auth/*           → Authentification eSignet (OIDC + PKCE)
 *  - /api/coop/*       → Espace Coopérative (membres authentifiés + fiche producteur)
 *  - /api/verify/*     → Vérification Publique (OTP éphémère)
 *  - /api/identity/*   → Vérification NPI (Mock Identity System)
 *  - /certification/*  → Legacy : émission credential (ancien flux)
 */

require('dotenv').config({ path: __dirname + '/../.env' });
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const path = require('path');

// Routes
const authRoutes = require('./src/routes/auth');
const coopRoutes = require('./src/routes/coop');
// Note: producer routes kept for potential future mobile API use
const producerRoutes = require('./src/routes/producer');
const verifyRoutes = require('./src/routes/verify');
const identityRoutes = require('./src/routes/identity');
const certificationRoutes = require('./src/routes/certification');
const userRoutes = require('./src/routes/user');

const app = express();
const PORT = process.env.APP_PORT || 3002;

// ============================================
// MIDDLEWARE
// ============================================

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3002',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'cottonpay-dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 heures
  }
}));

// ============================================
// STATIC FILES
// ============================================

// Servir les fichiers frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Logo depuis la racine du projet
app.get('/logo.jpeg', (req, res) => {
  res.sendFile(path.join(__dirname, '../../logo.jpeg'));
});

// ============================================
// API ROUTES
// ============================================

// Authentification eSignet (login, callback, logout, status)
app.use('/auth', authRoutes);

// Espace Admin — enrôlement des membres (protégé par ADMIN_KEY)
app.use('/api/admin', require('./src/routes/admin'));

// Espace Coopérative (dashboard, producteurs, livraisons, lots, paiements)
app.use('/api/coop', coopRoutes);

// API Producteur (conservée pour usage futur mobile, non exposée en frontend)
app.use('/api/producer', producerRoutes);

// Vérification Publique (lookup, OTP, historique)
app.use('/api/verify', verifyRoutes);

// Vérification NPI (Mock Identity System)
app.use('/api/identity', identityRoutes);

// Legacy : certification et user info
app.use('/certification', certificationRoutes);
app.use('/user', userRoutes);

// ============================================
// CALLBACK ROUTING eSignet
// ============================================

// eSignet redirige toujours vers /certification/auth/callback (redirect_uri configuré)
// On route dynamiquement selon le flux initié
app.get('/certification/auth/callback', (req, res) => {
  const queryString = new URLSearchParams(req.query).toString();
  const flow = req.session?.loginFlow || 'coop';

  if (flow === 'certification') {
    // Ancien flux legacy
    res.redirect(`/certification/callback?${queryString}`);
  } else {
    // Nouveau flux (coop)
    res.redirect(`/auth/callback?${queryString}`);
  }
});

// Fallback legacy callback
app.get('/callback', (req, res) => {
  const queryString = new URLSearchParams(req.query).toString();
  res.redirect(`/auth/callback?${queryString}`);
});

// ============================================
// PAGE ROUTES (SPA)
// ============================================

// Espace Coopérative — servir index.html
app.get('/coop', (req, res) => {
  res.redirect('/coop/');
});
app.get('/coop/*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/coop/index.html'));
});

// Espace Producteur — redirige vers coop (migration)
app.get('/producer', (req, res) => {
  res.redirect('/coop/');
});
app.get('/producer/*', (req, res) => {
  res.redirect('/coop/');
});

// Page de vérification
app.get('/verify', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/verify.html'));
});

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'CottonPay Backend v2',
    timestamp: new Date().toISOString(),
    esignet_configured: !!process.env.CLIENT_ID,
    eidstack_url: process.env.EIDSTACK_URL || 'http://localhost:4000',
    routes: {
      auth: '/auth/login?flow=coop',
      coop_api: '/api/coop/*',
      verify_api: '/api/verify/*',
      identity_api: '/api/identity/verify'
    }
  });
});

// ============================================
// ERROR HANDLING
// ============================================

// 404
app.use((req, res) => {
  // Si c'est une requête API, retourner du JSON
  if (req.path.startsWith('/api/') || req.path.startsWith('/auth/')) {
    return res.status(404).json({ error: 'Route not found' });
  }
  // Sinon, servir la landing page
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============================================
// START
// ============================================

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║   🌿 CottonPay Backend v3                                ║
║                                                          ║
║   Port: ${PORT}                                            ║
║   Environment: ${(process.env.NODE_ENV || 'development').padEnd(15)}                    ║
║   eSignet: ${(process.env.ESIGNET_BASE_URL || 'not configured').substring(0, 30).padEnd(35)} ║
║   eidStack: ${(process.env.EIDSTACK_URL || 'http://localhost:4000').padEnd(34)} ║
║                                                          ║
║   Routes:                                                ║
║     Landing   → http://localhost:${PORT}/                   ║
║     Coop      → http://localhost:${PORT}/coop/              ║
║     Verify    → http://localhost:${PORT}/verify              ║
║     Health    → http://localhost:${PORT}/health              ║
║                                                          ║
║   Auth:                                                  ║
║     Login     → /auth/login?flow=coop                    ║
║                                                          ║
║   ✅ Ready!                                               ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
