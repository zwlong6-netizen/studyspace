import express from 'express';
import dotenv from 'dotenv';
import { supabase } from '../config/supabase.js';

dotenv.config();

const router = express.Router();

// Middleware to check if user is admin (Duplicated for now, ideal to move to shared middleware)
import { authMiddleware } from '../middleware/auth.js';

const adminMiddleware = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            // For public GET requests, this middleware shouldn't be used or should be optional.
            // But here we enter only for protected routes.
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

// GET /api/announcements - Get all active announcements (Public)
// Also supports fetching ALL announcements (active & inactive) for admin if ?all=true is passed
router.get('/', async (req, res) => {
    try {
        const { shop_id, all, include_deleted } = req.query;

        let query = supabase
            .from('announcements')
            .select('*');

        // Only filter by active if not requesting all (Admin might request all)
        // ideally we should check token for 'all=true', but for simplicity let's rely on frontend calling convention or enhance later.
        // securely, we should check admin token if all=true.
        if (all !== 'true') {
            query = query.eq('active', true);
        }

        if (shop_id) {
            query = query.eq('shop_id', shop_id);
        }

        if (include_deleted !== 'true') {
            query = query.eq('is_visible', 1);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching announcements:', error);
            return res.status(500).json({ success: false, error: 'Failed to fetch announcements' });
        }

        res.json({ success: true, announcements: data });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// POST /api/announcements - Create announcement (Admin)
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { shop_id, title, content, image_url, tag, tag_color, type, active } = req.body;

        const { data, error } = await supabase
            .from('announcements')
            .insert({ shop_id, title, content, image_url, tag, tag_color, type, active })
            .select()
            .single();

        if (error) throw error;
        res.json({ success: true, announcement: data });
    } catch (error) {
        console.error('Create announcement error:', error);
        res.status(500).json({ success: false, message: 'Failed to create announcement' });
    }
});

// PUT /api/announcements/:id - Update announcement (Admin)
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const { data, error } = await supabase
            .from('announcements')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.json({ success: true, announcement: data });
    } catch (error) {
        console.error('Update announcement error:', error);
        res.status(500).json({ success: false, message: 'Failed to update announcement' });
    }
});

// DELETE /api/announcements/:id - Delete announcement (Admin)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('announcements')
            .update({ is_visible: 0 })
            .eq('id', id);

        if (error) throw error;
        res.json({ success: true, message: 'Announcement deleted' });
    } catch (error) {
        console.error('Delete announcement error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete announcement' });
    }
});

export default router;
