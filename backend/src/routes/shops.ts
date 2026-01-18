import { Router, Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Middleware to check if user is admin
const adminMiddleware = async (req: Request, res: Response, next: NextFunction) => {
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

/**
 * GET /api/shops
 * Get shop list
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
    try {
        const { location, all } = req.query;

        let query = supabase
            .from('shops')
            .select('*')
            .order('rating', { ascending: false });

        if (all !== 'true') {
            query = query.eq('is_visible', 1);
        }

        if (location && typeof location === 'string') {
            query = query.ilike('location', `%${location}%`);
        }

        const { data: shops, error } = await query;

        if (error) {
            console.error('Get shops error:', error);
            res.status(500).json({ success: false, message: 'Failed to get shops' });
            return;
        }

        res.json({
            success: true,
            shops: shops || []
        });
    } catch (error) {
        console.error('Get shops error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * GET /api/shops/:id
 * Get shop detail
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const { data: shop, error } = await supabase
            .from('shops')
            .select('*')
            .eq('id', id)
            .eq('is_visible', 1)
            .single();

        if (error || !shop) {
            res.status(404).json({ success: false, message: 'Shop not found' });
            return;
        }

        res.json({
            success: true,
            shop
        });
    } catch (error) {
        console.error('Get shop detail error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * GET /api/shops/:id/seats
 * Get shop seats
 */
router.get('/:id/seats', async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { zone } = req.query;

        let query = supabase
            .from('seats')
            .select('*')
            .eq('shop_id', id)
            .eq('is_visible', 1)
            .eq('is_active', true)
            .order('label');

        if (zone && typeof zone === 'string') {
            query = query.eq('zone_name', zone);
        }

        const { data: seats, error } = await query;

        if (error) {
            console.error('Get seats error:', error);
            res.status(500).json({ success: false, message: 'Failed to get seats' });
            return;
        }

        res.json({
            success: true,
            seats: seats || []
        });
    } catch (error) {
        console.error('Get seats error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * GET /api/shops/:id/zones
 * Get shop zones
 */
router.get('/:id/zones', async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        // Get zones
        const { data: zones, error: zonesError } = await supabase
            .from('zones')
            .select('*')
            .eq('shop_id', id)
            .eq('is_visible', 1)
            .order('price');

        if (zonesError) {
            console.error('Get zones error:', zonesError);
            res.status(500).json({ success: false, message: 'Failed to get zones' });
            return;
        }

        // Get seats for stats
        const { data: seats, error: seatsError } = await supabase
            .from('seats')
            .select('zone_name, is_active')
            .eq('shop_id', id)
            .eq('is_visible', 1);

        if (seatsError) {
            console.error('Get seats for zones error:', seatsError);
        }

        const zonesWithStats = (zones || []).map(zone => {
            const zoneSeats = (seats || []).filter(s => s.zone_name === zone.name);
            const availableSeats = zoneSeats.filter(s => s.is_active).length;
            const totalSeats = zoneSeats.length;

            return {
                ...zone,
                availableSeats,
                totalSeats
            };
        });

        res.json({
            success: true,
            zones: zonesWithStats
        });
    } catch (error) {
        console.error('Get zones error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * POST /api/shops
 * Create a new shop
 */
router.post('/', authMiddleware, adminMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, location, address, price, image, tags, facilities, open_time, close_time, is_24h, description } = req.body;

        const { data: shop, error } = await supabase
            .from('shops')
            .insert({
                name,
                location,
                address,
                price,
                image,
                tags: tags || [],
                facilities: facilities || [],
                open_time,
                close_time,
                is_24h,
                description,
                rating: 5.0, // Default rating
                review_count: 0
            })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({ success: true, shop });
    } catch (error) {
        console.error('Create shop error:', error);
        res.status(500).json({ success: false, message: 'Failed to create shop' });
    }
});

/**
 * PUT /api/shops/:id
 * Update a shop
 */
router.put('/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const { data: shop, error } = await supabase
            .from('shops')
            .update(updates)
            .eq('id', id)
            // .eq('is_visible', 1) <-- Allow updating hidden items
            .select()
            .single();

        if (error) throw error;

        res.json({ success: true, shop });
    } catch (error) {
        console.error('Update shop error:', error);
        res.status(500).json({ success: false, message: 'Failed to update shop' });
    }
});

/**
 * DELETE /api/shops/:id
 * Delete a shop
 */
router.delete('/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('shops')
            .update({ is_visible: 0 })
            .eq('id', id);

        if (error) {
            console.error('Delete shop error:', error);
            res.status(500).json({ success: false, message: 'Failed to delete shop' });
            return;
        }

        res.json({ success: true, message: 'Shop deleted successfully' });
    } catch (error) {
        console.error('Delete shop error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete shop' });
    }
});

export default router;

