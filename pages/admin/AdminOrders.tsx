import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Search, Filter, Eye, CheckCircle, Clock, XCircle, Calendar, CreditCard, Loader2, X, Ban } from 'lucide-react';
import { adminApi, ordersApi } from '../../src/services/api';

// Helper to determine status
const getOrderStatus = (order: any) => {
    if (order.status !== 'active') return order.status;

    // Check if time has passed
    try {
        const now = new Date();
        const orderDate = new Date(order.date);

        // Parse end time (HH:mm:ss)
        const [endHour, endMinute] = (order.end_time || '00:00').split(':').map(Number);
        const orderEndTime = new Date(orderDate);
        orderEndTime.setHours(endHour, endMinute, 0, 0);

        if (now > orderEndTime) {
            return 'completed';
        }
    } catch (e) {
        console.error("Date parse error", e);
    }

    return order.status;
};

const OrderStatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const styles = {
        completed: 'bg-green-50 text-green-700 border-green-100',
        active: 'bg-blue-50 text-blue-700 border-blue-100',
        pending: 'bg-yellow-50 text-yellow-700 border-yellow-100',
        cancelled: 'bg-gray-50 text-gray-600 border-gray-200',
    };

    const icons = {
        completed: <CheckCircle size={13} />,
        active: <Clock size={13} />,
        pending: <Clock size={13} />,
        cancelled: <XCircle size={13} />,
    };

    const labels = {
        completed: '已完成',
        active: '进行中',
        pending: '未开始',
        cancelled: '已取消',
    };

    return (
        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[status as keyof typeof styles] || styles.cancelled}`}>
            {icons[status as keyof typeof icons] || icons.cancelled}
            {labels[status as keyof typeof labels] || status}
        </span>
    );
};


import { toast } from 'react-hot-toast';
import { confirmToast } from '../../src/utils/confirmToast';

export const AdminOrders: React.FC = () => {
    const { currentShopId } = useOutletContext<{ currentShopId: string }>();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Detail Modal
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    useEffect(() => {
        if (currentShopId) {
            loadOrders(currentShopId);
        }
    }, [currentShopId]);

    const loadOrders = async (shopId: string) => {
        setLoading(true);
        try {
            const res = await adminApi.getAllOrders(shopId);
            if (res.success && res.orders) {
                setOrders(res.orders);
            } else {
                toast.error('加载订单失败');
            }
        } catch (error) {
            console.error("Failed to load orders", error);
            toast.error('网络错误');
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetail = (order: any) => {
        setSelectedOrder(order);
        setIsDetailOpen(true);
    };

    // ...

    // ...

    const handleCancelOrder = (orderId: string) => {
        confirmToast('确定要取消这个订单吗？', async () => {
            try {
                const res = await ordersApi.cancelOrder(orderId);
                if (res.success) {
                    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o));
                    if (selectedOrder?.id === orderId) {
                        setSelectedOrder((prev: any) => ({ ...prev, status: 'cancelled' }));
                    }
                    toast.success('订单已取消');
                } else {
                    toast.error(res.message || '取消订单失败');
                }
            } catch (error) {
                console.error('Cancel order failed:', error);
                toast.error('取消订单失败');
            }
        });
    };

    const filteredOrders = orders.map(order => ({
        ...order,
        displayStatus: getOrderStatus(order)
    })).filter(order =>
        (statusFilter === 'all' || order.displayStatus === statusFilter) &&
        (order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (order.users?.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (order.users?.phone || '').includes(searchTerm))
    );

    return (
        <div className="space-y-6">
            {/* ... header ... */}

            {/* ... toolbar ... */}
            {/* Using ... existing code ... */}

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        {/* ... thead ... */}
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
                                            <Loader2 className="w-8 h-8 text-[#3E6950] animate-spin" />
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
                                            <div className="font-medium text-gray-900 mb-0.5">
                                                {order.seats?.zone_name} {order.seats?.label}座
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                                    {(order.start_time || '').slice(0, 5)}~{(order.end_time || '').slice(0, 5)}
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
                                            <OrderStatusBadge status={order.displayStatus} />
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar size={13} className="text-gray-400" />
                                                {new Date(order.created_at).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                                <button
                                                    onClick={() => handleViewDetail(order)}
                                                    className="p-2 text-gray-500 hover:text-[#3E6950] hover:bg-green-50 rounded-lg transition-colors"
                                                    title="查看详情"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                {order.displayStatus === 'active' && (
                                                    <button
                                                        onClick={() => handleCancelOrder(order.id)}
                                                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="取消订单"
                                                    >
                                                        <Ban size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Order Detail Modal */}
            {isDetailOpen && selectedOrder && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 relative">
                        <button onClick={() => setIsDetailOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                            <X size={20} />
                        </button>
                        <h2 className="text-xl font-bold mb-4">订单详情</h2>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span className="text-gray-600">订单号</span>
                                <span className="font-mono font-medium">{selectedOrder.id}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span className="text-gray-600">状态</span>
                                <OrderStatusBadge status={selectedOrder.status} />
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span className="text-gray-600">用户</span>
                                <span className="font-medium">{selectedOrder.users?.username || '-'}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span className="text-gray-600">店铺</span>
                                <span className="font-medium">{selectedOrder.shops?.name || '-'}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span className="text-gray-600">座位</span>
                                <span className="font-medium">{selectedOrder.seats?.zone_name} {selectedOrder.seats?.label}座</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span className="text-gray-600">时段</span>
                                <span className="font-medium">{selectedOrder.start_time} - {selectedOrder.end_time}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span className="text-gray-600">金额</span>
                                <span className="font-bold text-lg">¥{selectedOrder.final_price || selectedOrder.original_price}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span className="text-gray-600">下单时间</span>
                                <span className="font-medium">{new Date(selectedOrder.created_at).toLocaleString('zh-CN')}</span>
                            </div>

                            {selectedOrder.status === 'active' && (
                                <div className="pt-4 border-t">
                                    <button
                                        onClick={() => handleCancelOrder(selectedOrder.id)}
                                        className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Ban size={18} />
                                        取消订单
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
