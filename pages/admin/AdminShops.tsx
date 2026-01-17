import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, MapPin, Star, MoreVertical } from 'lucide-react';
import { shopsApi, Shop } from '../../src/services/api';

export const AdminShops: React.FC = () => {
    const [shops, setShops] = useState<Shop[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchShops();
    }, []);

    const fetchShops = async () => {
        try {
            const response = await shopsApi.getShops();
            if (response.success) {
                setShops(response.shops);
            }
        } catch (error) {
            console.error('Failed to fetch shops:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredShops = shops.filter(shop =>
        shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shop.location.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">店铺管理</h1>
                    <p className="text-gray-500 mt-1">管理系统中的所有自习室店铺信息及状态。</p>
                </div>
                <button className="bg-brand-green text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 hover:bg-opacity-90 transition-all shadow-lg shadow-brand-green/20 active:scale-95">
                    <Plus size={20} />
                    新建店铺
                </button>
            </div>

            {/* Toolbar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="搜索店铺名称、地址..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-transparent focus:border-brand-green focus:bg-white focus:ring-4 focus:ring-brand-green/10 rounded-xl text-sm transition-all outline-none"
                    />
                </div>
                <div className="h-6 w-px bg-gray-200 mx-2"></div>
                <div className="text-sm text-gray-500">
                    共找到 <span className="font-bold text-gray-900">{filteredShops.length}</span> 家店铺
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wider">
                                <th className="px-6 py-4 font-semibold">店铺信息</th>
                                <th className="px-6 py-4 font-semibold">详细地址</th>
                                <th className="px-6 py-4 font-semibold">价格配置</th>
                                <th className="px-6 py-4 font-semibold">评分数据</th>
                                <th className="px-6 py-4 font-semibold text-right">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100/80">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-6 h-6 border-2 border-brand-green border-t-transparent rounded-full animate-spin"></div>
                                            加载数据中...
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredShops.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                                        暂无符合条件的店铺
                                    </td>
                                </tr>
                            ) : (
                                filteredShops.map((shop) => (
                                    <tr key={shop.id} className="hover:bg-gray-50/80 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-gray-100 shadow-sm group-hover:shadow-md transition-shadow">
                                                    <img src={shop.image} alt="" className="w-full h-full object-cover" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 text-[15px] mb-1">{shop.name}</p>
                                                    <div className="flex gap-1.5 flex-wrap">
                                                        {shop.tags.slice(0, 3).map(tag => (
                                                            <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded-md font-medium border border-gray-200">{tag}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">
                                            <div className="flex items-start gap-1.5">
                                                <MapPin size={15} className="text-gray-400 mt-0.5 shrink-0" />
                                                <span className="truncate" title={shop.location + ' ' + shop.address}>{shop.location} {shop.address}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-900">¥{shop.price}<span className="text-xs text-gray-400 font-normal">/小时</span></div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5">
                                                <Star size={16} className="text-orange-400 fill-orange-400" />
                                                <span className="font-bold text-gray-900">{shop.rating}</span>
                                                <span className="text-gray-400 text-xs">({shop.review_count}条评价)</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                                <button className="p-2 text-gray-500 hover:text-brand-green hover:bg-green-50 rounded-lg transition-colors" title="编辑">
                                                    <Edit2 size={18} />
                                                </button>
                                                <button className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="删除">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
