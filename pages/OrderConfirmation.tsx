import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Timer, Armchair, CalendarClock, MessageSquare, QrCode, Wallet, ShieldCheck, Zap, Loader2 } from 'lucide-react';
import { ordersApi, authApi } from '../src/services/api';

export const OrderConfirmation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'wechat' | 'alipay' | 'balance'>('wechat');

  const state = location.state as {
    storeName?: string;
    storeId?: string;
    seatId?: string;
    seatLabel?: string;
    date?: string;
    startTime?: string;
    endTime?: string;
    duration?: number;
    price?: string;
    fullDate?: string;
  } | null;

  const {
    storeName = '静安图书馆 - 3楼自习室',
    storeId = '',
    seatId = '',
    seatLabel = 'A-05',
    date = '10月24日',
    startTime = '14:00',
    endTime = '18:00',
    duration = 4,
    price = '40.00'
  } = state || {};

  const originalPrice = parseFloat(price);
  const discount = 5.00;
  const finalPrice = Math.max(0, originalPrice - discount).toFixed(2);

  const handlePay = async () => {
    setError('');

    // 检查登录状态
    if (!authApi.isLoggedIn()) {
      navigate('/login');
      return;
    }

    // 如果没有真实的 storeId 和 seatId，使用演示模式
    if (!storeId || !seatId) {
      // 演示模式：直接跳转到订单列表
      navigate('/orders', {
        state: {
          newOrder: {
            storeName,
            seatId: seatLabel,
            date,
            startTime,
            endTime,
            price: finalPrice
          }
        }
      });
      return;
    }

    setLoading(true);
    try {
      // 格式化日期为 YYYY-MM-DD
      // 格式化日期为 YYYY-MM-DD (优先使用传递的 fullDate)
      let dateStr = state?.fullDate;
      if (!dateStr) {
        const today = new Date();
        dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      }

      const response = await ordersApi.createOrder({
        shop_id: storeId,
        seat_id: seatId,
        date: dateStr,
        start_time: startTime,
        end_time: endTime,
        duration,
        original_price: originalPrice,
        discount,
        payment_method: paymentMethod
      });

      if (response.success) {
        navigate('/orders', {
          state: {
            newOrder: {
              storeName,
              seatId: seatLabel,
              date,
              startTime,
              endTime,
              price: finalPrice
            }
          }
        });
      } else {
        setError(response.message || '订单创建失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '支付失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col min-h-screen w-full max-w-md mx-auto bg-background-light shadow-2xl">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="flex items-center justify-between px-4 h-14">
          <button onClick={() => navigate(-1)} className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors">
            <ChevronLeft className="text-gray-800" size={24} />
          </button>
          <h1 className="text-lg font-bold tracking-tight text-gray-900">确认订单</h1>
          <div className="w-10"></div>
        </div>
      </header>

      <div className="bg-primary/10 px-4 py-2 flex items-center justify-center gap-2">
        <Timer className="text-primary w-4 h-4" />
        <p className="text-sm font-medium text-primary">
          请在 <span className="font-bold tabular-nums">14:59</span> 内完成支付
        </p>
      </div>

      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          {error}
        </div>
      )}

      <main className="flex-1 flex flex-col gap-4 p-4 pb-28">
        {/* Store Info */}
        <section className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex gap-4">
            <div className="flex-1 space-y-2">
              <h2 className="text-base font-bold leading-tight text-gray-900 line-clamp-2">
                {storeName}
              </h2>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Armchair size={18} />
                  <span>座位: <span className="font-semibold text-gray-800">{seatLabel}</span> (靠近窗户)</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CalendarClock size={18} />
                  <span>{date} <span className="font-semibold">{startTime} - {endTime}</span></span>
                </div>
              </div>
            </div>
            <div className="w-24 h-24 shrink-0 rounded-lg bg-gray-100 overflow-hidden">
              <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuANTophqyFSqLtQsNqLoQrZvsbRFHr-LFKjZ-PBiZlm0GtjhwoEiuXBNEGSqA0xfhLzzUFpKeT-eQL34rF-0tbidsen4gKufOybcgJBPkecTgNl7ZxFj2pIjADJ-pr_9Jic1slk3t6ckA9NMLpmsa1s0GOpnqPRQJYl9XLjZM8lzieWLqeaJdx20-iMVJj-rR_rAr5QgvTwLrr6VDlV96weh_fAokuCLQqSWDECsSLokTjeqBHqx0TiFyY5M0IofoEkCxsQU_xUkMY" className="w-full h-full object-cover" alt="Seat" />
            </div>
          </div>
        </section>

        {/* Price Info */}
        <section className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">套餐费 ({duration}小时)</span>
              <span className="font-medium text-gray-900">¥{originalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-1">
                <span className="text-gray-600">优惠券</span>
                <span className="bg-primary/10 text-brand-green text-[10px] px-1.5 py-0.5 rounded font-bold">新用户</span>
              </div>
              <span className="font-medium text-brand-green">-¥{discount.toFixed(2)}</span>
            </div>
            <div className="h-px bg-gray-100 my-2"></div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-gray-900">小计</span>
              <span className="text-lg font-bold text-gray-900">¥{finalPrice}</span>
            </div>
          </div>
        </section>

        {/* Payment Methods */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 pt-4 pb-2">
            <h3 className="text-sm font-bold text-gray-900">支付方式</h3>
          </div>
          <div className="flex flex-col">
            <label className="relative flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors group" onClick={() => setPaymentMethod('wechat')}>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#09bb07]/10 text-[#09bb07]">
                  <MessageSquare size={18} className="fill-current" />
                </div>
                <span className="text-sm font-medium text-gray-900">微信支付</span>
              </div>
              <input
                type="radio"
                name="payment"
                className="peer sr-only"
                checked={paymentMethod === 'wechat'}
                onChange={() => setPaymentMethod('wechat')}
              />
              <div className="w-5 h-5 rounded-full border-2 border-gray-300 peer-checked:border-brand-green peer-checked:bg-brand-green flex items-center justify-center transition-all">
                <div className="w-2 h-2 bg-white rounded-full opacity-0 peer-checked:opacity-100"></div>
              </div>
            </label>
            <div className="h-px bg-gray-100 mx-4"></div>
            <label className="relative flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors group" onClick={() => setPaymentMethod('alipay')}>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#1677ff]/10 text-[#1677ff]">
                  <QrCode size={18} />
                </div>
                <span className="text-sm font-medium text-gray-900">支付宝</span>
              </div>
              <input
                type="radio"
                name="payment"
                className="peer sr-only"
                checked={paymentMethod === 'alipay'}
                onChange={() => setPaymentMethod('alipay')}
              />
              <div className="w-5 h-5 rounded-full border-2 border-gray-300 peer-checked:border-brand-green peer-checked:bg-brand-green flex items-center justify-center transition-all">
                <div className="w-2 h-2 bg-white rounded-full opacity-0 peer-checked:opacity-100"></div>
              </div>
            </label>
            <div className="h-px bg-gray-100 mx-4"></div>
            <label className="relative flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors group opacity-60">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-500/10 text-orange-500">
                  <Wallet size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900">余额支付</span>
                  <span className="text-xs text-gray-500">余额不足 (剩余: ¥12.00)</span>
                </div>
              </div>
              <input type="radio" name="payment" className="peer sr-only" disabled />
              <div className="w-5 h-5 rounded-full border-2 border-gray-200 flex items-center justify-center bg-gray-100"></div>
            </label>
          </div>
        </section>

        <div className="flex justify-center gap-4 py-2 opacity-50">
          <div className="flex items-center gap-1">
            <ShieldCheck size={14} />
            <span className="text-xs">安全支付</span>
          </div>
          <div className="flex items-center gap-1">
            <Zap size={14} />
            <span className="text-xs">即时确认</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 z-50 w-full max-w-md mx-auto bg-white border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] px-4 py-3 pb-8">
        <div className="flex items-center justify-between gap-4 pb-1">
          <div className="flex flex-col">
            <span className="text-xs text-gray-500">实付金额</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-gray-900">¥{finalPrice}</span>
              <span className="text-xs text-gray-400 line-through">¥{originalPrice.toFixed(2)}</span>
            </div>
          </div>
          <button
            onClick={handlePay}
            disabled={loading}
            className="flex-1 bg-brand-green hover:bg-green-700 active:scale-[0.98] transition-all text-white text-base font-bold h-12 rounded-lg flex items-center justify-center shadow-lg shadow-brand-green/30 disabled:opacity-50 disabled:cursor-not-allowed gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                处理中...
              </>
            ) : '立即支付'}
          </button>
        </div>
      </div>
    </div>
  );
};