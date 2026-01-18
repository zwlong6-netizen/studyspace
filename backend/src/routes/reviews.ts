import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

/**
 * POST /api/reviews
 * 创建评价
 */
router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const { order_id, rating, content, is_anonymous } = req.body;

        if (!order_id || !rating) {
            res.status(400).json({ success: false, message: '缺少必填信息' });
            return;
        }

        if (rating < 1 || rating > 5) {
            res.status(400).json({ success: false, message: '评分必须在 1-5 之间' });
            return;
        }

        // 获取订单信息
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*, seats(zone_name)')
            .eq('id', order_id)
            .single();

        if (orderError || !order) {
            res.status(404).json({ success: false, message: '订单不存在' });
            return;
        }

        // 检查订单是否属于当前用户
        if (order.user_id !== userId) {
            res.status(403).json({ success: false, message: '无权评价此订单' });
            return;
        }

        // 检查订单是否已完成
        if (order.status !== 'completed') {
            res.status(400).json({ success: false, message: '只能评价已完成的订单' });
            return;
        }

        // 检查是否已评价
        const { data: existingReview } = await supabase
            .from('reviews')
            .select('id')
            .eq('order_id', order_id)
            .single();

        if (existingReview) {
            res.status(400).json({ success: false, message: '订单已评价' });
            return;
        }

        // 创建评价
        const { data: review, error: reviewError } = await supabase
            .from('reviews')
            .insert({
                order_id,
                user_id: userId,
                shop_id: order.shop_id,
                zone_name: order.seats?.zone_name || null,
                rating,
                content: content || null,
                is_anonymous: is_anonymous || false
            })
            .select()
            .single();

        if (reviewError) {
            console.error('Create review error:', reviewError);
            res.status(500).json({ success: false, message: '创建评价失败' });
            return;
        }

        res.json({ success: true, message: '评价成功', review });
    } catch (error) {
        console.error('Review error:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

/**
 * GET /api/reviews/shop/:shopId
 * 获取门店评价列表
 */
router.get('/shop/:shopId', async (req: Request, res: Response): Promise<void> => {
    try {
        const { shopId } = req.params;
        const { limit = 10, offset = 0 } = req.query;

        const { data: reviews, error } = await supabase
            .from('reviews')
            .select('*, users(username, avatar)')
            .eq('shop_id', shopId)
            .order('created_at', { ascending: false })
            .range(Number(offset), Number(offset) + Number(limit) - 1);

        if (error) {
            console.error('Fetch reviews error:', error);
            res.status(500).json({ success: false, message: '获取评价失败' });
            return;
        }

        // 处理匿名评价
        const processedReviews = reviews?.map(review => {
            if (review.is_anonymous) {
                return {
                    ...review,
                    users: { username: '匿名用户', avatar: null }
                };
            }
            return review;
        });

        res.json({ success: true, reviews: processedReviews || [] });
    } catch (error) {
        console.error('Reviews error:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

/**
 * GET /api/reviews/order/:orderId
 * 获取订单的评价
 */
router.get('/order/:orderId', async (req: Request, res: Response): Promise<void> => {
    try {
        const { orderId } = req.params;

        const { data: review, error } = await supabase
            .from('reviews')
            .select('*')
            .eq('order_id', orderId)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
            console.error('Fetch review error:', error);
            res.status(500).json({ success: false, message: '获取评价失败' });
            return;
        }

        res.json({ success: true, review: review || null });
    } catch (error) {
        console.error('Review error:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

/**
 * GET /api/reviews/shop/:shopId/stats
 * 获取门店评价统计
 */
router.get('/shop/:shopId/stats', async (req: Request, res: Response): Promise<void> => {
    try {
        const { shopId } = req.params;

        const { data: reviews, error } = await supabase
            .from('reviews')
            .select('rating')
            .eq('shop_id', shopId);

        if (error) {
            console.error('Fetch review stats error:', error);
            res.status(500).json({ success: false, message: '获取统计失败' });
            return;
        }

        const total = reviews?.length || 0;
        const avgRating = total > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / total
            : 0;

        res.json({
            success: true,
            stats: {
                total,
                avgRating: Math.round(avgRating * 10) / 10
            }
        });
    } catch (error) {
        console.error('Review stats error:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

export default router;
