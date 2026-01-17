import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth.js';
import shopsRoutes from './routes/shops.js';
import seatsRoutes from './routes/seats.js';
import ordersRoutes from './routes/orders.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
    credentials: true
}));
app.use(express.json());

// Request logging (development)
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        message: 'StudySpace API is running'
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/shops', shopsRoutes);
app.use('/api/seats', seatsRoutes);
app.use('/api/orders', ordersRoutes);

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

// Start server
if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log('');
        console.log('╔══════════════════════════════════════════════╗');
        console.log('║                                              ║');
        console.log('║       🚀 StudySpace API Server               ║');
        console.log('║                                              ║');
        console.log(`║       Running on http://localhost:${PORT}       ║`);
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
        console.log('  PATCH /api/orders/:id     - Update order');
        console.log('');
    });
}

export default app;
