import React, { useEffect, useState } from 'react';
import { Users, ShoppingBag, CreditCard, Store, TrendingUp, ArrowUpRight } from 'lucide-react';
import { shopsApi, adminApi } from '../../src/services/api';
import { useNavigate } from 'react-router-dom';

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; trend?: string; color: string; trendUp?: boolean }> = ({ title, value, icon, trend, color, trendUp = true }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
        <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-br from-transparent to-gray-50 rounded-bl-full opacity-50 group-hover:scale-110 transition-transform origin-top-right"></div>
        <div className="relative z-10">
            <p className="text-sm text-gray-500 font-medium mb-2">{title}</p>
            <h3 className="text-3xl font-bold text-gray-900 mb-2">{value}</h3>
            {trend && (
                <div className={`flex items-center gap-1 text-xs font-semibold ${trendUp ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'} w-fit px-2.5 py-1 rounded-full`}>
                    <TrendingUp size={12} className={trendUp ? '' : 'rotate-180'} />
                    <span>{trend}</span>
                </div>
            )}
        </div>
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${color} shadow-sm group-hover:scale-110 transition-transform`}>
            {icon}
        </div>
    </div>
);

export const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [shopCount, setShopCount] = useState(0);
    const [orders, setOrders] = useState<any[]>([]);
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalOrders: 0,
        uniqueUsers: 0,
        revenueTrend: 0,
        orderTrend: 0
    });

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Fetch Shops
                const shopsRes = await shopsApi.getShops();
                if (shopsRes.success) setShopCount(shopsRes.shops.length);

                // Fetch Orders
                const ordersRes = await adminApi.getAllOrders();
                if (ordersRes.success && ordersRes.orders) {
                    const orders = ordersRes.orders;
                    setOrders(orders);

                    // --- Calculate Stats Trend ---
                    const now = new Date();
                    const startOfThisWeek = new Date(now);
                    startOfThisWeek.setDate(now.getDate() - now.getDay()); // Sunday
                    startOfThisWeek.setHours(0, 0, 0, 0);

                    const startOfLastWeek = new Date(startOfThisWeek);
                    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

                    const endOfLastWeek = new Date(startOfThisWeek);

                    let thisWeekRevenue = 0;
                    let lastWeekRevenue = 0;
                    let thisWeekOrders = 0;
                    let lastWeekOrders = 0;

                    const totalRevenue = orders.reduce((sum: number, order: any) => {
                        const amount = Number(order.final_price || order.original_price || 0);
                        const date = new Date(order.created_at);

                        if (date >= startOfThisWeek) {
                            thisWeekRevenue += amount;
                            thisWeekOrders++;
                        } else if (date >= startOfLastWeek && date < endOfLastWeek) {
                            lastWeekRevenue += amount;
                            lastWeekOrders++;
                        }

                        return sum + amount;
                    }, 0);

                    // Helper for trend %
                    const getTrend = (current: number, prev: number) => {
                        if (prev === 0) return current > 0 ? 100 : 0;
                        return ((current - prev) / prev) * 100;
                    };

                    const revenueTrend = getTrend(thisWeekRevenue, lastWeekRevenue);
                    const orderTrend = getTrend(thisWeekOrders, lastWeekOrders);

                    const uniqueUsers = new Set(orders.map((o: any) => o.user_id)).size;

                    setStats({
                        totalRevenue,
                        totalOrders: orders.length,
                        uniqueUsers: Math.max(uniqueUsers, 0),
                        // Add calculated trends to stats object (need to update state type or just use separate stats)
                        revenueTrend,
                        orderTrend
                    });
                }
            } catch (err) {
                console.error("Failed to fetch dashboard data", err);
            }
        };

        fetchDashboardData();
    }, []);

    // Get recent 5 orders
    const recentOrders = orders.slice(0, 5);

    return (
        <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="总收入"
                    value={`¥${stats.totalRevenue.toLocaleString()}`}
                    icon={<CreditCard className="text-blue-600" size={26} />}
                    trend={`${stats.revenueTrend >= 0 ? '+' : ''}${stats.revenueTrend.toFixed(1)}% 周环比`}
                    trendUp={stats.revenueTrend >= 0}
                    color="bg-blue-50"
                />
                <StatCard
                    title="总订单数"
                    value={stats.totalOrders.toLocaleString()}
                    icon={<ShoppingBag className="text-purple-600" size={26} />}
                    trend={`${stats.orderTrend >= 0 ? '+' : ''}${stats.orderTrend.toFixed(1)}% 周环比`}
                    trendUp={stats.orderTrend >= 0}
                    color="bg-purple-50"
                />
                <StatCard
                    title="活跃店铺"
                    value={shopCount.toString()}
                    icon={<Store className="text-brand-green" size={26} />}
                    trend="正常运营中"
                    color="bg-green-50"
                />
                <StatCard
                    title="注册用户"
                    value={stats.uniqueUsers.toLocaleString()} // Using mock baseline + real unique count
                    icon={<Users className="text-orange-600" size={26} />}
                    trend="+8.1% 周环比"
                    color="bg-orange-50"
                />
            </div>

            {/* Charts / Activity Split */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Chart Placeholder */}
                <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-gray-900">收入趋势</h3>
                        <select className="bg-gray-50 border-none text-sm font-medium text-gray-600 rounded-lg px-3 py-1">
                            <option>最近7天</option>
                            <option>最近30天</option>
                        </select>
                    </div>
                    <div className="h-64 flex items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-400">
                        图表区域 (Chart.js / Recharts)
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-gray-900">最新订单</h3>
                        <button
                            onClick={() => navigate('/admin/orders')}
                            className="text-sm text-brand-green font-medium flex items-center gap-1 hover:underline">
                            全部 <ArrowUpRight size={16} />
                        </button>
                    </div>
                    <div className="space-y-4">
                        {recentOrders.length === 0 ? (
                            <div className="text-center text-gray-400 py-4 text-sm">暂无最新订单</div>
                        ) : recentOrders.map((order) => (
                            <div key={order.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs shrink-0">
                                        {order.users?.username?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="font-medium text-gray-900 text-sm truncate">{order.users?.username || '未知用户'}</p>
                                        <p className="text-xs text-gray-500 truncate">{new Date(order.created_at).toLocaleTimeString()} - {order.shops?.name}</p>
                                    </div>
                                </div>
                                <span className="font-bold text-gray-900 text-sm whitespace-nowrap">+ ¥{order.final_price || order.original_price}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
