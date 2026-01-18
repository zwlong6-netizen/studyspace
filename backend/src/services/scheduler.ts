import { supabase } from '../config/supabase.js';

export const startOrderScheduler = () => {
    console.log('Starting order expiration scheduler...');

    // Run every minute
    setInterval(checkExpiredOrders, 60 * 1000);

    // Run immediately on start
    checkExpiredOrders();
};

const checkExpiredOrders = async () => {
    try {
        console.log('Running scheduled check for expired orders...');

        // 1. Fetch all active orders
        const { data: activeOrders, error } = await supabase
            .from('orders')
            .select('*')
            .in('status', ['active', 'pending']);

        if (error) {
            console.error('Scheduler: Failed to fetch active orders', error);
            return;
        }

        if (!activeOrders || activeOrders.length === 0) {
            return;
        }

        // 使用 UTC 时间戳进行计算，避免本地时区问题
        const nowUtc = Date.now();
        const updates: PromiseLike<any>[] = [];
        let expiredCount = 0;

        // 2. Check and sync statuses
        for (const order of activeOrders) {
            try {
                const [year, month, day] = order.date.split('-').map(Number);
                const [startHour, startMinute] = (order.start_time || '00:00').split(':').map(Number);
                const [endHour, endMinute] = (order.end_time || '00:00').split(':').map(Number);

                // 构建 UTC 时间戳 (订单时间是北京时间 UTC+8，转换为 UTC)
                const startTimeUtc = Date.UTC(year, month - 1, day, startHour - 8, startMinute, 0, 0);
                const endTimeUtc = Date.UTC(year, month - 1, day, endHour - 8, endMinute, 0, 0);
                const admissionTimeUtc = startTimeUtc - 10 * 60000; // 开始前10分钟

                let targetStatus = order.status;

                if (nowUtc > endTimeUtc) {
                    targetStatus = 'completed';
                } else if (nowUtc >= admissionTimeUtc) {
                    targetStatus = 'active';
                } else {
                    targetStatus = 'pending';
                }

                // If status is different, update it
                if (targetStatus !== order.status) {
                    updates.push(
                        supabase
                            .from('orders')
                            .update({ status: targetStatus })
                            .eq('id', order.id)
                            .then()
                    );
                    expiredCount++;
                    console.log(`Scheduler: Syncing Order ${order.id}: ${order.status} -> ${targetStatus}`);
                }
            } catch (err) {
                console.error(`Scheduler: Error processing order ${order.id}`, err);
            }
        }

        // 3. Execute updates
        if (updates.length > 0) {
            console.log(`Scheduler: Found ${expiredCount} expired orders. Updating...`);
            await Promise.all(updates);
            console.log('Scheduler: Orders updated successfully.');
        }

    } catch (err) {
        console.error('Scheduler: Unhandled error', err);
    }
};
