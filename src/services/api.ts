/// <reference types="vite/client" />
/**
 * StudySpace API 服务层
 * 封装所有后端 API 调用
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// =====================================================
// 通用请求方法
// =====================================================

interface ApiResponse<T = unknown> {
    success: boolean;
    message?: string;
    [key: string]: T | boolean | string | undefined;
}

async function request<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const token = localStorage.getItem('token');

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
        // 如果返回的不是 JSON（通常是 404 HTML 页面），说明后端可能未启动或路径错误
        throw new Error('后端服务不可用或路径错误 (Received HTML instead of JSON)');
    }

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || '请求失败');
    }

    return data;
}

// =====================================================
// 认证 API
// =====================================================

export interface User {
    id: string;
    username: string;
    phone?: string;
    avatar: string;
    member_level: string;
    total_hours: number;
    consecutive_days: number;
    focus_points: number;
    balance: number;
    created_at: string;
}

export interface AuthResponse {
    success: boolean;
    message: string;
    user?: User;
    token?: string;
}

export const authApi = {
    /**
     * 用户注册
     */
    async register(username: string, password: string, phone?: string): Promise<AuthResponse> {
        const data = await request<AuthResponse>('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, password, phone }),
        });

        if (data.token) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('isLoggedIn', 'true');
            if (data.user) {
                localStorage.setItem('user', JSON.stringify(data.user));
            }
        }

        return data;
    },

    /**
     * 用户登录
     */
    async login(username: string, password: string): Promise<AuthResponse> {
        const data = await request<AuthResponse>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        });

        if (data.token) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('isLoggedIn', 'true');
            if (data.user) {
                localStorage.setItem('user', JSON.stringify(data.user));
            }
        }

        return data;
    },

    /**
     * 获取当前用户信息
     */
    async getProfile(): Promise<{ success: boolean; user: User }> {
        return request('/auth/profile');
    },

    /**
     * 更新用户信息
     */
    async updateProfile(data: Partial<User>): Promise<{ success: boolean; user: User }> {
        return request('/auth/profile', {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    /**
     * 退出登录
     */
    logout(): void {
        localStorage.removeItem('token');
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('user');
    },

    /**
     * 检查是否已登录
     */
    isLoggedIn(): boolean {
        return localStorage.getItem('isLoggedIn') === 'true' && !!localStorage.getItem('token');
    },

    /**
     * 获取本地存储的用户信息
     */
    getLocalUser(): User | null {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                return JSON.parse(userStr);
            } catch {
                return null;
            }
        }
        return null;
    }
};

// =====================================================
// 店铺 API
// =====================================================

export interface Shop {
    id: string;
    name: string;
    location: string;
    address?: string;
    distance: string;
    rating: number;
    review_count: number;
    price: number;
    image: string;
    tags: string[];
    facilities: string[];
    description?: string;
    open_time: string;
    close_time: string;
    is_24h: boolean;
    latitude?: number;
    longitude?: number;
}

export const shopsApi = {
    /**
     * 获取店铺列表
     */
    async getShops(location?: string): Promise<{ success: boolean; shops: Shop[] }> {
        const params = location ? `?location=${encodeURIComponent(location)}` : '';
        return request(`/shops${params}`);
    },

    /**
     * 获取店铺详情
     */
    async getShopDetail(id: string): Promise<{ success: boolean; shop: Shop }> {
        return request(`/shops/${id}`);
    },

    /**
     * 获取店铺座位列表
     */
    async getShopSeats(shopId: string, zone?: string): Promise<{ success: boolean; seats: Seat[] }> {
        const params = zone ? `?zone=${encodeURIComponent(zone)}` : '';
        return request(`/shops/${shopId}/seats${params}`);
    },

    /**
     * 获取店铺房间/区域列表
     */
    async getShopZones(shopId: string): Promise<{ success: boolean; zones: Zone[] }> {
        return request(`/shops/${shopId}/zones`);
    }
};

// =====================================================
// 房间/区域 API
// =====================================================

export interface Zone {
    id: string;
    shop_id: string;
    name: string;
    description: string;
    price: number;
    image?: string;
    facilities: string[];
    created_at?: string;
    // 额外的统计字段
    availableSeats?: number;
    totalSeats?: number;
}

// =====================================================
// 座位 API
// =====================================================

export interface Seat {
    id: string;
    shop_id: string;
    label: string;
    type: 'standard' | 'window' | 'vip';
    zone_name: string;
    position_x: number;
    position_y: number;
    is_active: boolean;
}

export interface Schedule {
    start: number;
    end: number;
}

export const seatsApi = {
    /**
     * 获取座位列表
     */
    async getSeats(shopId: string, zone?: string): Promise<{ success: boolean; seats: Seat[] }> {
        const params = new URLSearchParams({ shop_id: shopId });
        if (zone) params.append('zone', zone);
        return request(`/seats?${params.toString()}`);
    },

    /**
     * 获取座位详情
     */
    async getSeatDetail(id: string): Promise<{ success: boolean; seat: Seat }> {
        return request(`/seats/${id}`);
    },

    /**
     * 获取座位预约时间表
     */
    async getSeatSchedule(
        seatId: string,
        date?: string,
        days?: number
    ): Promise<{ success: boolean; seat_id: string; schedules: Record<string, Schedule[]> }> {
        const params = new URLSearchParams();
        if (date) params.append('date', date);
        if (days) params.append('days', days.toString());
        const queryStr = params.toString() ? `?${params.toString()}` : '';
        return request(`/seats/${seatId}/schedule${queryStr}`);
    },

    /**
     * 批量获取座位时间表
     */
    async getBatchSchedules(
        seatIds: string[],
        date?: string
    ): Promise<{ success: boolean; date: string; schedules: Record<string, Schedule[]> }> {
        const params = new URLSearchParams({ seat_ids: seatIds.join(',') });
        if (date) params.append('date', date);
        return request(`/seats/schedules/batch?${params.toString()}`);
    }
};

// =====================================================
// 订单 API
// =====================================================

export interface Order {
    id: string;
    user_id: string;
    shop_id: string;
    seat_id: string;
    date: string;
    start_time: string;
    end_time: string;
    duration: number;
    original_price: number;
    discount: number;
    final_price: number;
    status: 'active' | 'completed' | 'cancelled';
    payment_method: string;
    qr_code?: string;
    created_at: string;
    shops?: Shop;
    seats?: Seat;
}

export interface CreateOrderData {
    shop_id: string;
    seat_id: string;
    date: string;
    start_time: string;
    end_time: string;
    duration: number;
    original_price: number;
    discount?: number;
    payment_method?: 'wechat' | 'alipay' | 'balance';
}

export const ordersApi = {
    /**
     * 创建订单
     */
    async createOrder(data: CreateOrderData): Promise<{ success: boolean; message: string; order: Order }> {
        return request('/orders', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    /**
     * 获取用户订单列表
     */
    async getOrders(status?: 'active' | 'completed' | 'cancelled'): Promise<{ success: boolean; orders: Order[] }> {
        const params = status ? `?status=${status}` : '';
        return request(`/orders${params}`);
    },

    /**
     * 获取订单详情
     */
    async getOrderDetail(id: string): Promise<{ success: boolean; order: Order }> {
        return request(`/orders/${id}`);
    },

    /**
     * 取消订单
     */
    async cancelOrder(id: string): Promise<{ success: boolean; message: string; order: Order }> {
        return request(`/orders/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'cancelled' }),
        });
    }
};

export interface Announcement {
    id: string;
    content: string;
    title: string;
    image_url?: string;
    tag?: string;
    tag_color?: string;
    type: 'info' | 'warning' | 'promotion';
    active: boolean;
    created_at: string;
}

export const adminApi = {
    getAllOrders: async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/orders?all=true`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                return await response.json();
            }
            return { success: false, error: 'Invalid response' };
        } catch (err) {
            return { success: false, error: err };
        }
    }
};


export const announcementsApi = {
    getActive: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/announcements`);
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                return await response.json();
            } else {
                const text = await response.text();
                console.error("Received non-JSON response from /announcements:", text);
                throw new Error("Invalid response format");
            }
        } catch (error) {
            console.error('Error fetching announcements:', error);
            return { success: false, error };
        }
    }
};

// =====================================================
// 健康检查
// =====================================================

export async function checkApiHealth(): Promise<boolean> {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        const data = await response.json();
        return data.status === 'ok';
    } catch {
        return false;
    }
}

// 默认导出所有 API
export default {
    auth: authApi,
    shops: shopsApi,
    seats: seatsApi,
    orders: ordersApi,
    announcements: announcementsApi,
    checkHealth: checkApiHealth,
};
