import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, Share2, Heart, MapPin, Navigation, Wifi, VolumeX, Zap, Droplets, ChevronDown, ChevronRight, Star, Loader2 } from 'lucide-react';
import { shopsApi, Shop, reviewsApi, Review } from '../src/services/api';

// 默认店铺数据
const defaultStore: Shop = {
  id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  name: '星光静读空间',
  rating: 4.9,
  image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCYJTWT7fFTFzi0juVmxUcNpwQG1aNtL0j4vw8WFlBe4wWzzM6f6PYb9W6JjiDI56eEAOQmnbNNRI8Y4RUb0Xu4UuaACouqxUaw0IRxrDCwKWrEc6kjFbv1toEvnPNqM-IQqOTr2MzFWZvEZm7TVBR0vvVVFXx1S0-PG5xyfMG3jeEEcN0vhtXhyTaTDTiC4cxVa6-u-AHlHBgjM6fXEmJJDw7v2SPHk82SkX-xqdI-5AQUpsFRI_7YFeagV6cRYxZCuHGOXVJb-wk',
  price: 12,
  location: '海淀区',
  distance: '0.5km',
  tags: ['静音', '新风系统'],
  review_count: 1284,
  facilities: ['高速WiFi', '静音环境', '插座充足', '免费饮水'],
  description: '星光静读空间坐落于海淀区，为您提供沉浸式的深度学习体验。每个座位均配备人体工学椅和可调节智能护眼灯。全封闭隔音设计让您专注于思考，是考研、工作、阅读的理想之所。',
  open_time: '08:00',
  close_time: '22:00',
  is_24h: false
};

export const StoreDetail: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const [isExpanded, setIsExpanded] = useState(false);
  const [store, setStore] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState<{ total: number; avgRating: number } | null>(null);

  // 获取传递的房间信息
  const selectedRoom = location.state?.selectedRoom as any;
  // 如果有 selectedRoom，优先使用其价格
  const displayPrice = selectedRoom ? selectedRoom.price : store?.price;
  // 页面标题：如果有 selectedRoom，可以显示为 "店铺名 - 房间名"，或者仅显示店铺名但在价格处区分
  const displayName = store ? (selectedRoom ? `${store.name} - ${selectedRoom.name}` : store.name) : '';

  useEffect(() => {
    const fetchStore = async () => {
      // 优先使用路由 state 传递的数据
      if (location.state?.store) {
        setStore(location.state.store as Shop);
        setLoading(false);
        return;
      }

      // 从 API 获取
      if (id) {
        try {
          const response = await shopsApi.getShopDetail(id);
          if (response.success && response.shop) {
            setStore(response.shop);
          } else {
            setStore(defaultStore);
          }
        } catch (error) {
          console.log('Using default store data:', error);
          setStore(defaultStore);
        }
      } else {
        setStore(defaultStore);
      }
      setLoading(false);
    };

    fetchStore();
  }, [id, location.state]);

  // 获取评价数据
  useEffect(() => {
    const fetchReviews = async () => {
      if (!store?.id) return;
      try {
        const [reviewsRes, statsRes] = await Promise.all([
          reviewsApi.getShopReviews(store.id, 3),
          reviewsApi.getShopReviewStats(store.id)
        ]);
        if (reviewsRes.success) setReviews(reviewsRes.reviews);
        if (statsRes.success) setReviewStats(statsRes.stats);
      } catch (e) {
        console.log('Failed to fetch reviews:', e);
      }
    };
    fetchReviews();
  }, [store?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background-light">
        <Loader2 className="w-8 h-8 text-brand-green animate-spin" />
      </div>
    );
  }

  if (!store) {
    return null;
  }

  const facilityIcons: Record<string, React.ElementType> = {
    '高速WiFi': Wifi,
    'WiFi': Wifi,
    '静音环境': VolumeX,
    '静音': VolumeX,
    '插座充足': Zap,
    '充电': Zap,
    '免费饮水': Droplets,
    '饮水': Droplets,
  };

  const displayFacilities = store.facilities?.length > 0
    ? store.facilities
    : ['高速WiFi', '静音环境', '插座充足', '免费饮水'];

  return (
    <div className="flex flex-col min-h-screen bg-background-light max-w-md mx-auto">
      {/* Hero Image */}
      <div className="relative h-72 w-full shrink-0">
        <img
          src={store.image}
          alt="Office"
          className="h-full w-full object-cover"
        />
        <div className="absolute top-0 left-0 w-full p-4 pt-4 flex justify-between items-center z-10">
          <button onClick={() => navigate('/')} className="flex items-center justify-center h-10 w-10 rounded-full bg-black/20 backdrop-blur-md text-white border border-white/10 hover:bg-black/40 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="flex gap-3">
            <button className="flex items-center justify-center h-10 w-10 rounded-full bg-black/20 backdrop-blur-md text-white border border-white/10 hover:bg-black/40 transition-colors">
              <Share2 size={20} />
            </button>
            <button className="flex items-center justify-center h-10 w-10 rounded-full bg-black/20 backdrop-blur-md text-white border border-white/10 hover:bg-black/40 transition-colors">
              <Heart size={20} />
            </button>
          </div>
        </div>
        <div className="absolute bottom-6 right-4 z-10">
          <div className="flex items-center gap-1 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-medium border border-white/10">
            <span>1/5</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative -mt-6 flex-1 w-full rounded-t-3xl bg-background-light px-5 py-6 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-32">
        <div className="mb-6">
          <h1 className="text-primary tracking-tight text-[28px] font-bold leading-tight text-left mb-2">{displayName}</h1>
          <div className="flex items-center gap-1.5 mb-3">
            <div className="flex text-primary">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} size={16} className={`fill-current ${i <= Math.round(store.rating) ? 'text-primary' : 'text-gray-300'}`} />
              ))}
            </div>
            <span className="font-bold text-primary ml-1">{store.rating}</span>
            <span className="text-gray-500 text-sm">({store.review_count?.toLocaleString() || '1,284'} 条评价)</span>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-start gap-2">
              <MapPin className="text-gray-400 mt-0.5" size={18} />
              <p className="text-gray-600 text-sm font-normal leading-relaxed flex-1">
                {store.address || store.location || '海淀区'}
              </p>
            </div>
            <div className="pl-7">
              <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-brand-green/10 text-brand-green text-xs font-medium border border-brand-green/20">
                <Navigation size={12} className="mr-1" />
                距您 {store.distance || '0.5km'}
              </span>
            </div>
          </div>
        </div>

        <div className="h-px w-full bg-gray-200 mb-6"></div>

        <div className="mb-6">
          <h2 className="text-primary text-lg font-bold mb-3">设施服务</h2>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 -mx-5 px-5">
            {displayFacilities.map((facility, idx) => {
              const IconComponent = facilityIcons[facility] || Wifi;
              return (
                <div key={idx} className="flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-xl bg-white border border-gray-100 pl-3 pr-4 shadow-sm">
                  <IconComponent size={18} className="text-primary" />
                  <p className="text-primary text-sm font-medium">{facility}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-primary text-lg font-bold mb-2">简介</h2>
          <div className="relative">
            <p className={`text-gray-600 text-sm font-normal leading-relaxed ${isExpanded ? '' : 'line-clamp-3'}`}>
              {store.description || `${store.name}坐落于${store.location || '海淀区'}，为您提供沉浸式的深度学习体验。每个座位均配备人体工学椅和可调节智能护眼灯。全封闭隔音设计让您专注于思考，是考研、工作、阅读的理想之所...`}
            </p>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-2 text-primary font-medium text-sm flex items-center hover:opacity-80 transition-opacity"
            >
              {isExpanded ? '收起' : '展开'}
              <ChevronDown size={18} className={`ml-0.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-primary text-lg font-bold">评价 {reviewStats ? `(${reviewStats.total})` : ''}</h2>
            <button
              onClick={() => navigate(`/reviews/${store.id}`, { state: { shopName: store.name } })}
              className="text-primary text-sm font-medium flex items-center"
            >
              查看全部 <ChevronRight size={16} className="ml-0.5" />
            </button>
          </div>

          {reviews.length > 0 ? (
            <div className="space-y-3">
              {reviews.map((review) => (
                <div key={review.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden">
                      {review.users?.avatar ? (
                        <img src={review.users.avatar} alt="User" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm font-bold">
                          {review.users?.username?.charAt(0) || '匿'}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-primary">{review.users?.username || '匿名用户'}</p>
                      <div className="flex items-center gap-2">
                        <div className="flex text-yellow-400">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <Star key={i} size={12} className={i <= review.rating ? 'fill-current' : 'text-gray-300'} />
                          ))}
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(review.created_at).toLocaleDateString('zh-CN')}
                        </span>
                      </div>
                    </div>
                  </div>
                  {review.content && (
                    <p className="text-gray-600 text-sm leading-relaxed">{review.content}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center text-gray-400 text-sm">
              暂无评价
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 w-full z-40 bg-white/90 backdrop-blur-lg border-t border-gray-200 px-5 pt-3 pb-8 max-w-md mx-auto">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <p className="text-xs text-gray-500 font-medium">价格</p>
            <div className="flex items-baseline gap-1">
              <span className="text-primary text-2xl font-bold">¥{displayPrice}</span>
              <span className="text-gray-600 text-sm font-normal">/小时</span>
            </div>
          </div>
          <button
            onClick={() => navigate('/select-seat', {
              state: {
                storeName: displayName, // 使用 displayName 将“店铺名-房间名”传给选座页
                storeId: store.id,
                zoneName: selectedRoom?.name,
                price: displayPrice
              }
            })}
            className="flex-1 h-12 bg-primary hover:bg-[#16cc16] active:scale-[0.98] transition-all rounded-xl shadow-lg shadow-green-900/10 flex items-center justify-center gap-2 group"
          >
            <span className="text-white text-base font-bold tracking-wide">选座预约</span>
            <ArrowLeft className="text-white rotate-180 group-hover:translate-x-0.5 transition-transform" size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};