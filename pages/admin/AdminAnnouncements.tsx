import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Search, Plus, Trash2, Edit, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { shopsApi } from '../../src/services/api';

interface Announcement {
    id: string;
    title: string;
    content: string;
    image_url: string;
    tag: string;
    tag_color: string;
    type: string;
    active: boolean;
    shop_id: string;
}

interface Shop {
    id: string;
    name: string;
}

export const AdminAnnouncements: React.FC = () => {
    const { currentShopId } = useOutletContext<{ currentShopId: string }>();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [shops, setShops] = useState<Shop[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        shop_id: '',
        image_url: '',
        tag: '最新',
        tag_color: '#3E6950',
        active: true
    });

    useEffect(() => {
        loadData();
    }, [currentShopId]);

    useEffect(() => {
        if (currentShopId) {
            setFormData(prev => ({ ...prev, shop_id: currentShopId }));
        }
    }, [currentShopId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };

            // Fetch shops for dropdown
            const shopRes = await shopsApi.getShops();
            if (shopRes.success) {
                setShops(shopRes.shops);
                if (shopRes.shops.length > 0 && !formData.shop_id) {
                    setFormData(prev => ({ ...prev, shop_id: currentShopId || shopRes.shops[0].id }));
                }
            }

            // Fetch all announcements (admin mode)
            let url = 'http://localhost:3001/api/announcements?all=true';
            if (currentShopId) {
                url += `&shop_id=${currentShopId}`;
            }
            const res = await fetch(url, { headers });
            const data = await res.json();
            if (data.success) {
                setAnnouncements(data.announcements);
            }
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingAnnouncement(null);
        setFormData({
            title: '',
            content: '',
            shop_id: currentShopId,
            image_url: '',
            tag: '最新',
            tag_color: '#3E6950',
            active: true
        });
        setIsModalOpen(true);
    };

    const handleEdit = (announcement: Announcement) => {
        setEditingAnnouncement(announcement);
        setFormData({
            title: announcement.title,
            content: announcement.content,
            shop_id: announcement.shop_id,
            image_url: announcement.image_url || '',
            tag: announcement.tag || '最新',
            tag_color: announcement.tag_color || '#3E6950',
            active: announcement.active
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('确定要删除这条公告吗？')) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:3001/api/announcements/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setAnnouncements(prev => prev.filter(a => a.id !== id));
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('删除失败');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');

            if (editingAnnouncement) {
                // Update existing
                const res = await fetch(`http://localhost:3001/api/announcements/${editingAnnouncement.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(formData)
                });
                const data = await res.json();
                if (data.success) {
                    setAnnouncements(announcements.map(a =>
                        a.id === editingAnnouncement.id ? data.announcement : a
                    ));
                    setIsModalOpen(false);
                }
            } else {
                // Create new
                const res = await fetch('http://localhost:3001/api/announcements', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(formData)
                });
                const data = await res.json();
                if (data.success) {
                    setAnnouncements([data.announcement, ...announcements]);
                    setIsModalOpen(false);
                }
            }

            // Reset form
            setFormData({
                title: '',
                content: '',
                shop_id: currentShopId || shops[0]?.id || '',
                image_url: '',
                tag: '最新',
                tag_color: '#3E6950',
                active: true
            });
        } catch (error) {
            console.error('Submit error:', error);
            alert('保存失败');
        }
    };

    const getShopName = (shopId: string) => {
        return shops.find(s => s.id === shopId)?.name || '未知店铺';
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">公告管理</h1>
                    <p className="text-gray-500 mt-1">管理系统公告和活动通知。</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="bg-[#3E6950] text-white px-4 py-2 rounded-lg hover:bg-[#2c4a38] transition-colors flex items-center gap-2"
                >
                    <Plus size={20} />
                    新建公告
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Search */}
                <div className="p-4 border-b border-gray-100">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="搜索公告标题..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3E6950]/20 focus:border-[#3E6950]"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">标题 / 内容</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">图片</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">所属店铺</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">标签</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        <Loader2 className="w-8 h-8 text-[#3E6950] animate-spin mx-auto mb-2" />
                                        加载中...
                                    </td>
                                </tr>
                            ) : announcements.filter(a => a.title.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        暂无公告
                                    </td>
                                </tr>
                            ) : (
                                announcements.filter(a => a.title.toLowerCase().includes(searchTerm.toLowerCase())).map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50 group">
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">{item.title}</div>
                                            <div className="text-sm text-gray-500 line-clamp-1">{item.content}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {item.image_url ? (
                                                <img src={item.image_url} alt="" className="h-10 w-16 object-cover rounded" />
                                            ) : (
                                                <div className="h-10 w-16 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                                                    <ImageIcon size={16} />
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {getShopName(item.shop_id)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 text-xs rounded text-white" style={{ backgroundColor: item.tag_color || '#999' }}>
                                                {item.tag}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                {item.active ? '已发布' : '未发布'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEdit(item)}
                                                    className="p-2 text-gray-500 hover:text-[#3E6950] hover:bg-green-50 rounded-lg transition-colors"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                >
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

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 relative">
                        <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                            <X size={20} />
                        </button>
                        <h2 className="text-xl font-bold mb-4">{editingAnnouncement ? '编辑公告' : '发布新公告'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">标题 *</label>
                                <input
                                    required
                                    className="w-full border border-gray-200 p-2 rounded-lg focus:ring-2 focus:ring-[#3E6950]/20 focus:border-[#3E6950] outline-none"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">内容 *</label>
                                <textarea
                                    required
                                    className="w-full border border-gray-200 p-2 rounded-lg focus:ring-2 focus:ring-[#3E6950]/20 focus:border-[#3E6950] outline-none"
                                    rows={3}
                                    value={formData.content}
                                    onChange={e => setFormData({ ...formData, content: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">所属店铺</label>
                                <select
                                    className="w-full border border-gray-200 p-2 rounded-lg focus:ring-2 focus:ring-[#3E6950]/20 focus:border-[#3E6950] outline-none"
                                    value={formData.shop_id}
                                    onChange={e => setFormData({ ...formData, shop_id: e.target.value })}
                                >
                                    {shops.map(shop => (
                                        <option key={shop.id} value={shop.id}>{shop.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">图片 URL</label>
                                <input
                                    className="w-full border border-gray-200 p-2 rounded-lg focus:ring-2 focus:ring-[#3E6950]/20 focus:border-[#3E6950] outline-none"
                                    value={formData.image_url}
                                    onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">标签</label>
                                    <input
                                        className="w-full border border-gray-200 p-2 rounded-lg focus:ring-2 focus:ring-[#3E6950]/20 focus:border-[#3E6950] outline-none"
                                        value={formData.tag}
                                        onChange={e => setFormData({ ...formData, tag: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">标签颜色</label>
                                    <input
                                        type="color"
                                        className="h-10 w-full rounded-lg cursor-pointer"
                                        value={formData.tag_color}
                                        onChange={e => setFormData({ ...formData, tag_color: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="active"
                                    className="mr-2 w-4 h-4 text-[#3E6950] rounded"
                                    checked={formData.active}
                                    onChange={e => setFormData({ ...formData, active: e.target.checked })}
                                />
                                <label htmlFor="active" className="text-sm font-medium text-gray-700">立即发布</label>
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
                                    {editingAnnouncement ? '保存' : '发布'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
