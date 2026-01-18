import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, Star, Loader2 } from 'lucide-react';
import { reviewsApi, Review } from '../src/services/api';

export const ReviewList: React.FC = () => {
    const navigate = useNavigate();
    const { shopId } = useParams<{ shopId: string }>();
    const location = useLocation();
    const shopName = location.state?.shopName || '门店';

    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<{ total: number; avgRating: number } | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!shopId) return;

            try {
                const [reviewsRes, statsRes] = await Promise.all([
                    reviewsApi.getShopReviews(shopId, 50), // 获取更多评价
                    reviewsApi.getShopReviewStats(shopId)
                ]);

                if (reviewsRes.success) setReviews(reviewsRes.reviews);
                if (statsRes.success) setStats(statsRes.stats);
            } catch (e) {
                console.log('Failed to fetch reviews:', e);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [shopId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background-light">
                <Loader2 className="w-8 h-8 text-brand-green animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-background-light max-w-md mx-auto">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 py-3">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center justify-center h-10 w-10 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <ArrowLeft size={20} className="text-primary" />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-lg font-bold text-primary">全部评价</h1>
                        <p className="text-xs text-gray-500">{shopName}</p>
                    </div>
                </div>
            </div>

            {/* Stats */}
            {stats && (
                <div className="bg-white px-4 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="text-center">
                            <p className="text-3xl font-bold text-primary">{stats.avgRating}</p>
                            <div className="flex justify-center text-yellow-400 mt-1">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <Star key={i} size={14} className={i <= Math.round(stats.avgRating) ? 'fill-current' : 'text-gray-300'} />
                                ))}
                            </div>
                        </div>
                        <div className="h-12 w-px bg-gray-200"></div>
                        <div>
                            <p className="text-gray-500 text-sm">共 <span className="font-bold text-primary">{stats.total}</span> 条评价</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Review List */}
            <div className="flex-1 px-4 py-4 space-y-3">
                {reviews.length > 0 ? (
                    reviews.map((review) => (
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
                            {review.zone_name && (
                                <p className="text-xs text-gray-400 mb-2">房间: {review.zone_name}</p>
                            )}
                            {review.content && (
                                <p className="text-gray-600 text-sm leading-relaxed">{review.content}</p>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                        <Star size={48} className="mb-4 opacity-50" />
                        <p className="text-sm">暂无评价</p>
                    </div>
                )}
            </div>
        </div>
    );
};
