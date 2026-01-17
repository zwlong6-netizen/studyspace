import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase.js';

const router = Router();

/**
 * GET /api/seats
 * 获取座位列表
 * Query params: shop_id (必填), zone (可选)
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
    try {
        const { shop_id, zone } = req.query;

        if (!shop_id) {
            res.status(400).json({ success: false, message: '请提供店铺ID' });
            return;
        }

        let query = supabase
            .from('seats')
            .select('*')
            .eq('shop_id', shop_id as string)
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
 * GET /api/seats/:id
 * 获取座位详情
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const { data: seat, error } = await supabase
            .from('seats')
            .select('*, shops(*)')
            .eq('id', id)
            .single();

        if (error || !seat) {
            res.status(404).json({ success: false, message: '座位不存在' });
            return;
        }

        res.json({
            success: true,
            seat
        });
    } catch (error) {
        console.error('Get seat detail error:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

/**
 * GET /api/seats/:id/schedule
 * 获取座位的预约时间表
 * Query params: date (可选, 默认今天), days (可选, 默认7天)
 */
router.get('/:id/schedule', async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { date, days = '7' } = req.query;

        // 计算日期范围
        const startDate = date ? new Date(date as string) : new Date();
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + parseInt(days as string));

        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];

        const { data: schedules, error } = await supabase
            .from('schedules')
            .select('*')
            .eq('seat_id', id)
            .gte('date', startDateStr)
            .lt('date', endDateStr)
            .order('date')
            .order('start_hour');

        if (error) {
            console.error('Get schedule error:', error);
            res.status(500).json({ success: false, message: '获取时间表失败' });
            return;
        }

        // 按日期分组
        const scheduleByDate: Record<string, Array<{ start: number; end: number }>> = {};

        (schedules || []).forEach(schedule => {
            const dateKey = schedule.date;
            if (!scheduleByDate[dateKey]) {
                scheduleByDate[dateKey] = [];
            }
            scheduleByDate[dateKey].push({
                start: schedule.start_hour,
                end: schedule.end_hour
            });
        });

        res.json({
            success: true,
            seat_id: id,
            schedules: scheduleByDate
        });
    } catch (error) {
        console.error('Get schedule error:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

/**
 * GET /api/seats/schedules/batch
 * 批量获取多个座位的预约时间表
 * Query params: seat_ids (逗号分隔), date (可选)
 */
router.get('/schedules/batch', async (req: Request, res: Response): Promise<void> => {
    try {
        const { seat_ids, date } = req.query;

        if (!seat_ids) {
            res.status(400).json({ success: false, message: '请提供座位ID列表' });
            return;
        }

        const seatIdList = (seat_ids as string).split(',');
        const targetDate = date ? (date as string) : new Date().toISOString().split('T')[0];

        const { data: schedules, error } = await supabase
            .from('schedules')
            .select('*')
            .in('seat_id', seatIdList)
            .eq('date', targetDate)
            .order('start_hour');

        if (error) {
            console.error('Get batch schedules error:', error);
            res.status(500).json({ success: false, message: '获取时间表失败' });
            return;
        }

        // 按座位ID分组
        const scheduleBySeat: Record<string, Array<{ start: number; end: number }>> = {};

        (schedules || []).forEach(schedule => {
            const seatId = schedule.seat_id;
            if (!scheduleBySeat[seatId]) {
                scheduleBySeat[seatId] = [];
            }
            scheduleBySeat[seatId].push({
                start: schedule.start_hour,
                end: schedule.end_hour
            });
        });

        res.json({
            success: true,
            date: targetDate,
            schedules: scheduleBySeat
        });
    } catch (error) {
        console.error('Get batch schedules error:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

export default router;
