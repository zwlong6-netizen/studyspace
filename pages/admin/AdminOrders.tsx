import React, { useState, useEffect } from 'react';
import { Search, Filter, Eye, MoreHorizontal, CheckCircle, Clock, XCircle, Calendar, CreditCard, Loader2 } from 'lucide-react';
import { adminApi, Order } from '../../src/services/api';

const OrderStatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const styles = {
        completed: 'bg-green-50 text-green-700 border-green-100',
        active: 'bg-blue-50 text-blue-700 border-blue-100',
        cancelled: 'bg-gray-50 text-gray-600 border-gray-200',
    };

    const icons = {
        completed: <CheckCircle size={13} />,
        active: <Clock size={13} />,
        cancelled: <XCircle size={13} />,
    };

    const labels = {
        completed: '已完成',
        active: '进行中',
        cancelled: '已取消',
    };

    return (
        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[status as keyof typeof styles] || styles.cancelled}`}>
            {icons[status as keyof typeof icons] || icons.cancelled}
            {labels[status as keyof typeof labels] || status}
        </span>
    );
};

export const AdminOrders: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        setLoading(true);
        try {
            console.log("Fetching all orders...");
            const res = await adminApi.getAllOrders();
            console.log("Admin orders response:", res);
            if (res.success && res.orders) {
                setOrders(res.orders);
            } else {
                console.error("Failed to fetch orders or no orders returned:", res);
            }
        } catch (error) {
            console.error("Failed to load orders", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredOrders = orders.filter(order =>
        (statusFilter === 'all' || order.status === statusFilter) &&
        (order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (order.users?.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (order.users?.phone || '').includes(searchTerm))
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">订单管理</h1>
                    <p className="text-gray-500 mt-1">查看和管理系统内的所有历史订单记录。</p>
                </div>
                <button
                    onClick={loadOrders}
                    className="bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 hover:bg-gray-50 transition-colors shadow-sm">
                    <Filter size={18} />
                    刷新列表
                </button>
            </div>

            {/* Toolbar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center gap-4">
                {/* Status Tabs */}
                <div className="flex bg-gray-100/80 p-1 rounded-xl w-full sm:w-auto">
                    {[
                        { id: 'all', label: '全部订单' },
                        { id: 'active', label: '进行中' },
                        { id: 'completed', label: '已完成' },
                        { id: 'cancelled', label: '已取消' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setStatusFilter(tab.id)}
                            className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${statusFilter === tab.id
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="h-6 w-px bg-gray-200 mx-2 hidden sm:block"></div>

                <div className="relative flex-1 w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="搜索订单号、用户名、手机号..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green outline-none transition-all"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wider">
                                <th className="px-6 py-4 font-semibold">订单号</th>
                                <th className="px-6 py-4 font-semibold">用户信息</th>
                                <th className="px-6 py-4 font-semibold">预订详情</th>
                                <th className="px-6 py-4 font-semibold">支付金额</th>
                                <th className="px-6 py-4 font-semibold">当前状态</th>
                                <th className="px-6 py-4 font-semibold">下单时间</th>
                                <th className="px-6 py-4 font-semibold text-right">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100/80">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <Loader2 className="w-8 h-8 text-brand-green animate-spin" />
                                            加载中...
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-2">
                                                <Search size={24} />
                                            </div>
                                            没有找到符合条件的订单
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50/80 transition-colors group">
                                        <td className="px-6 py-4 font-mono font-medium text-gray-900 text-sm">
                                            {order.id.slice(0, 8)}...
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-semibold text-gray-900 text-sm">{order.users?.username || '未知用户'}</p>
                                                <p className="text-xs text-gray-400 mt-0.5">{order.users?.phone || '-'}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <div className="font-medium text-gray-900 mb-0.5">{order.shops?.name || '未知店铺'}</div>
                                            <div className="flex items-center gap-2">
                                                <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                                    {order.seats?.zone_name} {order.seats?.label}座
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-900">¥{order.final_price || order.original_price}</div>
                                            <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-400">
                                                <CreditCard size={10} />
                                                {order.payment_method === 'wechat' ? '微信支付' : '支付宝'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <OrderStatusBadge status={order.status} />
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar size={13} className="text-gray-400" />
                                                {new Date(order.created_at).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                                <button className="p-2 text-gray-500 hover:text-brand-green hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100" title="查看详情">
                                                    <Eye size={18} />
                                                </button>
                                                <button className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors" title="更多">
                                                    <MoreHorizontal size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
