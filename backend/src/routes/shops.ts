import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase.js';

const router = Router();

/**
 * GET /api/shops
 * 获取店铺列表
 * Query params: location (可选)
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
    try {
        const { location } = req.query;

        let query = supabase
            .from('shops')
            .select('*')
            .order('rating', { ascending: false });

        // 如果指定了位置，按位置筛选
        if (location && typeof location === 'string') {
            query = query.ilike('location', `%${location}%`);
        }

        const { data: shops, error } = await query;

        if (error) {
            console.error('Get shops error:', error);
            res.status(500).json({ success: false, message: '获取店铺列表失败' });
            return;
        }

        res.json({
            success: true,
            shops: shops || []
        });
    } catch (error) {
        console.error('Get shops error:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

/**
 * GET /api/shops/:id
 * 获取店铺详情
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const { data: shop, error } = await supabase
            .from('shops')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !shop) {
            res.status(404).json({ success: false, message: '店铺不存在' });
            return;
        }

        res.json({
            success: true,
            shop
        });
    } catch (error) {
        console.error('Get shop detail error:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

/**
 * GET /api/shops/:id/seats
 * 获取店铺的座位列表
 */
router.get('/:id/seats', async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { zone } = req.query;

        let query = supabase
            .from('seats')
            .select('*')
            .eq('shop_id', id)
            .eq('is_active', true)
            .order('label');

        if (zone && typeof zone === 'string') {
            query = query.eq('zone_name', zone);
        }

        const { data: seats, error } = await query;

        if (error) {
            console.error('Get seats error:', error);
            res.status(500).json({ success: false, message: '获取座位列表失败' });
            return;
        }

        res.json({
            success: true,
            seats: seats || []
        });
    } catch (error) {
        console.error('Get seats error:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

/**
 * GET /api/shops/:id/zones
 * 获取店铺的房间/区域列表
 */
router.get('/:id/zones', async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        // 获取房间数据
        const { data: zones, error: zonesError } = await supabase
            .from('zones')
            .select('*')
            .eq('shop_id', id)
            .order('price');

        if (zonesError) {
            console.error('Get zones error:', zonesError);
            res.status(500).json({ success: false, message: '获取房间列表失败' });
            return;
        }

        // 获取该店铺所有座位，用于统计每个房间的座位数
        const { data: seats, error: seatsError } = await supabase
            .from('seats')
            .select('zone_name, is_active')
            .eq('shop_id', id);

        if (seatsError) {
            console.error('Get seats for zones error:', seatsError);
        }

        // 统计每个房间的座位数
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
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

export default router;

