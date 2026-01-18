import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase.js';
import { authMiddleware } from '../middleware/auth.js';
import { CreateOrderRequest } from '../types/index.js';

const router = Router();

/**
 * POST /api/orders
 * 创建订单
 */
router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const {
            shop_id,
            seat_id,
            date,
            start_time,
            end_time,
            duration,
            original_price,
            discount = 0,
            payment_method = 'wechat'
        }: CreateOrderRequest = req.body;

        // 验证必填字段
        if (!shop_id || !seat_id || !date || !start_time || !end_time || !duration || !original_price) {
            res.status(400).json({ success: false, message: '缺少必填信息' });
            return;
        }

        // 计算时间
        const startHour = parseTimeToHour(start_time);
        const endHour = parseTimeToHour(end_time);

        // 检查时间段是否已被占用
        const { data: existingSchedules } = await supabase
            .from('schedules')
            .select('*')
            .eq('seat_id', seat_id)
            .eq('date', date);

        const hasConflict = (existingSchedules || []).some(schedule =>
            (schedule.start_hour < endHour) && (schedule.end_hour > startHour)
        );

        if (hasConflict) {
            res.status(400).json({ success: false, message: '该时段已被预约' });
            return;
        }

        // 计算最终价格
        const finalPrice = Math.max(0, original_price - discount);

        // 生成二维码（模拟）
        const qrCode = `QR-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

        // Check if order should be pending (>10 mins before start)
        const now = new Date();
        const orderStartTime = new Date(date);
        orderStartTime.setHours(startHour, Math.floor((startHour % 1) * 60), 0, 0);

        // 允许提前10分钟入场
        const admissionTime = new Date(orderStartTime.getTime() - 10 * 60000);

        const initialStatus = now < admissionTime ? 'pending' : 'active';

        // 创建订单
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                user_id: userId,
                shop_id,
                seat_id,
                date,
                start_time,
                end_time,
                duration,
                original_price,
                discount,
                final_price: finalPrice,
                status: initialStatus,
                payment_method,
                qr_code: qrCode
            })
            .select('*')
            .single();

        if (orderError) {
            console.error('Create order error:', orderError);
            res.status(500).json({ success: false, message: '创建订单失败' });
            return;
        }

        // 创建预约时间记录
        const { error: scheduleError } = await supabase
            .from('schedules')
            .insert({
                seat_id,
                order_id: order.id,
                date,
                start_hour: startHour,
                end_hour: endHour
            });

        if (scheduleError) {
            console.error('Create schedule error:', scheduleError);
            // 回滚订单
            await supabase.from('orders').delete().eq('id', order.id);
            res.status(500).json({ success: false, message: '预约失败' });
            return;
        }

        // 更新用户累计时长（可选，忽略错误）
        try {
            await supabase
                .from('users')
                .update({ total_hours: duration })
                .eq('id', userId);
        } catch {
            // 忽略错误，不影响主流程
        }

        res.status(201).json({
            success: true,
            message: '订单创建成功',
            order: {
                ...order,
                qr_code: qrCode
            }
        });
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

/**
 * GET /api/orders
 * 获取用户订单列表
 * Query params: status (可选: active, completed, cancelled)
 */
router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const { status, all, shop_id } = req.query;

        let query = supabase
            .from('orders')
            .select(`
        *,
        shops:shop_id (id, name, image, location),
        seats:seat_id (id, label, type, zone_name),
        users:user_id (username, phone)
      `)
            .order('created_at', { ascending: false });

        // If not requesting all (admin), filter by current user
        if (all !== 'true') {
            query = query.eq('user_id', userId);
        } else {
            // For admin view, maybe we want to fetch user details too (added above in select)
        }

        if (status && typeof status === 'string') {
            query = query.eq('status', status);
        }

        if (shop_id && typeof shop_id === 'string') {
            query = query.eq('shop_id', shop_id);
        }

        const { data: orders, error } = await query;

        if (error) {
            console.error('Get orders error:', error);
            res.status(500).json({ success: false, message: '获取订单列表失败' });
            return;
        }

        res.json({
            success: true,
            orders: orders || []
        });
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

/**
 * GET /api/orders/:id
 * 获取订单详情
 */
router.get('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;

        const { data: order, error } = await supabase
            .from('orders')
            .select(`
        *,
        shops:shop_id (*),
        seats:seat_id (*)
      `)
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        if (error || !order) {
            res.status(404).json({ success: false, message: '订单不存在' });
            return;
        }

        res.json({
            success: true,
            order
        });
    } catch (error) {
        console.error('Get order detail error:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

/**
 * PATCH /api/orders/:id
 * 更新订单状态（取消订单）
 */
router.patch('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;
        const { status } = req.body;

        // 只允许取消订单
        if (status !== 'cancelled') {
            res.status(400).json({ success: false, message: '无效的操作' });
            return;
        }

        // 检查订单是否属于当前用户且为进行中状态
        const { data: existingOrder } = await supabase
            .from('orders')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        if (!existingOrder) {
            res.status(404).json({ success: false, message: '订单不存在' });
            return;
        }

        if (existingOrder.status !== 'active') {
            res.status(400).json({ success: false, message: '只能取消进行中的订单' });
            return;
        }

        // 更新订单状态
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .update({ status: 'cancelled' })
            .eq('id', id)
            .select('*')
            .single();

        if (orderError) {
            res.status(500).json({ success: false, message: '取消订单失败' });
            return;
        }

        // 删除对应的预约时间记录
        await supabase
            .from('schedules')
            .delete()
            .eq('order_id', id);

        res.json({
            success: true,
            message: '订单已取消',
            order
        });
    } catch (error) {
        console.error('Update order error:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

/**
 * 辅助函数：将时间字符串转换为小时数
 * 例如: "14:30" -> 14.5
 */
function parseTimeToHour(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours + minutes / 60;
}

export default router;
