import { supabase } from '../config/supabase.js';

const checkLogic = async () => {
    console.log('--- Debugging Order Status Logic ---');
    const now = new Date();
    console.log(`Current Server Time (now): ${now.toString()}`);
    console.log(`Current ISO Time: ${now.toISOString()}`);

    const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'active') // Only check active orders that might need to be pending
        .order('date', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error fetching orders:', error);
        return;
    }

    if (!orders || orders.length === 0) {
        console.log('No active orders found.');
        return;
    }

    console.log(`Found ${orders.length} active orders. Checking calculation...`);

    for (const order of orders) {
        console.log(`\nOrder ID: ${order.id}`);
        console.log(`  Date: ${order.date}`);
        console.log(`  Time: ${order.start_time} - ${order.end_time}`);

        // Logic from scheduler.ts
        const orderDate = new Date(order.date);
        const [startHour, startMinute] = (order.start_time || '00:00').split(':').map(Number);
        const startTime = new Date(orderDate);
        startTime.setHours(startHour, startMinute, 0, 0);

        // Admission (10 mins before)
        const admissionTime = new Date(startTime.getTime() - 10 * 60000);

        console.log(`  Calculated Start Time: ${startTime.toString()}`);
        console.log(`  Calculated Admission Time (-10m): ${admissionTime.toString()}`);

        let targetStatus = 'active';
        if (now < admissionTime) {
            targetStatus = 'pending';
        }

        console.log(`  Logic Result: now < admissionTime ? ${now < admissionTime}`);
        console.log(`  Target Status should be: ${targetStatus.toUpperCase()}`);
        console.log(`  Actual DB Status: ${order.status.toUpperCase()}`);

        if (targetStatus !== order.status) {
            console.log('  >>> MISMATCH DETECTED <<<');
        }
    }
    process.exit(0);
};

checkLogic();
