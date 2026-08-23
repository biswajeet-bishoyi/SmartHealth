require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const reportRoutes = require('./routes/reports');
const waterReportRoutes = require('./routes/waterReports');
const healthWorkerRoutes = require('./routes/healthWorker');
const adminRoutes = require('./routes/admin');
const alertRoutes = require('./routes/alerts');
const riskRoutes = require('./routes/risk');
const awarenessRoutes = require('./routes/awareness');
// v2.0 routes
const predictionsRoutes   = require('./routes/predictions');
const environmentRoutes   = require('./routes/environment');
const waterSourcesRoutes  = require('./routes/waterSources');
const vulnerabilityRoutes = require('./routes/vulnerability');
const simulationsRoutes   = require('./routes/simulations');
const timelineRoutes      = require('./routes/timeline');
const auditRoutes         = require('./routes/audit');
const configRoutes        = require('./routes/config');
const responseRoutes      = require('./routes/response');
const resourcesRoutes     = require('./routes/resources');
const voiceRoutes         = require('./routes/voice');

const app = express();
const httpServer = http.createServer(app);

// ─── Dynamic CORS Configuration ──────────────────────────────────────────────
const isAllowedOrigin = (origin) => {
  if (!origin) return true; // allow same-origin, curl, server-to-server
  if (origin.includes('localhost') || origin.includes('127.0.0.1')) return true;
  if (origin.endsWith('.onrender.com') || origin.endsWith('.vercel.app')) return true;
  if (process.env.CLIENT_URL && origin.startsWith(process.env.CLIENT_URL.replace(/\/$/, ''))) return true;
  return true; // allow all origins for hackathon demo
};

const corsOptions = {
  origin: (origin, callback) => {
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

// ─── Socket.IO Setup ──────────────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: corsOptions,
});

// Attach io to app so controllers/services can access it via req.app.get('io')
app.set('io', io);

io.on('connection', (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);

  // Client sends their role and district on connection to join correct rooms
  socket.on('join_rooms', ({ role, district, village }) => {
    if (role) {
      socket.join(`role:${role}`);
      console.log(`[Socket.IO] ${socket.id} joined room: role:${role}`);
    }
    if (district) {
      socket.join(`location:${district}`);
      console.log(`[Socket.IO] ${socket.id} joined room: location:${district}`);
    }
    if (village) {
      socket.join(`village:${village}`);
    }
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

// Helper: emit v2.0 events from services
app.set('emit', (event, room, data) => {
  if (room) io.to(room).emit(event, data);
  else io.emit(event, data);
});

// ─── Security Middleware ───────────────────────────────────────────────────────
app.use(helmet({
  crossOriginEmbedderPolicy: false, // Allow Leaflet map tiles
}));

app.use(cors(corsOptions));

// ─── General Middleware ────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ─── Routes ───────────────────────────────────────────────────────────────────
app.get('/api/ping', (req, res) => {
  res.json({ success: true, message: 'SmartHealthNE API is running', timestamp: new Date() });
});

app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/water-reports', waterReportRoutes);
app.use('/api/health-worker', healthWorkerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/risk', riskRoutes);
app.use('/api/awareness', awarenessRoutes);
// v2.0 routes
app.use('/api/predictions',    predictionsRoutes);
app.use('/api/environment',    environmentRoutes);
app.use('/api/water-sources',  waterSourcesRoutes);
app.use('/api/vulnerability',  vulnerabilityRoutes);
app.use('/api/simulations',    simulationsRoutes);
app.use('/api/timeline',       timelineRoutes);
app.use('/api/audit',          auditRoutes);
app.use('/api/config',         configRoutes);
app.use('/api/response',       responseRoutes);
app.use('/api/resources',      resourcesRoutes);
app.use('/api/voice',          voiceRoutes);

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ─── Centralized Error Handler ─────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  httpServer.listen(PORT, () => {
    console.log(`\n🚀 SmartHealthNE Server running on port ${PORT}`);
    console.log(`📡 Socket.IO ready`);
    console.log(`🔗 http://localhost:${PORT}/api/ping\n`);
  });
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = { app, io, httpServer };
