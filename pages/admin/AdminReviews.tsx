import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Search, Star, Trash2, Loader2, User, MessageSquare, Store, Eye, EyeOff } from 'lucide-react';
import { reviewsApi, Review, shopsApi, Shop } from '../../src/services/api';

import { toast } from 'react-hot-toast';
import { confirmToast } from '../../src/utils/confirmToast';

const RatingStars: React.FC<{ rating: number }> = ({ rating }) => (
    <div className="flex text-yellow-400">
        {[1, 2, 3, 4, 5].map((i) => (
            <Star key={i} size={14} className={i <= rating ? 'fill-current' : 'text-gray-300'} />
        ))}
    </div>
);

export const AdminReviews: React.FC = () => {
    const { activeShop } = useOutletContext<{ activeShop: Shop | null }>();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRating, setFilterRating] = useState<number | null>(null);
    const [stats, setStats] = useState<{ total: number; avgRating: number } | null>(null);

    useEffect(() => {
        const fetchReviews = async () => {
            if (!activeShop?.id) {
                setLoading(false);
                return;
            }

            try {
                const [reviewsRes, statsRes] = await Promise.all([
                    // @ts-ignore - will update api signature
                    reviewsApi.getShopReviews(activeShop.id, 100, 0, true),
                    reviewsApi.getShopReviewStats(activeShop.id)
                ]);

                if (reviewsRes.success) setReviews(reviewsRes.reviews);
                if (statsRes.success) setStats(statsRes.stats);
            } catch (e) {
                console.log('Failed to fetch reviews:', e);
                toast.error('加载评价失败');
            } finally {
                setLoading(false);
            }
        };

        fetchReviews();
    }, [activeShop?.id]);

    const filteredReviews = reviews.filter(review => {
        const matchesSearch = !searchTerm ||
            review.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            review.users?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            review.zone_name?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesRating = !filterRating || review.rating === filterRating;

        return matchesSearch && matchesRating;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-brand-green animate-spin" />
            </div>
        );
    }

    if (!activeShop) {
        return (
            <div className="text-center py-12">
                <Store size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">请先选择门店</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">评价管理</h1>
                    <p className="text-gray-500 text-sm mt-1">{activeShop.name}</p>
                </div>
                {stats && (
                    <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-lg border border-gray-100">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-primary">{stats.avgRating}</p>
                            <RatingStars rating={Math.round(stats.avgRating)} />
                        </div>
                        <div className="h-8 w-px bg-gray-200"></div>
                        <div className="text-sm text-gray-500">
                            共 <span className="font-bold text-primary">{stats.total}</span> 条评价
                        </div>
                    </div>
                )}
            </div>

            {/* Filters */}
            <div className="flex gap-4 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="搜索评价内容、用户名..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green"
                    />
                </div>
                <select
                    value={filterRating || ''}
                    onChange={(e) => setFilterRating(e.target.value ? Number(e.target.value) : null)}
                    className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green"
                >
                    <option value="">全部评分</option>
                    <option value="5">5星</option>
                    <option value="4">4星</option>
                    <option value="3">3星</option>
                    <option value="2">2星</option>
                    <option value="1">1星</option>
                </select>
            </div>

            {/* Reviews Table */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">用户</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">评分</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">房间</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">评价内容</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">时间</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">状态</th>
                            <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredReviews.length > 0 ? (
                            filteredReviews.map((review) => (
                                <tr key={review.id} className="hover:bg-gray-50/50">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs font-bold overflow-hidden">
                                                {review.users?.avatar ? (
                                                    <img src={review.users.avatar} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    review.users?.username?.charAt(0) || '匿'
                                                )}
                                            </div>
                                            <span className="text-sm font-medium text-gray-900">
                                                {review.is_anonymous ? '匿名用户' : (review.users?.username || '未知')}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <RatingStars rating={review.rating} />
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-500">
                                        {review.zone_name || '-'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <p className="text-sm text-gray-600 max-w-xs truncate">
                                            {review.content || <span className="text-gray-400 italic">无评论内容</span>}
                                        </p>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-500">
                                        {new Date(review.created_at).toLocaleDateString('zh-CN')}
                                    </td>
                                    <td className="px-4 py-3">
                                        {review.is_visible === 0 ? (
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                                已隐藏
                                            </span>
                                        ) : (
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                正常
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            onClick={() => {
                                                const newStatus = review.is_visible === 0 ? 1 : 0;
                                                const action = newStatus === 1 ? '恢复显示' : '隐藏';
                                                const extraMsg = newStatus === 0 ? '隐藏后评价将不在前台显示。' : '';

                                                confirmToast(`确定要${action}该评价吗？${extraMsg}`, async () => {
                                                    try {
                                                        const res = await reviewsApi.updateReview(review.id, { is_visible: newStatus });
                                                        if (res.success) {
                                                            setReviews(prev => prev.map(r => r.id === review.id ? { ...r, is_visible: newStatus } : r));
                                                            toast.success(`评价已${action}`);
                                                        } else {
                                                            toast.error((res as any).message || '操作失败');
                                                        }
                                                    } catch (e) {
                                                        console.error('Update review visibility failed:', e);
                                                        toast.error('操作失败');
                                                    }
                                                });
                                            }}
                                            className={`p-2 rounded-lg transition-colors ${review.is_visible === 0
                                                ? 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                                                : 'text-gray-500 hover:text-red-600 hover:bg-red-50'
                                                }`}
                                            title={review.is_visible === 0 ? "显示" : "隐藏"}
                                        >
                                            {review.is_visible === 0 ? <EyeOff size={16} /> : <Trash2 size={16} />}
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                                    <MessageSquare size={32} className="mx-auto mb-2 opacity-50" />
                                    <p>暂无评价</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

        </div>
    );
};
