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

        const now = new Date();
        const updates: PromiseLike<any>[] = [];
        let expiredCount = 0;

        // 2. Check and sync statuses
        for (const order of activeOrders) {
            try {
                // Parse date (YYYY-MM-DD) manually to avoid UTC conversion issues
                const [year, month, day] = order.date.split('-').map(Number);

                // Parse times
                const [startHour, startMinute] = (order.start_time || '00:00').split(':').map(Number);
                const [endHour, endMinute] = (order.end_time || '00:00').split(':').map(Number);

                // Start Time (Local Construction)
                const startTime = new Date(year, month - 1, day, startHour, startMinute, 0, 0);

                // End Time (Local Construction)
                const endTime = new Date(year, month - 1, day, endHour, endMinute, 0, 0);

                // Admission is 10 mins before start
                const admissionTime = new Date(startTime.getTime() - 10 * 60000);

                let targetStatus = order.status;

                if (now > endTime) {
                    targetStatus = 'completed';
                } else if (now >= admissionTime) {
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
                    expiredCount++; // Counting all updates
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
