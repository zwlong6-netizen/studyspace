import express from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { authMiddleware } from '../middleware/auth.js';

dotenv.config();

const router = express.Router();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware to check if user is admin
const adminMiddleware = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // ... (keep existing implementation)
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
        const { shop_id } = req.query;

        let query = supabase
            .from('users')
            .select('id, username, phone, member_level, role, balance, created_at, shop_id')
            .order('created_at', { ascending: false });

        if (shop_id) {
            query = query.eq('shop_id', shop_id);
        }

        const { data, error } = await query;

        if (error) {
            throw error;
        }

        res.json({ success: true, users: data });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch users' });
    }
});

// POST /api/users - Create User (Admin only)
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { username, password, phone, shop_id, role, member_level, balance } = req.body;

        if (!username || !password || !shop_id) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        // Check existance
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('shop_id', shop_id)
            .eq('username', username)
            .single();

        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Username already exists in this shop' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const { data, error } = await supabase
            .from('users')
            .insert({
                username,
                password_hash: passwordHash,
                phone: phone || null,
                shop_id,
                role: role || 0,
                member_level: member_level || 0,
                balance: balance || 0,
                total_hours: 0,
                consecutive_days: 0,
                focus_points: 0
            })
            .select('id, username, phone, member_level, role, balance, created_at, shop_id')
            .single();

        if (error) throw error;

        res.status(201).json({ success: true, user: data });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ success: false, message: 'Failed to create user' });
    }
});

// PUT /api/users/:id - Update User (Admin only)
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { username, phone, role, member_level, balance, password } = req.body;

        const updates: any = {};
        if (username !== undefined) updates.username = username;
        if (phone !== undefined) updates.phone = phone;
        if (role !== undefined) updates.role = role;
        if (member_level !== undefined) updates.member_level = member_level;
        if (balance !== undefined) updates.balance = balance;

        if (password && password.trim() !== '') {
            const salt = await bcrypt.genSalt(10);
            updates.password_hash = await bcrypt.hash(password, salt);
        }

        const { data, error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', id)
            .select('id, username, phone, member_level, role, balance, created_at, shop_id')
            .single();

        if (error) throw error;

        res.json({ success: true, user: data });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ success: false, message: 'Failed to update user' });
    }
});

// DELETE /api/users/:id - Delete User (Admin only)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({ success: true, message: 'User deleted' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete user' });
    }
});


export default router;
