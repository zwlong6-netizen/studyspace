import React, { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import { shopsApi, Shop } from '../services/api';

interface ShopSelectionModalProps {
    onSelect: (shopId: string, shopName: string) => void;
}

export const ShopSelectionModal: React.FC<ShopSelectionModalProps> = ({ onSelect }) => {
    const [shops, setShops] = useState<Shop[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchShops = async () => {
            try {
                const res = await shopsApi.getShops();
                if (res.success) {
                    setShops(res.shops);
                }
            } catch (error) {
                console.error('Failed to fetch shops', error);
            } finally {
                setLoading(false);
            }
        };
        fetchShops();
    }, []);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
                <div className="bg-[#3E6950] p-6 text-center">
                    <h2 className="text-xl font-bold text-white mb-2">欢迎来到 StudySpace</h2>
                    <p className="text-white/80 text-sm">请先选择您所在的门店</p>
                </div>

                <div className="p-4 max-h-[60vh] overflow-y-auto space-y-3">
                    {loading ? (
                        <div className="text-center py-8 text-gray-400">加载门店列表...</div>
                    ) : (
                        shops.map(shop => (
                            <button
                                key={shop.id}
                                onClick={() => onSelect(shop.id, shop.name)}
                                className="w-full text-left p-4 rounded-xl border border-gray-100 hover:border-[#3E6950] hover:bg-[#3E6950]/5 transition-all group"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0 group-hover:bg-[#3E6950] group-hover:text-white transition-colors">
                                        <MapPin size={20} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-800 group-hover:text-[#3E6950]">{shop.name}</div>
                                        <div className="text-xs text-gray-500 mt-1">{shop.address || shop.location}</div>
                                        <div className="text-xs text-gray-400 mt-1">距离 {shop.distance}</div>
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
