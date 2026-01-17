// =====================================================
// 共享类型定义
// =====================================================

export interface User {
    id: string;
    username: string;
    phone?: string;
    avatar: string;
    member_level: 'normal' | 'silver' | 'gold' | 'platinum';
    total_hours: number;
    consecutive_days: number;
    focus_points: number;
    balance: number;
    created_at: string;
}

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
}

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
    payment_method: 'wechat' | 'alipay' | 'balance';
    qr_code?: string;
    created_at: string;
    // Joined fields
    shop?: Shop;
    seat?: Seat;
}

export interface Schedule {
    id: string;
    seat_id: string;
    order_id?: string;
    date: string;
    start_hour: number;
    end_hour: number;
}

// API Request/Response types
export interface RegisterRequest {
    username: string;
    phone?: string;
    password: string;
}

export interface LoginRequest {
    username: string;
    password: string;
}

export interface AuthResponse {
    success: boolean;
    message: string;
    user?: Omit<User, 'password_hash'>;
    token?: string;
}

export interface CreateOrderRequest {
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

// JWT Payload
export interface JwtPayload {
    userId: string;
    username: string;
    iat?: number;
    exp?: number;
}
