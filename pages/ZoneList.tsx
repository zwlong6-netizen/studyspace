import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Search, MapPin } from 'lucide-react';
import { shopsApi, Zone } from '../src/services/api';

export const ZoneList: React.FC = () => {
    const navigate = useNavigate();
    const [zones, setZones] = useState<Zone[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [shopName, setShopName] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const shopId = localStorage.getItem('lastShopId');
                if (!shopId) {
                    navigate('/');
                    return;
                }

                // Get Shop Details for name
                const shopRes = await shopsApi.getShopDetail(shopId);
                if (shopRes.success) {
                    setShopName(shopRes.shop.name);
                }

                // Get Zones
                const zoneRes = await shopsApi.getShopZones(shopId);
                if (zoneRes.success) {
                    setZones(zoneRes.zones);
                }
            } catch (error) {
                console.error('Failed to fetch zones:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [navigate]);

    const filteredZones = zones.filter(zone =>
        zone.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        zone.facilities.some(f => f.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white shadow-sm">
                <div className="px-4 py-3 flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
                    >
                        <ChevronLeft className="w-6 h-6 text-gray-700" />
                    </button>
                    <span className="text-lg font-bold text-gray-900">全部区域</span>
                    <div className="w-8" /> {/* Placeholder for balance */}
                </div>

                {/* Search */}
                <div className="px-4 pb-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="搜索区域..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3E6950]/20 transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 px-4 py-4">
                {shopName && (
                    <div className="flex items-center gap-1.5 mb-4 text-gray-500 text-sm px-1">
                        <MapPin className="w-4 h-4" />
                        <span>当前门店：{shopName}</span>
                    </div>
                )}

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <div className="w-8 h-8 border-2 border-[#3E6950] border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-gray-500 text-sm">加载中...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {filteredZones.map((zone) => (
                            <div
                                key={zone.id}
                                onClick={() => navigate('/select-seat', { state: { zoneId: zone.id, zoneName: zone.name } })}
                                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 active:scale-[0.98] transition-all cursor-pointer"
                            >
                                <div className="flex h-32">
                                    <div className="w-32 h-full shrink-0">
                                        <img
                                            src={zone.image || 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=400&h=300'}
                                            alt={zone.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="flex-1 p-3 flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-start mb-1">
                                                <h3 className="text-base font-bold text-gray-900 line-clamp-1">{zone.name}</h3>
                                                <span className="text-[#3E6950] font-bold text-sm">¥{zone.price}/h</span>
                                            </div>
                                            <div className="flex flex-wrap gap-1 mb-2">
                                                {zone.facilities.slice(0, 3).map((f, idx) => (
                                                    <span key={idx} className="px-1.5 py-0.5 bg-gray-50 text-gray-500 text-xs rounded">
                                                        {f}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-gray-400">
                                            <span>{zone.description}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
