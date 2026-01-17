import React, { useState, useEffect } from 'react';
import { ChevronLeft, Search, Locate, Layers, MapPin, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { shopsApi, Shop } from '../src/services/api';

// 默认店铺数据（当 API 不可用时使用）
const defaultMapStores: Shop[] = [
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    name: '起航自习室（五角场旗舰店）',
    distance: '0.8km',
    rating: 4.9,
    price: 12,
    location: '上海市杨浦区',
    address: '杨浦区淞沪路388号创智天地5层',
    tags: ['高速Wi-Fi', '深度静音', '24h营业'],
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCYJTWT7fFTFzi0juVmxUcNpwQG1aNtL0j4vw8WFlBe4wWzzM6f6PYb9W6JjiDI56eEAOQmnbNNRI8Y4RUb0Xu4UuaACouqxUaw0IRxrDCwKWrEc6kjFbv1toEvnPNqM-IQqOTr2MzFWZvEZm7TVBR0vvVVFXx1S0-PG5xyfMG3jeEEcN0vhtXhyTaTDTiC4cxVa6-u-AHlHBgjM6fXEmJJDw7v2SPHk82SkX-xqdI-5AQUpsFRI_7YFeagV6cRYxZCuHGOXVJb-wk',
    review_count: 1284,
    facilities: ['高速WiFi', '免费饮水', '独立储物柜'],
    open_time: '00:00',
    close_time: '23:59',
    is_24h: true
  },
  {
    id: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
    name: '起航自习室（中关村店）',
    distance: '1.5km',
    rating: 4.7,
    price: 15,
    location: '北京市海淀区',
    address: '海淀区中关村创业大街1号楼',
    tags: ['独立研讨', '免费咖啡'],
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA_FZP1Jvpbtf-uCeCMh3xAj4nN2lAl2gSSUNCTlmF8Gw2S5vS40eFhrynvsBJhcwtGSXZqDa-IIxURasLNWY8jT3WnqfTj6sjCNQJ6wpo4r4P0wtkWaOVCVMqdqenS71_YqFWyqWt333Pdv-dV8VlqhwQvFfwLYq5J_HZ9Ms1_6oeBa9-CTsMLcSfEOEvafi7hOgOHspajMI5fE-NxBOab30aTAFu6RgFR2IhD83xGRcK8swIIazBwyZBu57XrC21-Cz90u_j4dy4',
    review_count: 856,
    facilities: ['高速WiFi', '会议室', '打印服务'],
    open_time: '08:00',
    close_time: '22:00',
    is_24h: false
  },
  {
    id: 'c3d4e5f6-a7b8-9012-cdef-345678901234',
    name: '起航自习室（三里屯店）',
    distance: '5.2km',
    rating: 4.8,
    price: 18,
    location: '北京市朝阳区',
    address: '朝阳区工体北路8号三里屯SOHO',
    tags: ['景观窗', '人体工学'],
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCMhp6Yu_AxrrxAsAodf6i_Ye6ZGxDoH9tIu0DU9dIXH35_NtqF7BEOVjMVw4TAHRp-L-DWcqS5thj1j2dcGFEpgwpg_Z3fa7aF004mKzsP-e-2b_VhKWhTJFQoyTgigYoiirkvpLafInNUYrw2Q6AQ26P6mYldrdy0p6npcHX4I2EOTzhNFgkLhLZUMyXreIkU6lOe3DduhPGGo084AEBj6jqOf-r0ys2NSHyi03Kde1jp5sz1LPrFPTnQfSDTVOmtsMfdqqq77fk',
    review_count: 2156,
    facilities: ['高速WiFi', '咖啡吧', '休息室'],
    open_time: '08:00',
    close_time: '22:00',
    is_24h: false
  }
];

// 为店铺定义地图位置
const getMapPosition = (index: number): { top: string; left: string } => {
  const positions = [
    { top: '28%', left: '22%' },
    { top: '42%', left: '45%' },
    { top: '55%', left: '68%' },
    { top: '35%', left: '60%' },
    { top: '48%', left: '25%' }
  ];
  return positions[index % positions.length];
};

export const MapExplore: React.FC = () => {
  const navigate = useNavigate();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShopId, setSelectedShopId] = useState<string>('');

  // 加载店铺数据
  useEffect(() => {
    const fetchShops = async () => {
      try {
        const response = await shopsApi.getShops();
        if (response.success && response.shops.length > 0) {
          setShops(response.shops);
          // 默认选中第一个
          if (response.shops.length > 0) {
            setSelectedShopId(response.shops[0].id);
          }
        } else {
          setShops(defaultMapStores);
          setSelectedShopId(defaultMapStores[0].id);
        }
      } catch (error) {
        console.log('Using default shops data:', error);
        setShops(defaultMapStores);
        setSelectedShopId(defaultMapStores[0].id);
      } finally {
        setLoading(false);
      }
    };

    fetchShops();
  }, []);

  const selectedShop = shops.find(s => s.id === selectedShopId);

  // 获取店铺简称
  const getShopBranchName = (shop: Shop): string => {
    const match = shop.name.match(/（(.+?)）/);
    return match ? match[1] : shop.name;
  };

  // 选择店铺并返回首页
  const handleSelectShop = () => {
    if (selectedShop) {
      navigate('/', { state: { shop: selectedShop } });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen max-w-md mx-auto bg-background-light">
        <Loader2 className="w-8 h-8 text-brand-green animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden max-w-md mx-auto bg-background-light">
      {/* Simulated Map Background */}
      <div className="absolute inset-0 z-0 bg-[#eef1ed] overflow-hidden" onClick={() => setSelectedShopId('')}>
        {/* Abstract Map Patterns */}
        <div className="absolute inset-0 opacity-40" style={{
          backgroundImage: `linear-gradient(90deg, transparent 48%, #ffffff 49%, #ffffff 51%, transparent 52%),
                linear-gradient(0deg, transparent 48%, #ffffff 49%, #ffffff 51%, transparent 52%)`,
          backgroundSize: '200px 200px'
        }}></div>

        {/* Simulated Buildings */}
        <div className="absolute top-[22%] left-[18%] w-24 h-16 bg-white border border-gray-200 rounded shadow-sm"></div>
        <div className="absolute top-[10%] left-[45%] w-20 h-24 bg-white border border-gray-200 rounded shadow-sm"></div>
        <div className="absolute top-[45%] left-[60%] w-20 h-20 bg-white border border-gray-200 rounded shadow-sm"></div>

        {/* District Labels */}
        <div className="absolute top-[18%] left-[10%] text-[10px] font-bold text-gray-400 uppercase tracking-widest">Yangpu District</div>
        <div className="absolute top-[55%] left-[65%] text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pudong District</div>

        {/* Markers */}
        {shops.map((shop, index) => {
          const position = getMapPosition(index);
          const isSelected = shop.id === selectedShopId;
          return (
            <div
              key={shop.id}
              className={`absolute flex flex-col items-center cursor-pointer transition-all duration-300 z-20 ${isSelected ? 'scale-110 z-30' : 'opacity-90 hover:opacity-100 hover:scale-105'}`}
              style={{ top: position.top, left: position.left }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedShopId(shop.id);
              }}
            >
              <div className={`${isSelected ? 'bg-brand-green text-white border-white/20' : 'bg-white text-gray-800 border-gray-100'} px-3 py-1 rounded-full shadow-lg text-[12px] font-bold mb-1 border whitespace-nowrap transition-colors`}>
                {getShopBranchName(shop)}
              </div>
              <MapPin className={`${isSelected ? 'text-brand-green fill-brand-green drop-shadow-md' : 'text-gray-400 fill-gray-400'} w-8 h-8 transition-colors`} />
            </div>
          );
        })}
      </div>

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-4 z-10 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-11 h-11 bg-white rounded-full shadow-xl flex items-center justify-center text-gray-800 active:scale-95 transition-transform">
          <ChevronLeft size={24} />
        </button>
        <div className="relative flex items-center flex-1">
          <Search className="absolute left-4 text-gray-400 w-5 h-5" />
          <input type="text" placeholder="搜索店铺..." className="w-full h-11 pl-11 pr-4 bg-white border-none rounded-full text-[15px] font-medium focus:ring-1 focus:ring-brand-green shadow-xl placeholder-gray-400 text-gray-800" />
        </div>
      </div>

      {/* Map Controls */}
      <div className="absolute right-4 bottom-28 flex flex-col gap-3 z-10">
        <button className="w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center text-gray-600 active:scale-95 transition-transform">
          <Locate size={24} />
        </button>
        <button className="w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center text-gray-600 active:scale-95 transition-transform">
          <Layers size={24} />
        </button>
      </div>

      {/* Bottom Store Card */}
      {selectedShop && (
        <div className="absolute bottom-4 left-4 right-4 z-10 animate-in slide-in-from-bottom-4 duration-300 fade-in">
          <div className="bg-white rounded-[24px] p-5 shadow-2xl border border-gray-100">
            <div className="flex gap-4">
              <div className="w-20 h-20 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                <img src={selectedShop.image} className="w-full h-full object-cover" alt="store" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-gray-900 text-[17px]">{selectedShop.name}</h3>
                  <span className="text-brand-green font-bold text-sm">{selectedShop.distance}</span>
                </div>
                <p className="text-[12px] text-gray-500 mt-1">{selectedShop.address || selectedShop.location}</p>
                <div className="mt-3 flex gap-2 flex-wrap">
                  {selectedShop.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="text-[10px] bg-green-50 text-brand-green px-2 py-0.5 rounded">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
            <button
              onClick={handleSelectShop}
              className="w-full mt-4 bg-brand-green text-white text-[15px] font-bold py-3.5 rounded-[12px] shadow-lg shadow-brand-green/20 active:bg-[#255a43] transition-colors"
            >
              选择此店铺
            </button>
          </div>
        </div>
      )}
    </div>
  );
};