import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Bell, Calendar, Tag } from 'lucide-react';
import { announcementsApi, Announcement } from '../src/services/api';

export const Notifications: React.FC = () => {
    const navigate = useNavigate();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnnouncements = async () => {
            try {
                const res = await announcementsApi.getActive();
                if (res.success && res.announcements) {
                    // Sort by newest first
                    const sorted = [...res.announcements].sort((a, b) =>
                        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                    );
                    setAnnouncements(sorted);
                }
            } catch (error) {
                console.error('Failed to fetch announcements', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAnnouncements();
    }, []);

    const getTagColor = (colorStr?: string) => {
        const safeColor = colorStr?.toLowerCase() || 'brand-green';
        const colorMap: Record<string, string> = {
            'brand-green': 'text-[#3E6950] bg-[#3E6950]/10',
            'green': 'text-green-600 bg-green-50',
            'red': 'text-red-600 bg-red-50',
            'orange': 'text-orange-600 bg-orange-50',
            'blue': 'text-blue-600 bg-blue-50',
        };
        return colorMap[safeColor] || 'text-[#3E6950] bg-[#3E6950]/10';
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white px-4 py-4 shadow-sm flex items-center gap-3">
                <button
                    onClick={() => navigate(-1)}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
                >
                    <ChevronLeft className="w-6 h-6 text-gray-700" />
                </button>
                <span className="text-lg font-bold text-gray-900">消息通知</span>
            </div>

            {/* Content */}
            <div className="flex-1 px-4 py-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <div className="w-8 h-8 border-2 border-[#3E6950] border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-gray-500 text-sm">加载中...</p>
                    </div>
                ) : announcements.length > 0 ? (
                    <div className="flex flex-col gap-3">
                        {announcements.map((item) => (
                            <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 animate-in slide-in-from-bottom-2 duration-500">
                                <div className="flex items-start justify-between mb-2">
                                    <div className={`px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1 ${getTagColor(item.tag_color)}`}>
                                        <Tag className="w-3 h-3" />
                                        {item.tag || '通知'}
                                    </div>
                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(item.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <h3 className="text-base font-bold text-gray-900 mb-1">{item.title}</h3>
                                <p className="text-sm text-gray-600 leading-relaxed">{item.content}</p>
                                {item.image_url && (
                                    <div className="mt-3 rounded-xl overflow-hidden aspect-video w-full">
                                        <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 opacity-60">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <Bell className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">暂无消息</h3>
                        <p className="text-sm text-gray-500">有新的通知会显示在这里</p>
                    </div>
                )}
            </div>
        </div>
    );
};
