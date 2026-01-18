import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Search, Plus, Trash2, Edit2, X, Loader2, Armchair, Check, XCircle, Eye, EyeOff } from 'lucide-react';
import { adminApi } from '../../src/services/api';

interface Seat {
    id: string;
    shop_id: string;
    zone_name: string;
    label: string;
    type: string;
    is_active: boolean;
    created_at: string;
    is_visible: number;
}

import { toast } from 'react-hot-toast';
import { confirmToast } from '../../src/utils/confirmToast';

export const AdminSeats: React.FC = () => {
    const { currentShopId } = useOutletContext<{ currentShopId: string }>();
    const [seats, setSeats] = useState<Seat[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [zoneFilter, setZoneFilter] = useState('all');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSeat, setEditingSeat] = useState<Seat | null>(null);
    const [formData, setFormData] = useState({
        shop_id: '',
        zone_name: '',
        label: '',
        type: 'standard',
        is_active: true
    });

    useEffect(() => {
        if (currentShopId) {
            fetchSeats(currentShopId);
        }
    }, [currentShopId]);

    const fetchSeats = async (shopId: string) => {
        try {
            setLoading(true);
            const res = await adminApi.getSeats(shopId);
            if (res.success) {
                setSeats(res.seats);
            } else {
                toast.error('获取座位失败');
            }
        } catch (error) {
            console.error('Error fetching seats:', error);
            toast.error('网络错误');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingSeat(null);
        setFormData({
            shop_id: currentShopId,
            zone_name: '',
            label: '',
            type: 'standard',
            is_active: true
        });
        setIsModalOpen(true);
    };

    const handleEdit = (seat: Seat) => {
        setEditingSeat(seat);
        setFormData({
            shop_id: seat.shop_id,
            zone_name: seat.zone_name,
            label: seat.label,
            type: seat.type,
            is_active: seat.is_active
        });
        setIsModalOpen(true);
    };

    const handleToggleVisibility = (seat: Seat) => {
        const newStatus = seat.is_visible === 1 ? 0 : 1;
        const action = newStatus === 1 ? '恢复显示' : '隐藏';

        confirmToast(`确定要${action}该座位吗？`, async () => {
            try {
                const res = await adminApi.updateSeat(seat.id, { is_visible: newStatus });
                if (res.success && res.seat) {
                    setSeats(prev => prev.map(s => s.id === seat.id ? res.seat : s));
                    toast.success(`座位已${action}`);
                } else {
                    toast.error(res.message || '操作失败');
                }
            } catch (error) {
                console.error('Update visibility failed:', error);
                toast.error('操作失败');
            }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingSeat) {
                const res = await adminApi.updateSeat(editingSeat.id, formData);
                if (res.success && res.seat) {
                    setSeats(seats.map(s => s.id === editingSeat.id ? res.seat : s));
                    setIsModalOpen(false);
                    toast.success('更新成功');
                } else {
                    toast.error(res.message || '更新失败');
                }
            } else {
                const res = await adminApi.createSeat(formData);
                if (res.success && res.seat) {
                    setSeats([res.seat, ...seats]);
                    setIsModalOpen(false);
                    toast.success('创建成功');
                } else {
                    toast.error(res.message || '创建失败');
                }
            }
        } catch (error) {
            console.error('Submit failed:', error);
            toast.error('保存失败');
        }
    };

    const zones = [...new Set(seats.map(s => s.zone_name))];

    const filteredSeats = seats.filter(seat =>
        (zoneFilter === 'all' || seat.zone_name === zoneFilter) &&
        (seat.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
            seat.zone_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">座位管理</h1>
                    <p className="text-gray-500 mt-1">管理店铺的座位配置和状态。</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="bg-[#3E6950] text-white px-4 py-2 rounded-lg hover:bg-[#2c4a38] transition-colors flex items-center gap-2"
                >
                    <Plus size={20} />
                    添加座位
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="text-gray-500 text-sm">总座位数</div>
                    <div className="text-2xl font-bold text-gray-900 mt-1">{seats.length}</div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="text-gray-500 text-sm">可用座位</div>
                    <div className="text-2xl font-bold text-green-600 mt-1">{seats.filter(s => s.is_active).length}</div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="text-gray-500 text-sm">已禁用</div>
                    <div className="text-2xl font-bold text-gray-400 mt-1">{seats.filter(s => !s.is_active).length}</div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="text-gray-500 text-sm">分区数</div>
                    <div className="text-2xl font-bold text-blue-600 mt-1">{zones.length}</div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center gap-4">
                <div className="relative flex-1 w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="搜索座位编号、分区..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3E6950]/20 focus:border-[#3E6950]"
                    />
                </div>
                <select
                    value={zoneFilter}
                    onChange={(e) => setZoneFilter(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3E6950]/20"
                >
                    <option value="all">全部分区</option>
                    {zones.map(zone => (
                        <option key={zone} value={zone}>{zone}</option>
                    ))}
                </select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">座位</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">分区</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">显示</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        <Loader2 className="w-8 h-8 text-[#3E6950] animate-spin mx-auto mb-2" />
                                        加载中...
                                    </td>
                                </tr>
                            ) : filteredSeats.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        暂无座位数据
                                    </td>
                                </tr>
                            ) : (
                                filteredSeats.map((seat) => (
                                    <tr key={seat.id} className="hover:bg-gray-50 group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                                                    <Armchair className="w-5 h-5 text-gray-500" />
                                                </div>
                                                <span className="font-medium text-gray-900">{seat.label}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-sm">
                                                {seat.zone_name}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {seat.type === 'standard' ? '标准座位' : seat.type === 'vip' ? 'VIP座位' : seat.type === 'window' ? '靠窗座位' : seat.type}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {seat.is_active ? (
                                                <span className="flex items-center gap-1 text-green-600 text-sm">
                                                    <Check size={14} />
                                                    可用
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-gray-400 text-sm">
                                                    <XCircle size={14} />
                                                    已禁用
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {seat.is_visible === 0 ? (
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                                    已隐藏
                                                </span>
                                            ) : (
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                    正常
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEdit(seat)}
                                                    className="p-2 text-gray-500 hover:text-[#3E6950] hover:bg-green-50 rounded-lg transition-colors"
                                                    title="编辑"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleToggleVisibility(seat)}
                                                    className={`p-2 rounded-lg transition-colors ${seat.is_visible === 0
                                                        ? 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                                                        : 'text-gray-500 hover:text-red-600 hover:bg-red-50'
                                                        }`}
                                                    title={seat.is_visible === 0 ? "显示" : "隐藏"}
                                                >
                                                    {seat.is_visible === 0 ? <EyeOff size={18} /> : <Trash2 size={18} />}
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

            {/* Seat Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative">
                        <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                            <X size={20} />
                        </button>
                        <h2 className="text-xl font-bold mb-4">{editingSeat ? '编辑座位' : '添加座位'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">座位编号 *</label>
                                <input
                                    required
                                    className="w-full border border-gray-200 p-2 rounded-lg focus:ring-2 focus:ring-[#3E6950]/20 focus:border-[#3E6950] outline-none"
                                    value={formData.label}
                                    onChange={e => setFormData({ ...formData, label: e.target.value })}
                                    placeholder="如: A01, B12"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">所属分区 *</label>
                                <input
                                    required
                                    className="w-full border border-gray-200 p-2 rounded-lg focus:ring-2 focus:ring-[#3E6950]/20 focus:border-[#3E6950] outline-none"
                                    value={formData.zone_name}
                                    onChange={e => setFormData({ ...formData, zone_name: e.target.value })}
                                    placeholder="如: 静音区, 开放区"
                                    list="zone-suggestions"
                                />
                                <datalist id="zone-suggestions">
                                    {zones.map(zone => (
                                        <option key={zone} value={zone} />
                                    ))}
                                </datalist>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">座位类型</label>
                                <select
                                    className="w-full border border-gray-200 p-2 rounded-lg focus:ring-2 focus:ring-[#3E6950]/20 focus:border-[#3E6950] outline-none"
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                                >
                                    <option value="standard">标准座位</option>
                                    <option value="vip">VIP座位</option>
                                    <option value="window">靠窗座位</option>
                                </select>
                            </div>
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    className="mr-2 w-4 h-4 text-[#3E6950] rounded"
                                    checked={formData.is_active}
                                    onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                                />
                                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">启用座位</label>
                            </div>

                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    取消
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-[#3E6950] text-white rounded-lg hover:bg-[#2c4a38] transition-colors"
                                >
                                    保存
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
