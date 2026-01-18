import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Bell, Calendar, Tag, MessageSquare, ShoppingBag } from 'lucide-react';
import { announcementsApi, ordersApi, Announcement, Order } from '../src/services/api';

export const Notifications: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'messages' | 'announcements'>('messages');
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Use activeShopId from sessionStorage (consistent with other pages)
                const currentShopId = sessionStorage.getItem('activeShopId');

                // Fetch Announcements for current shop
                const annRes = await announcementsApi.getActive(currentShopId || undefined);
                if (annRes.success && annRes.announcements) {
                    const sorted = [...annRes.announcements].sort((a, b) =>
                        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                    );
                    setAnnouncements(sorted);
                }

                // Fetch Orders for System Notifications
                if (localStorage.getItem('token')) {
                    const orderRes = await ordersApi.getOrders(undefined, currentShopId || undefined);
                    if (orderRes.success && orderRes.orders) {
                        setOrders(orderRes.orders);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch data', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const getTagColor = (colorStr?: string) => {
        const safeColor = colorStr?.toLowerCase() || 'brand-green';
        const colorMap: Record<string, string> = {
            'brand-green': 'text-[#3E6950] bg-[#3E6950]/10',
            'green': 'text-green-600 bg-green-50',
            'red': 'text-red-600 bg-red-50',
            'orange': 'text-orange-600 bg-orange-50',
            'blue': 'text-blue-600 bg-blue-50',
        };
        return colorMap[safeColor] || 'text-[#3E6950] bg-[#3E6950]/10';
    };

    // Helper to generate notification message from order
    const getOrderNotification = (order: Order) => {
        switch (order.status) {
            case 'active':
                return {
                    title: '订单进行中',
                    content: `您在 ${order.shops?.name} 的预约（${order.seats?.label || '座位'}）正在进行中。`,
                    icon: <ShoppingBag className="w-5 h-5 text-blue-500" />,
                    bg: 'bg-blue-50'
                };
            case 'completed':
                return {
                    title: '订单已完成',
                    content: `您已完成在 ${order.shops?.name} 的学习，本次专注时长 ${order.duration} 小时。`,
                    icon: <MessageSquare className="w-5 h-5 text-green-500" />,
                    bg: 'bg-green-50'
                };
            case 'cancelled':
                return {
                    title: '订单已取消',
                    content: `您的预约已取消。期待下次光临。`,
                    icon: <Bell className="w-5 h-5 text-gray-400" />,
                    bg: 'bg-gray-50'
                };
            default:
                return {
                    title: '订单状态更新',
                    content: '您的订单状态有更新。',
                    icon: <Bell className="w-5 h-5 text-gray-500" />,
                    bg: 'bg-gray-50'
                };
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white shadow-sm">
                <div className="px-4 py-3 flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
                    >
                        <ChevronLeft className="w-6 h-6 text-gray-700" />
                    </button>
                    <span className="text-lg font-bold text-gray-900">消息中心</span>
                </div>

                {/* Tabs */}
                <div className="flex px-4 gap-6 border-b border-gray-100">
                    <button
                        onClick={() => setActiveTab('messages')}
                        className={`pb-3 text-sm font-bold relative transition-colors ${activeTab === 'messages' ? 'text-[#3E6950]' : 'text-gray-400'}`}
                    >
                        系统通知
                        {activeTab === 'messages' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#3E6950] rounded-full"></span>}
                        {orders.length > 0 && <span className="absolute -top-1 -right-2 w-1.5 h-1.5 bg-red-500 rounded-full"></span>}
                    </button>
                    <button
                        onClick={() => setActiveTab('announcements')}
                        className={`pb-3 text-sm font-bold relative transition-colors ${activeTab === 'announcements' ? 'text-[#3E6950]' : 'text-gray-400'}`}
                    >
                        门店公告
                        {activeTab === 'announcements' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#3E6950] rounded-full"></span>}
                        {announcements.length > 0 && <span className="absolute -top-1 -right-2 w-1.5 h-1.5 bg-red-500 rounded-full"></span>}
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 px-4 py-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <div className="w-8 h-8 border-2 border-[#3E6950] border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-gray-500 text-sm">加载中...</p>
                    </div>
                ) : (
                    <>
                        {/* Messages Tab */}
                        {activeTab === 'messages' && (
                            orders.length > 0 ? (
                                <div className="flex flex-col gap-3">
                                    {orders.map((order) => {
                                        const notif = getOrderNotification(order);
                                        return (
                                            <div key={order.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex gap-4 animate-in slide-in-from-bottom-2 duration-300">
                                                <div className={`w-10 h-10 rounded-full ${notif.bg} flex items-center justify-center shrink-0`}>
                                                    {notif.icon}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <h3 className="text-base font-bold text-gray-900">{notif.title}</h3>
                                                        <span className="text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                    <p className="text-sm text-gray-600 leading-relaxed">{notif.content}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 opacity-60">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                        <MessageSquare className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-1">暂无通知</h3>
                                    <p className="text-sm text-gray-500">重要的系统消息会显示在这里</p>
                                </div>
                            )
                        )}

                        {/* Announcements Tab */}
                        {activeTab === 'announcements' && (
                            announcements.length > 0 ? (
                                <div className="flex flex-col gap-3">
                                    {announcements.map((item) => (
                                        <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 animate-in slide-in-from-bottom-2 duration-300">
                                            <div className="flex items-start justify-between mb-2">
                                                <div className={`px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1 ${getTagColor(item.tag_color)}`}>
                                                    <Tag className="w-3 h-3" />
                                                    {item.tag || '通知'}
                                                </div>
                                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(item.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <h3 className="text-base font-bold text-gray-900 mb-1">{item.title}</h3>
                                            <p className="text-sm text-gray-600 leading-relaxed">{item.content}</p>
                                            {item.image_url && (
                                                <div className="mt-3 rounded-xl overflow-hidden aspect-video w-full">
                                                    <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 opacity-60">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                        <Bell className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-1">暂无公告</h3>
                                    <p className="text-sm text-gray-500">门店最新动态会显示在这里</p>
                                </div>
                            )
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
