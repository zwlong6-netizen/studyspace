import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Clock, Info, Loader2 } from 'lucide-react';
import { ordersApi, Order } from '../src/services/api';

export const TicketDetail: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrder = async () => {
            if (!id) return;
            try {
                const res = await ordersApi.getOrderDetail(id);
                if (res.success) {
                    setOrder(res.order);
                }
            } catch (error) {
                console.error('Failed to load ticket:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [id]);

    if (loading) {
        return (
            <div className="flex min-h-screen bg-background-light items-center justify-center">
                <Loader2 className="w-8 h-8 text-brand-green animate-spin" />
            </div>
        );
    }

    if (!order) {
        return (
            <div className="flex flex-col min-h-screen bg-background-light pb-24 max-w-md mx-auto">
                <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md">
                    <div className="flex items-center px-4 h-12 justify-between">
                        <button onClick={() => navigate(-1)} className="flex size-10 items-center justify-start transition-colors">
                            <ChevronLeft className="text-primary" />
                        </button>
                        <h1 className="text-primary text-[17px] font-bold leading-tight tracking-tight flex-1 text-center pr-10">
                            入场核销
                        </h1>
                    </div>
                </div>
                <div className="flex-1 flex items-center justify-center text-gray-400">
                    未找到订单信息
                </div>
            </div>
        );
    }

    // Formatting
    const dateStr = new Date(order.date).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' });
    const isToday = new Date().toISOString().split('T')[0] === order.date;
    const dateDisplay = isToday ? `今天 (${dateStr})` : dateStr;

    // Use last 6 chars of ID as code
    const verifyCode = order.id.slice(-6).toUpperCase().match(/.{1,3}/g)?.join(' ');

    return (
        <div className="flex flex-col min-h-screen bg-background-light pb-24 max-w-md mx-auto">
            <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md">
                <div className="flex items-center px-4 h-12 justify-between">
                    <button onClick={() => navigate(-1)} className="flex size-10 items-center justify-start transition-colors">
                        <ChevronLeft className="text-primary" />
                    </button>
                    <h1 className="text-primary text-[17px] font-bold leading-tight tracking-tight flex-1 text-center pr-10">
                        入场核销
                    </h1>
                </div>
            </div>

            <main className="flex-1 px-6 py-8 flex flex-col items-center">
                <div className="w-full bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
                    <div className="p-8 flex flex-col items-center">
                        <div className="text-center mb-8">
                            <h2 className="text-xl font-bold text-primary mb-2">
                                {order.shops?.name || '未知门店'}
                            </h2>
                            <p className="text-base text-gray-600 font-medium mb-3">
                                {order.seats?.zone_name} - {order.seats?.label || '座位'}
                            </p>
                            <div className="flex items-center justify-center gap-2 text-forest-green bg-brand-green/10 px-4 py-1.5 rounded-full whitespace-nowrap w-auto max-w-full">
                                <Clock size={16} />
                                <span className="text-sm font-medium">
                                    {order.start_time?.slice(0, 5)} - {order.end_time?.slice(0, 5)} ({dateDisplay})
                                </span>
                            </div>
                        </div>

                        <div className="w-full max-w-[240px] aspect-square bg-white border-4 border-gray-50 rounded-xl p-4 mb-6 shadow-inner flex items-center justify-center relative">
                            <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuBHPpYAHlCFMzWXPzUv9PFlzlCPfaOv2eBUYPHWDfowxxTfgLQ_Hbq8aeSWGH78mGQAsaw3_drropxFiP9QQA_yjO_8j8d17Oxu0L9toc4LhJtxzu-ArzsMbDSLuHgGSKpkMN6H2rPBgMmlgxtueaesUspt58y_02mcVaUbR5cCQG4FlIWCPpG5fjGORYL3ihg2-y0MKzdeGAlkX6krSjpmDk-1DLu5CMQckvak3PJgS0Yxm-WhG0Z1LYcSe0Zb0O10MR_3ZKqBuz0" className="w-full h-full object-cover" alt="QR Code" />
                            <div className="absolute top-0 left-0 w-full h-0.5 bg-forest-green/20 animate-pulse mt-4"></div>
                        </div>

                        <div className="flex flex-col items-center gap-1 mb-2">
                            <span className="text-xs text-gray-400 uppercase tracking-[0.2em]">核销码</span>
                            <div className="flex gap-2">
                                <span className="text-2xl font-bold tracking-[0.3em] text-primary">{verifyCode}</span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50/80 px-6 py-4 border-t border-dashed border-gray-200 text-center">
                        <p className="text-sm text-gray-500">请在入口设备处扫描上方二维码</p>
                    </div>
                </div>

                <div className="mt-12 w-full flex flex-col gap-4 px-2">
                    <div className="flex items-start gap-3">
                        <Info size={18} className="text-brand-green mt-0.5 shrink-0" />
                        <p className="text-xs text-gray-500 leading-relaxed">请提前打开手机蓝牙以便设备感应，如二维码无法扫描，请输入 6 位核销码手动开启。</p>
                    </div>
                </div>
            </main>
        </div>
    );
};
