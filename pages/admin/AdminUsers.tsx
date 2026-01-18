import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Search, Filter, Shield, Edit2, Trash2, Plus, X, Loader2, Eye, EyeOff } from 'lucide-react';
import { getMemberLevelName, getMemberLevelColor } from '../../src/utils/memberLevel';
import { adminApi } from '../../src/services/api';

interface User {
    id: string;
    username: string;
    phone?: string;
    shop_id?: string;
    member_level: number;
    role: number;
    total_hours: number;
    consecutive_days: number;
    focus_points: number;
    balance: number;
    created_at: string;
    is_visible: number;
}

export const AdminUsers: React.FC = () => {
    const { currentShopId } = useOutletContext<{ currentShopId: string }>();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        phone: '',
        shop_id: '',
        role: 0,
        member_level: 0,
        balance: 0
    });

    useEffect(() => {
        if (currentShopId) {
            fetchUsers(currentShopId);
        }
    }, [currentShopId]);

    const fetchUsers = async (shopId: string) => {
        try {
            setLoading(true);
            // Use admin_token for admin panel authentication
            const token = localStorage.getItem('admin_token');
            const response = await fetch(`http://localhost:3001/api/users?shop_id=${shopId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (data.success) {
                setUsers(data.users);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingUser(null);
        setFormData({
            username: '',
            password: '',
            phone: '',
            shop_id: currentShopId,
            role: 0,
            member_level: 0,
            balance: 0
        });
        setIsModalOpen(true);
    };

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setFormData({
            username: user.username,
            password: '',
            phone: user.phone || '',
            shop_id: user.shop_id || currentShopId,
            role: user.role || 0,
            member_level: user.member_level,
            balance: user.balance || 0
        });
        setIsModalOpen(true);
    };

    const handleToggleVisibility = async (user: User) => {
        const newStatus = user.is_visible === 1 ? 0 : 1;
        const action = newStatus === 1 ? '恢复显示' : '隐藏';

        if (!confirm(`确定要${action}该用户吗？`)) return;

        try {
            // We reuse updateUser which now calls PUT /api/users/:id
            // The backend PUT endpoint now accepts is_visible updates
            const res = await adminApi.updateUser(user.id, { is_visible: newStatus });
            if (res.success) {
                setUsers(users.map(u => u.id === user.id ? { ...u, is_visible: newStatus } : u));
            }
        } catch (error) {
            console.error('Update visibility failed:', error);
            alert('操作失败');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingUser) {
                const res = await adminApi.updateUser(editingUser.id, formData);
                if (res.success) {
                    setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...res.user } : u));
                    setIsModalOpen(false);
                }
            } else {
                const res = await adminApi.createUser(formData);
                if (res.success) {
                    setUsers([res.user, ...users]);
                    setIsModalOpen(false);
                }
            }
        } catch (error) {
            console.error('Submit failed:', error);
            alert('保存失败');
        }
    };

    const filteredUsers = users.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.phone && user.phone.includes(searchTerm))
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">用户管理</h1>
                    <p className="text-gray-500 mt-1">管理系统内的所有注册用户。</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="bg-[#3E6950] text-white px-4 py-2 rounded-lg hover:bg-[#2c4a38] transition-colors flex items-center gap-2"
                >
                    <Plus size={20} />
                    添加用户
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="text-gray-500 text-sm mb-1">总注册用户</div>
                    <div className="text-2xl font-bold text-gray-900">{users.length}</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="text-gray-500 text-sm mb-1">管理员</div>
                    <div className="text-2xl font-bold text-[#3E6950]">{users.filter(u => u.role === 1).length}</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="text-gray-500 text-sm mb-1">VIP 用户占比</div>
                    <div className="text-2xl font-bold text-orange-500">
                        {Math.round((users.filter(u => u.member_level > 0).length / users.length) * 100) || 0}%
                    </div>
                </div>
            </div>

            {/* User Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="搜索用户名或手机号..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3E6950]/20 focus:border-[#3E6950]"
                        />
                    </div>
                    <button className="px-4 py-2 border border-gray-200 rounded-lg flex items-center gap-2 hover:bg-gray-50">
                        <Filter className="w-4 h-4 text-gray-500" />
                        <span>筛选</span>
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">用户</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">等级</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">角色</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">账户余额</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">注册时间</th>
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
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        暂无用户数据
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50 group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold">
                                                    {user.username[0].toUpperCase()}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">{user.username}</div>
                                                    <div className="text-sm text-gray-500">{user.phone || '-'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getMemberLevelColor(user.member_level)} border`}>
                                                {getMemberLevelName(user.member_level)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {user.role === 1 ? (
                                                <div className="flex items-center text-[#3E6950]">
                                                    <Shield className="w-4 h-4 mr-1" />
                                                    <span className="text-sm">管理员</span>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-gray-500">普通用户</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            ¥{(user.balance || 0).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {user.is_visible === 0 ? (
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                                    已隐藏
                                                </span>
                                            ) : (
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                    正常
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEdit(user)}
                                                    className="p-2 text-gray-500 hover:text-[#3E6950] hover:bg-green-50 rounded-lg transition-colors"
                                                    title="编辑"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleToggleVisibility(user)}
                                                    className={`p-2 rounded-lg transition-colors ${user.is_visible === 0
                                                        ? 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                                                        : 'text-gray-500 hover:text-red-600 hover:bg-red-50'
                                                        }`}
                                                    title={user.is_visible === 0 ? "显示" : "隐藏"}
                                                >
                                                    {user.is_visible === 0 ? <EyeOff size={18} /> : <Trash2 size={18} />}
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

            {/* User Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 relative">
                        <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                            <X size={20} />
                        </button>
                        <h2 className="text-xl font-bold mb-4">{editingUser ? '编辑用户' : '添加用户'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">用户名 *</label>
                                <input
                                    required
                                    className="w-full border border-gray-200 p-2 rounded-lg focus:ring-2 focus:ring-[#3E6950]/20 focus:border-[#3E6950] outline-none"
                                    value={formData.username}
                                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">手机号</label>
                                <input
                                    className="w-full border border-gray-200 p-2 rounded-lg focus:ring-2 focus:ring-[#3E6950]/20 focus:border-[#3E6950] outline-none"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    密码 {editingUser ? '(留空不修改)' : '*'}
                                </label>
                                <input
                                    type="password"
                                    required={!editingUser}
                                    className="w-full border border-gray-200 p-2 rounded-lg focus:ring-2 focus:ring-[#3E6950]/20 focus:border-[#3E6950] outline-none"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">账户余额</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="w-full border border-gray-200 p-2 rounded-lg focus:ring-2 focus:ring-[#3E6950]/20 focus:border-[#3E6950] outline-none"
                                        value={formData.balance}
                                        onChange={e => setFormData({ ...formData, balance: Number(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">会员等级</label>
                                    <select
                                        className="w-full border border-gray-200 p-2 rounded-lg focus:ring-2 focus:ring-[#3E6950]/20 focus:border-[#3E6950] outline-none"
                                        value={formData.member_level}
                                        onChange={e => setFormData({ ...formData, member_level: Number(e.target.value) })}
                                    >
                                        <option value={0}>普通会员</option>
                                        <option value={1}>白银会员</option>
                                        <option value={2}>黄金会员</option>
                                        <option value={3}>铂金会员</option>
                                        <option value={4}>钻石会员</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="isAdmin"
                                    className="mr-2 w-4 h-4 text-[#3E6950] rounded"
                                    checked={formData.role === 1}
                                    onChange={e => setFormData({ ...formData, role: e.target.checked ? 1 : 0 })}
                                />
                                <label htmlFor="isAdmin" className="text-sm font-medium text-gray-700">设为管理员</label>
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
