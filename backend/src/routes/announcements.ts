import express from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// GET /api/announcements - Get all active announcements
router.get('/', async (req, res) => {
    try {
        const { shop_id } = req.query;

        let query = supabase
            .from('announcements')
            .select('*')
            .eq('active', true);

        // If shop_id is provided, filter by it
        // Note: For now we do strict filtering. If global announcements are needed later,
        // we could change this to .or(`shop_id.eq.${shop_id},shop_id.is.null`)
        if (shop_id) {
            query = query.eq('shop_id', shop_id);
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

export default router;
