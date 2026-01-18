import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapPin, ChevronDown, Search, BookOpen, Users, LayoutGrid, Moon, User, Loader2, Armchair, Bell, Megaphone, Info, AlertTriangle } from 'lucide-react';
import { BottomNav } from '../components/BottomNav';
import { shopsApi, authApi, announcementsApi, Shop, Zone, Announcement } from '../src/services/api';

// 房间/区域数据接口（用于前端展示）
interface Room {
  id: string;
  name: string;
  image: string;
  price: number;
  availableSeats: number;
  totalSeats: number;
  tags: string[];
  description: string;
}

// 将 Zone 转换为 Room
const zoneToRoom = (zone: Zone): Room => ({
  id: zone.id,
  name: zone.name,
  // 如果没有图片，使用占位图
  image: zone.image || 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
  price: zone.price,
  availableSeats: zone.availableSeats || 0,
  totalSeats: zone.totalSeats || 0,
  tags: zone.facilities || [],
  description: zone.description || ''
});

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { shop?: Shop } | null;
  const [showLoginModal, setShowLoginModal] = useState(false);
  // 关键修复：直接使用 state 中的 shop 初始化，避免 useEffect 竞态导致被默认列表覆盖
  const [currentShop, setCurrentShop] = useState<Shop | null>(state?.shop || null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  // Fetch announcements
  useEffect(() => {
    // Only fetch if we have a shop ID (or fetch generic if needed, but requirements say unique to shop)
    // If currentShop is null, we might want to wait or fetch nothing.
    // However, the original code fetched immediately.
    // Let's rely on currentShop being set.
    if (currentShop?.id) {
      announcementsApi.getActive(currentShop.id).then(res => {
        if (res.success && res.announcements) {
          // Sort by specific tag priority
          const priority: Record<string, number> = {
            '新店开业': 1,
            '紧急通知': 2,
            '限时活动': 3,
            '会员福利': 4
          };
          const sorted = [...res.announcements].sort((a, b) => {
            const pA = priority[a.tag || ''] || 99;
            const pB = priority[b.tag || ''] || 99;
            return pA - pB;
          });
          setAnnouncements(sorted);
        }
      });
    } else {
      // Option: clear announcements or fetch default?
      // Let's wait for shop to be loaded.
      setAnnouncements([]);
    }
  }, [currentShop?.id]);

  // 当从 state 传入店铺时更新 currentShop (处理组件复用而非重新挂载的情况)
  useEffect(() => {
    if (state?.shop) {
      setCurrentShop(state.shop);
      // 清除 state 避免刷新时重复使用
      window.history.replaceState({}, document.title);
    }
  }, [state?.shop]);

  // 加载店铺和房间数据
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 如果没有当前店铺，则获取第一个店铺
        let shop = currentShop;
        if (!shop) {
          const shopsResponse = await shopsApi.getShops();
          if (shopsResponse.success && shopsResponse.shops.length > 0) {
            // 尝试恢复上次选择的店铺
            const lastShopId = localStorage.getItem('lastShopId');
            const lastShop = lastShopId ? shopsResponse.shops.find(s => s.id === lastShopId) : null;

            shop = lastShop || shopsResponse.shops[0];
            setCurrentShop(shop);
          } else {
            setCurrentShop(null);
          }
        }

        // 获取该店铺的房间数据
        if (shop) {
          try {
            const zonesResponse = await shopsApi.getShopZones(shop.id);
            if (zonesResponse.success && zonesResponse.zones.length > 0) {
              const roomsFromZones = zonesResponse.zones.map((zone) => zoneToRoom(zone));
              setRooms(roomsFromZones);
            } else {
              setRooms([]);
            }
          } catch {
            console.log('Failed to fetch zones');
            setRooms([]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentShop]);

  // 检查登录状态
  useEffect(() => {
    const isLoggedIn = authApi.isLoggedIn();
    if (!isLoggedIn) {
      const timer = setTimeout(() => {
        setShowLoginModal(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  // 记住最后选择的店铺
  useEffect(() => {
    if (currentShop?.id) {
      localStorage.setItem('lastShopId', currentShop.id);
    }
  }, [currentShop?.id]);

  // 过滤房间
  const filteredRooms = rooms.filter(room =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // 获取显示的店铺名称
  const displayShopName = currentShop?.name || '加载中...';

  return (
    <div className="flex flex-col min-h-screen pb-24 max-w-md mx-auto bg-background-light">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background-light pt-6 px-4 pb-2">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => navigate('/map')}>
            <MapPin className="text-primary w-5 h-5" />
            <span className="font-medium text-lg text-text-primary">{displayShopName}</span>
            <ChevronDown className="text-text-secondary w-4 h-4" />
          </div>

        </div>

        {/* Search Bar */}
        <div className="relative mb-2">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary w-5 h-5" />
          <input
            type="text"
            placeholder="搜索房间或设施..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-3 border-none rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-green/20 shadow-sm"
          />
        </div>
      </div>

      {/* Banners */}
      <div className="px-4 mt-2">
        <div className="flex overflow-x-auto gap-4 no-scrollbar snap-x snap-mandatory pb-4">
          {announcements.length > 0 ? (
            announcements.map((a) => (
              <div key={a.id} className="snap-center shrink-0 w-[85%] aspect-[2/1] rounded-2xl overflow-hidden relative shadow-lg group cursor-pointer">
                {a.image_url && (
                  <img
                    src={a.image_url}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    alt={a.title}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-5 flex flex-col justify-end">
                  {a.tag && (() => {
                    // Helper to resolve color and contrast
                    const getColorStyles = (colorStr?: string) => {
                      const safeColor = colorStr?.toLowerCase() || '#3E6950';

                      // Map legacy class names/names to hex
                      const colorMap: Record<string, string> = {
                        'brand-green': '#3E6950',
                        'green': '#3E6950',
                        'white': '#ffffff',
                        'red': '#ef4444',
                        'orange': '#f97316',
                        'blue': '#3b82f6',
                        'info': '#ffffff',
                      };

                      const bgColor = colorMap[safeColor] || safeColor;

                      // Simple contrast check
                      const isLight = bgColor === '#ffffff' || bgColor === '#fff' || bgColor === 'white' || bgColor === '#f0f0f0';

                      return {
                        backgroundColor: bgColor,
                        color: isLight ? '#2e2e2e' : '#ffffff'
                      };
                    };

                    const styles = getColorStyles(a.tag_color);

                    return (
                      <span
                        className="inline-flex items-center justify-center px-2 h-6 text-xs font-bold rounded mb-2 w-fit"
                        style={styles}
                      >
                        {a.tag}
                      </span>
                    );
                  })()}
                  <h3 className="text-white text-xl font-bold">{a.title}</h3>
                  <p className="text-white/90 text-sm">{a.content}</p>
                </div>
              </div>
            ))
          ) : (
            // Fallback content if no announcements
            <>
              <div className="snap-center shrink-0 w-[85%] aspect-[2/1] rounded-2xl overflow-hidden relative shadow-lg group cursor-pointer">
                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuBSQh8P7sZQKwx9ai8eqY6Z9H1RTskQfW9-_25S1UMJJ3sluFys_YqEYrQ98pbEmRjXnb16YS9qPcXiPmUA7qTHMtTlYyqqiZ2IaDoSti1xxKsIjGd5vr9vBCjMf_G701whOGQt24NjCmrk8_XgBj_XsW6JrwYEEvm_jHe3tR4TRH8nA4sijBguNFBnaldSi1C-KMoinQlRrmWVZ13dRApx8JEptXJ936KtNaLh_wFEle8nlrHYsp_gjUHdVxTY3q0sdmU40HydeHU" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt="Banner 1" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-5 flex flex-col justify-end">
                  <span className="inline-flex items-center justify-center px-2 h-6 bg-brand-green text-white text-xs font-bold rounded mb-2 w-fit">加载中...</span>
                  <h3 className="text-white text-xl font-bold">加载中...</h3>
                  <p className="text-white/90 text-sm">加载中...</p>
                </div>
              </div>
              <div className="snap-center shrink-0 w-[85%] aspect-[2/1] rounded-2xl overflow-hidden relative shadow-lg group cursor-pointer">
                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCcm3_lhKE0Ga-0vZjOh0ygddxMnAhoFOhCdBKB5U0VfiTTYkcZN_35LZnoBpp2T8UhonqUkiAvat1CwS62_c_DJ2dGQTEGTKFOytoRvPbwIZ59TQYsVjOa4lWFgFWbMB5pPKV8XGH8Sck4-4bG1q_sWz19ycGn9U1d4m25ueiZdOh1yTrLBYmC_-O2HzbHQ7sEGWZyAYJ9vvqAkqvNYzEYp3M9UK-hn22519WOG6u58pFL3f7dVEZF1r08M8LYzJ7_nVtH8O5NS7U" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt="Banner 2" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-5 flex flex-col justify-end">
                  <span className="inline-flex items-center justify-center px-2 h-6 bg-white text-primary text-xs font-bold rounded mb-2 w-fit">加载中...</span>
                  <h3 className="text-white text-xl font-bold">加载中...</h3>
                  <p className="text-white/90 text-sm">加载中...</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Categories */}
      <div className="px-4 mt-2">
        <div className="grid grid-cols-4 gap-3">
          {[
            { icon: BookOpen, label: '沉浸\n单人间' },
            { icon: Users, label: '讨论\n研讨室' },
            { icon: LayoutGrid, label: '景观\n靠窗位' },
            { icon: Moon, label: '24H\n不打烊' },
          ].map((item, idx) => (
            <div key={idx} className="flex flex-col items-center gap-2 cursor-pointer group">
              <div className="w-14 h-14 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-primary group-hover:border-brand-green/50 group-hover:shadow-md transition-all">
                <item.icon className="w-6 h-6 text-brand-green" />
              </div>
              <span className="text-xs font-medium text-primary text-center whitespace-pre-line">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Room Recommendations */}
      <div className="px-4 mt-8 flex-1">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-primary">可选房间</h2>
          <button className="text-sm text-gray-500 flex items-center hover:text-brand-green">
            全部
            <ChevronDown className="w-4 h-4 -rotate-90" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-brand-green animate-spin" />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredRooms.map((room) => (
              <div key={room.id} className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex gap-3 cursor-pointer" onClick={() => navigate(`/store/${currentShop?.id}`, { state: { store: currentShop, selectedRoom: room } })}>
                <div className="w-24 h-24 rounded-xl bg-gray-200 shrink-0 overflow-hidden">
                  <img src={room.image} alt={room.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col flex-1 justify-between py-0.5">
                  <div>
                    <h3 className="text-base font-bold text-primary leading-tight">{room.name}</h3>
                    <div className="flex items-center gap-1 mt-1">
                      <Armchair className="w-3.5 h-3.5 text-brand-green" />
                      <span className="text-xs font-bold text-brand-green">{room.availableSeats}</span>
                      <span className="text-xs text-gray-500">/{room.totalSeats} 可用</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">{room.description}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {room.tags.map(tag => (
                        <span key={tag} className="px-1.5 py-0.5 rounded-md bg-gray-100 text-[10px] text-gray-600">{tag}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-end justify-between mt-2">
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-bold text-brand-green">¥{room.price}</span>
                      <span className="text-xs text-gray-400">/小时</span>
                    </div>
                    <button className="bg-brand-green hover:bg-black text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">
                      立即预约
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <BottomNav />

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setShowLoginModal(false)}></div>
          <div className="relative bg-white rounded-[32px] p-6 w-full max-w-[320px] shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-brand-green/10 rounded-full flex items-center justify-center mb-4 text-brand-green">
              <User size={32} />
            </div>
            <h3 className="text-xl font-bold text-primary mb-2">欢迎来到 StudySpace</h3>
            <p className="text-sm text-gray-500 mb-8 leading-relaxed px-2">
              登录账号，即可享受预约选座、<br />积分累计等会员专属权益。
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-brand-green text-white font-bold h-12 rounded-xl shadow-lg shadow-brand-green/20 active:scale-95 transition-all mb-3"
            >
              立即登录 / 注册
            </button>
            <button
              onClick={() => setShowLoginModal(false)}
              className="text-gray-400 text-xs font-medium py-2 px-4 hover:text-gray-600"
            >
              先逛一逛
            </button>
          </div>
        </div>
      )}
    </div>
  );
};