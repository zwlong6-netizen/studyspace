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
 * GET /api/stats/trend
 * Get daily aggregated stats for revenue, orders, and user registrations
 * Query params: shop_id (required), days (1-365, default 7)
 */
router.get('/trend', authMiddleware, adminMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const { shop_id, days = '7' } = req.query;
        const numDays = Math.min(365, Math.max(1, parseInt(days as string) || 7));

        if (!shop_id) {
            res.status(400).json({ success: false, message: 'shop_id is required' });
            return;
        }

        // Calculate date range
        // Calculate date range (UTC) to avoid timezone discrepancies between dev/prod
        const endDate = new Date();
        endDate.setUTCHours(23, 59, 59, 999);

        const startDate = new Date(endDate);
        startDate.setUTCDate(startDate.getUTCDate() - numDays + 1);
        startDate.setUTCHours(0, 0, 0, 0);

        const startDateStr = startDate.toISOString();
        const endDateStr = endDate.toISOString();

        // Fetch orders in date range for this shop
        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('id, final_price, original_price, created_at')
            .eq('shop_id', shop_id as string)
            .gte('created_at', startDateStr)
            .lte('created_at', endDateStr)
            .order('created_at', { ascending: true });

        if (ordersError) {
            console.error('Fetch orders error:', ordersError);
            throw ordersError;
        }

        // Fetch users registered in date range for this shop
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('id, created_at')
            .eq('shop_id', shop_id as string)
            .gte('created_at', startDateStr)
            .lte('created_at', endDateStr)
            .order('created_at', { ascending: true });

        if (usersError) {
            console.error('Fetch users error:', usersError);
            throw usersError;
        }

        // Aggregate by date
        const dateMap: Record<string, { date: string; revenue: number; orders: number; users: number }> = {};

        // Initialize all dates in range
        // Initialize all dates in range (Iterate in UTC)
        for (let d = new Date(startDate); d <= endDate; d.setUTCDate(d.getUTCDate() + 1)) {
            const dateKey = d.toISOString().split('T')[0];
            dateMap[dateKey] = { date: dateKey, revenue: 0, orders: 0, users: 0 };
        }

        // Aggregate orders
        (orders || []).forEach(order => {
            const dateKey = new Date(order.created_at).toISOString().split('T')[0];
            if (dateMap[dateKey]) {
                dateMap[dateKey].revenue += Number(order.final_price || order.original_price || 0);
                dateMap[dateKey].orders += 1;
            }
        });

        // Aggregate users
        (users || []).forEach(user => {
            const dateKey = new Date(user.created_at).toISOString().split('T')[0];
            if (dateMap[dateKey]) {
                dateMap[dateKey].users += 1;
            }
        });

        // Convert to array sorted by date
        const data = Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));

        res.json({
            success: true,
            data
        });
    } catch (error) {
        console.error('Get trend stats error:', error);
        res.status(500).json({ success: false, message: 'Failed to get trend stats' });
    }
});

export default router;
