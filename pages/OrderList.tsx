import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Timer, Clock, QrCode, Loader2 } from 'lucide-react';
import { BottomNav } from '../components/BottomNav';
import { ordersApi, Order, authApi } from '../src/services/api';

type TabType = 'active' | 'completed' | 'cancelled';

export const OrderList: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);



  // 加载订单数据
  useEffect(() => {
    const fetchOrders = async () => {
      if (!authApi.isLoggedIn()) {
        setLoading(false);
        return;
      }


      try {
        const lastShopId = localStorage.getItem('lastShopId');
        const response = await ordersApi.getOrders(undefined, lastShopId || undefined);
        if (response.success) {
          setOrders(response.orders);
        }
      } catch (error) {
        console.log('Failed to fetch orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // 判断订单是否过期
  const isExpired = (order: Order): boolean => {
    try {
      if (!order.date || !order.end_time) return false;
      const now = new Date();
      // 这里 order.date 是 YYYY-MM-DD
      const dateParts = order.date.split('-');
      const timeParts = order.end_time.split(':');
      if (dateParts.length < 3 || timeParts.length < 2) return false;

      const end = new Date(
        parseInt(dateParts[0]),
        parseInt(dateParts[1]) - 1,
        parseInt(dateParts[2]),
        parseInt(timeParts[0]),
        parseInt(timeParts[1])
      );

      return now > end;
    } catch (e) {
      return false;
    }
  };

  const getOrderDisplayStatus = (order: Order): TabType => {
    if (order.status === 'cancelled') return 'cancelled';
    if (order.status === 'completed') return 'completed';
    // 如果 status 是 active 但已过期，视为 completed
    if (order.status === 'active' && isExpired(order)) return 'completed';
    return 'active';
  };

  // 过滤订单
  const filteredOrders = orders.filter(order => getOrderDisplayStatus(order) === activeTab);

  // 计算剩余时间
  const calculateRemainingTime = (order: Order): string => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    if (order.date !== today) {
      return '未开始';
    }

    const [endHour, endMin] = order.end_time.split(':').map(Number);
    const endDate = new Date();
    endDate.setHours(endHour, endMin, 0);

    const diff = endDate.getTime() - now.getTime();
    if (diff <= 0) return '已结束';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `剩余 ${hours}h ${minutes}min`;
    }
    return `剩余 ${minutes}min`;
  };



  return (
    <div className="flex flex-col min-h-screen bg-background-light pb-24 max-w-md mx-auto">
      <div className="sticky top-0 z-20 bg-background-light shadow-sm">
        <div className="flex items-center px-4 py-3 justify-center">
          <h2 className="text-primary text-lg font-bold leading-tight tracking-tight">预约记录</h2>
        </div>
        <div className="px-0">
          <div className="flex border-b border-[#dce5dc] px-4 justify-between">
            {[
              { id: 'active', label: '进行中' },
              { id: 'completed', label: '已完成' },
              { id: 'cancelled', label: '已取消' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex flex-col items-center justify-center border-b-[3px] pb-3 pt-2 flex-1 transition-colors ${activeTab === tab.id
                  ? 'border-b-primary text-primary'
                  : 'border-b-transparent text-gray-400 hover:text-primary'
                  }`}
              >
                <p className={`text-sm tracking-[0.015em] ${activeTab === tab.id ? 'font-bold' : 'font-medium'}`}>
                  {tab.label}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-5 p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-brand-green animate-spin" />
          </div>
        ) : (
          <>


            {/* 从 API 获取的订单 */}
            {filteredOrders.map((order) => {
              const displayStatus = getOrderDisplayStatus(order);
              return (
                <div key={order.id} className="group relative flex flex-col items-stretch justify-between gap-4 rounded-xl bg-white p-4 shadow-sm border border-transparent overflow-hidden">
                  {displayStatus === 'active' && (
                    <div className="absolute top-0 left-0 h-full w-1 bg-primary"></div>
                  )}
                  <div className="flex flex-col gap-4 z-10">
                    <div className="flex flex-col gap-2">
                      {displayStatus === 'active' && (
                        <div className="inline-flex items-center gap-1.5">
                          <Timer className="text-primary w-5 h-5" />
                          <p className="text-primary text-sm font-bold tracking-wide">{calculateRemainingTime(order)}</p>
                        </div>
                      )}
                      <div>
                        <div className="flex justify-between items-start">
                          <h3 className="text-primary text-lg font-bold leading-tight mb-1">
                            {order.seats?.zone_name ? `${order.seats.zone_name} - ` : ''}
                            {order.seats?.label || '座位'}
                          </h3>
                          {displayStatus !== 'active' && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${displayStatus === 'completed'
                              ? 'bg-[#F3F4F6] text-[#4B5563]'
                              : 'bg-[#FEF2F2] text-[#991B1B]'
                              }`}>
                              {displayStatus === 'completed' ? '已完成' : '已取消'}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-500 text-sm font-normal flex items-center gap-1">
                          <Clock size={16} /> {order.start_time} - {order.end_time} ({order.date})
                        </p>
                        <p className="text-primary text-sm font-semibold mt-1">¥{order.final_price?.toFixed(2)}</p>
                        {order.created_at && (
                          <p className="text-xs text-gray-400 mt-1">
                            下单时间: {new Date(order.created_at).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })}
                          </p>
                        )}
                      </div>
                    </div>
                    {displayStatus === 'active' && (
                      <button onClick={() => navigate(`/ticket/${order.id}`)} className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-11 px-5 bg-primary hover:bg-[#333333] active:scale-[0.98] transition-all text-white shadow-lg shadow-black/10 gap-2 text-sm font-bold">
                        <QrCode size={20} />
                        <span className="truncate">入场核销码</span>
                      </button>
                    )}
                  </div>

                  {displayStatus !== 'active' && (
                    <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                      {displayStatus === 'completed' && (
                        <button className="flex min-w-[72px] cursor-pointer items-center justify-center rounded-lg h-8 px-3 border border-gray-200 bg-white text-primary text-xs font-bold hover:bg-gray-50 transition-colors">评价</button>
                      )}
                      <button className="flex min-w-[72px] cursor-pointer items-center justify-center rounded-lg h-8 px-3 border border-gray-200 bg-white text-brand-green text-xs font-bold hover:bg-gray-50 transition-colors">再来一单</button>
                    </div>
                  )}
                </div>
              );
            })}

            {/* 空状态 */}
            {filteredOrders.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Clock size={48} className="mb-4 opacity-50" />
                <p className="text-sm">暂无{activeTab === 'active' ? '进行中' : activeTab === 'completed' ? '已完成' : '已取消'}的订单</p>
              </div>
            )}
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
};