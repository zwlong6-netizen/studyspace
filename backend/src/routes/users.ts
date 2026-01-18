import express from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { authMiddleware } from '../middleware/auth.js';

dotenv.config();

const router = express.Router();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware to check if user is admin
const adminMiddleware = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        const { data: user, error } = await supabase
            .from('users')
            .select('role')
            .eq('id', userId)
            .single();

        if (error || !user || user.role !== 1) {
            res.status(403).json({ success: false, message: 'Forbidden: Admin access required' });
            return;
        }

        next();
    } catch (error) {
        console.error('Admin check error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// GET /api/users - Get all users (Admin only)
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('id, username, phone, member_level, role, balance, created_at')
            .order('created_at', { ascending: false });

        if (error) {
            throw error;
        }

        res.json({ success: true, users: data });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch users' });
    }
});

export default router;
