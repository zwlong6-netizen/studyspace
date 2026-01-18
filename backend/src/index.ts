import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes
import authRouter from './routes/auth.js';
import shopsRouter from './routes/shops.js';
import seatsRouter from './routes/seats.js';
import ordersRouter from './routes/orders.js';
import announcementsRouter from './routes/announcements.js';
import usersRouter from './routes/users.js';
import statsRouter from './routes/stats.js';

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/shops', shopsRouter);
app.use('/api/seats', seatsRouter);
app.use('/api/auth', authRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/announcements', announcementsRouter);
app.use('/api/users', usersRouter);
app.use('/api/stats', statsRouter);

// Request logging (development)
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.path} not found`
    });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});

// Start scheduler
import { startOrderScheduler } from './services/scheduler.js';
startOrderScheduler();

// Start server
if (!process.env.VERCEL) {
    app.listen(port, () => {
        console.log('');
        console.log('╔══════════════════════════════════════════════╗');
        console.log('║                                              ║');
        console.log('║       🚀 StudySpace API Server               ║');
        console.log('║                                              ║');
        console.log(`║       Running on http://localhost:${port}       ║`);
        console.log('║                                              ║');
        console.log('╚══════════════════════════════════════════════╝');
        console.log('');
        console.log('Available endpoints:');
        console.log('  GET  /api/health          - Health check');
        console.log('  POST /api/auth/register   - User registration');
        console.log('  POST /api/auth/login      - User login');
        console.log('  GET  /api/auth/profile    - Get user profile');
        console.log('  GET  /api/shops           - List shops');
        console.log('  GET  /api/shops/:id       - Shop details');
        console.log('  GET  /api/shops/:id/seats - Shop seats');
        console.log('  GET  /api/seats           - List seats');
        console.log('  GET  /api/seats/:id/schedule - Seat schedule');
        console.log('  POST /api/orders          - Create order');
        console.log('  GET  /api/orders          - List orders');
        console.log('  GET  /api/announcements   - List active announcements');
        console.log('');
    });
}

export default app;
