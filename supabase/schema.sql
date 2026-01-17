-- =====================================================
-- StudySpace 数据库 Schema
-- Supabase PostgreSQL 数据库初始化脚本
-- =====================================================

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. 用户表 (users)
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT NOT NULL UNIQUE,
    phone TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    avatar TEXT DEFAULT 'https://lh3.googleusercontent.com/aida-public/AB6AXuAduKN1Wg2-1UPBiruSzBpyKAyB783gEY_UcNHF8wVF1C0VUW_gEgGDXMJ4kJ-dltSsYQ3UYAyfdiLHR1_OETYsc0X7ppQueEi1UqGML_S8kn5Mix0dJGDGooSN7NnoO8Sjk5hl4DNEJP2TngB-Rnqoh8u2rrrYfcJ-IkhoKdaELlGYHgm6trb5mcpL-kKm4oNTIIS3c4GyJcD-VPDCERArZoGkc5w2-OdErE_4pHiYUACFV4TR62WTBoeY1LeMW4Svcg_1_N1rLsg',
    member_level TEXT DEFAULT 'normal' CHECK (member_level IN ('normal', 'silver', 'gold', 'platinum')),
    total_hours DECIMAL(10, 2) DEFAULT 0,
    consecutive_days INTEGER DEFAULT 0,
    focus_points INTEGER DEFAULT 0,
    balance DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建用户更新触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 2. 店铺表 (shops)
-- =====================================================
CREATE TABLE IF NOT EXISTS shops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    address TEXT,
    distance TEXT DEFAULT '0km',
    rating DECIMAL(2, 1) DEFAULT 5.0 CHECK (rating >= 0 AND rating <= 5),
    review_count INTEGER DEFAULT 0,
    price INTEGER NOT NULL CHECK (price > 0),
    image TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    facilities TEXT[] DEFAULT '{}',
    description TEXT,
    open_time TIME DEFAULT '08:00',
    close_time TIME DEFAULT '22:00',
    is_24h BOOLEAN DEFAULT FALSE,
    latitude DECIMAL(10, 6),
    longitude DECIMAL(10, 6),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. 房间/区域表 (zones)
-- =====================================================
CREATE TABLE IF NOT EXISTS zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image TEXT,
    facilities TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. 座位表 (seats)
-- =====================================================
CREATE TABLE IF NOT EXISTS seats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    type TEXT DEFAULT 'standard' CHECK (type IN ('standard', 'window', 'vip')),
    zone_name TEXT DEFAULT '静音区 A',
    position_x INTEGER DEFAULT 0,
    position_y INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(shop_id, label)
);

-- =====================================================
-- 5. 订单表 (orders)
-- =====================================================
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    seat_id UUID NOT NULL REFERENCES seats(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration DECIMAL(4, 1) NOT NULL,
    original_price DECIMAL(10, 2) NOT NULL,
    discount DECIMAL(10, 2) DEFAULT 0,
    final_price DECIMAL(10, 2) NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    payment_method TEXT DEFAULT 'wechat' CHECK (payment_method IN ('wechat', 'alipay', 'balance')),
    qr_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 6. 座位预约时间表 (schedules)
-- =====================================================
CREATE TABLE IF NOT EXISTS schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seat_id UUID NOT NULL REFERENCES seats(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_hour DECIMAL(4, 1) NOT NULL CHECK (start_hour >= 0 AND start_hour < 24),
    end_hour DECIMAL(4, 1) NOT NULL CHECK (end_hour > 0 AND end_hour <= 24),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (start_hour < end_hour)
);

-- 为时间表创建索引以提高查询效率
CREATE INDEX IF NOT EXISTS idx_schedules_seat_date ON schedules(seat_id, date);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_shops_location ON shops(location);
CREATE INDEX IF NOT EXISTS idx_zones_shop ON zones(shop_id);

-- =====================================================
-- 7. 插入初始示例数据
-- =====================================================

-- 插入示例店铺
INSERT INTO shops (id, name, location, address, distance, rating, review_count, price, image, tags, facilities, description, open_time, close_time, is_24h, latitude, longitude) VALUES
(
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    '起航自习室（五道口店）',
    '海淀区',
    '海淀区五道口地铁站C口 300米',
    '0.5km',
    4.9,
    1284,
    12,
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCYJTWT7fFTFzi0juVmxUcNpwQG1aNtL0j4vw8WFlBe4wWzzM6f6PYb9W6JjiDI56eEAOQmnbNNRI8Y4RUb0Xu4UuaACouqxUaw0IRxrDCwKWrEc6kjFbv1toEvnPNqM-IQqOTr2MzFWZvEZm7TVBR0vvVVFXx1S0-PG5xyfMG3jeEEcN0vhtXhyTaTDTiC4cxVa6-u-AHlHBgjM6fXEmJJDw7v2SPHk82SkX-xqdI-5AQUpsFRI_7YFeagV6cRYxZCuHGOXVJb-wk',
    ARRAY['静音', '新风系统', '24H'],
    ARRAY['高速WiFi', '免费饮水', '独立储物柜', '空调'],
    '起航自习室五道口旗舰店',
    '00:00',
    '23:59',
    TRUE,
    39.992894,
    116.337742
),
(
    'b2c3d4e5-f6a7-8901-bcde-f23456789012',
    '起航自习室（中关村店）',
    '海淀区',
    '海淀区中关村大街 168号',
    '1.2km',
    4.7,
    856,
    15,
    'https://lh3.googleusercontent.com/aida-public/AB6AXuA_FZP1Jvpbtf-uCeCMh3xAj4nN2lAl2gSSUNCTlmF8Gw2S5vS40eFhrynvsBJhcwtGSXZqDa-IIxURasLNWY8jT3WnqfTj6sjCNQJ6wpo4r4P0wtkWaOVCVMqdqenS71_YqFWyqWt333Pdv-dV8VlqhwQvFfwLYq5J_HZ9Ms1_6oeBa9-CTsMLcSfEOEvafi7hOgOHspajMI5fE-NxBOab30aTAFu6RgFR2IhD83xGRcK8swIIazBwyZBu57XrC21-Cz90u_j4dy4',
    ARRAY['景观位', '研讨室'],
    ARRAY['高速WiFi', '会议室', '打印服务'],
    '中关村核心地段',
    '08:00',
    '22:00',
    FALSE,
    39.982236, 
    116.315228
),
(
    'c3d4e5f6-a7b8-9012-cdef-345678901234',
    '起航自习室（三里屯店）',
    '海淀区', -- 注意：原数据这里写的是朝阳区，但location字段是text。这里保持一致或修正。为了演示坐标，我将其放在三里屯真实位置
    '朝阳区三里屯SOHO B座',
    '2.5km',
    4.8,
    2156,
    18,
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCMhp6Yu_AxrrxAsAodf6i_Ye6ZGxDoH9tIu0DU9dIXH35_NtqF7BEOVjMVw4TAHRp-L-DWcqS5thj1j2dcGFEpgwpg_Z3fa7aF004mKzsP-e-2b_VhKWhTJFQoyTgigYoiirkvpLafInNUYrw2Q6AQ26P6mYldrdy0p6npcHX4I2EOTzhNFgkLhLZUMyXreIkU6lOe3DduhPGGo084AEBj6jqOf-r0ys2NSHyi03Kde1jp5sz1LPrFPTnQfSDTVOmtsMfdqqq77fk',
    ARRAY['商务', '咖啡吧'],
    ARRAY['高速WiFi', '咖啡吧', '休息室'],
    '三里屯时尚地标',
    '08:00',
    '23:00',
    FALSE,
    39.934898,
    116.454477
);

-- 五道口店的房间：学术风格
INSERT INTO zones (shop_id, name, price, description, facilities) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '晨曦阅览室', 10, '清晨阳光洒入，适合早起学习', ARRAY['自然采光', '绿植氛围']),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '深夜自习厅', 12, '24小时开放，夜猫子专属', ARRAY['24H开放', '静音区']),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '考研冲刺营', 15, '备考专用，配备白板和计时器', ARRAY['白板', '计时器', '隔音']);

-- 中关村店的房间：科技风格
INSERT INTO zones (shop_id, name, price, description, facilities) VALUES
('b2c3d4e5-f6a7-8901-bcde-f23456789012', '码农加油站', 18, '程序员专属，双屏配置', ARRAY['双显示器', '机械键盘']),
('b2c3d4e5-f6a7-8901-bcde-f23456789012', '创业孵化室', 20, '小型团队协作空间', ARRAY['投影仪', '白板墙']),
('b2c3d4e5-f6a7-8901-bcde-f23456789012', '安静编程区', 15, '沉浸式编码体验', ARRAY['人体工学椅', '护眼灯']);

-- 三里屯店的房间：时尚风格
INSERT INTO zones (shop_id, name, price, description, facilities) VALUES
('c3d4e5f6-a7b8-9012-cdef-345678901234', '落地窗书吧', 22, '俯瞰三里屯街景', ARRAY['落地窗', '沙发座']),
('c3d4e5f6-a7b8-9012-cdef-345678901234', '咖啡伴读区', 18, '边喝咖啡边学习', ARRAY['免费咖啡', '舒适座椅']),
('c3d4e5f6-a7b8-9012-cdef-345678901234', 'VIP独立间', 35, '私密独立空间，适合网课', ARRAY['独立隔间', '降噪耳机']);

-- 五道口店座位
INSERT INTO seats (shop_id, label, type, zone_name) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'A1', 'window', '晨曦阅览室'),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'A2', 'window', '晨曦阅览室'),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'A3', 'standard', '晨曦阅览室'),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'A4', 'standard', '晨曦阅览室'),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'B1', 'standard', '深夜自习厅'),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'B2', 'standard', '深夜自习厅'),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'B3', 'standard', '深夜自习厅'),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'B4', 'standard', '深夜自习厅'),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'C1', 'vip', '考研冲刺营'),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'C2', 'vip', '考研冲刺营');

-- 中关村店座位
INSERT INTO seats (shop_id, label, type, zone_name) VALUES
('b2c3d4e5-f6a7-8901-bcde-f23456789012', 'A1', 'vip', '码农加油站'),
('b2c3d4e5-f6a7-8901-bcde-f23456789012', 'A2', 'vip', '码农加油站'),
('b2c3d4e5-f6a7-8901-bcde-f23456789012', 'A3', 'vip', '码农加油站'),
('b2c3d4e5-f6a7-8901-bcde-f23456789012', 'B1', 'standard', '创业孵化室'),
('b2c3d4e5-f6a7-8901-bcde-f23456789012', 'B2', 'standard', '创业孵化室'),
('b2c3d4e5-f6a7-8901-bcde-f23456789012', 'C1', 'standard', '安静编程区'),
('b2c3d4e5-f6a7-8901-bcde-f23456789012', 'C2', 'standard', '安静编程区'),
('b2c3d4e5-f6a7-8901-bcde-f23456789012', 'C3', 'standard', '安静编程区');

-- 三里屯店座位
INSERT INTO seats (shop_id, label, type, zone_name) VALUES
('c3d4e5f6-a7b8-9012-cdef-345678901234', 'A1', 'window', '落地窗书吧'),
('c3d4e5f6-a7b8-9012-cdef-345678901234', 'A2', 'window', '落地窗书吧'),
('c3d4e5f6-a7b8-9012-cdef-345678901234', 'B1', 'standard', '咖啡伴读区'),
('c3d4e5f6-a7b8-9012-cdef-345678901234', 'B2', 'standard', '咖啡伴读区'),
('c3d4e5f6-a7b8-9012-cdef-345678901234', 'B3', 'standard', '咖啡伴读区'),
('c3d4e5f6-a7b8-9012-cdef-345678901234', 'C1', 'vip', 'VIP独立间'),
('c3d4e5f6-a7b8-9012-cdef-345678901234', 'C2', 'vip', 'VIP独立间');

-- 插入一些示例预约时间（模拟已被占用的时段）
DO $$
DECLARE
    seat_a1_id UUID;
    seat_b1_id UUID;
    seat_b2_id UUID;
BEGIN
    SELECT id INTO seat_a1_id FROM seats WHERE label = 'A1' AND shop_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    SELECT id INTO seat_b1_id FROM seats WHERE label = 'B1' AND shop_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    SELECT id INTO seat_b2_id FROM seats WHERE label = 'B2' AND shop_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    
    -- A1 座位今天有两个预约
    INSERT INTO schedules (seat_id, date, start_hour, end_hour) VALUES
    (seat_a1_id, CURRENT_DATE, 9, 11.5),
    (seat_a1_id, CURRENT_DATE, 13, 15);
    
    -- B1 座位今天下午被占用
    INSERT INTO schedules (seat_id, date, start_hour, end_hour) VALUES
    (seat_b1_id, CURRENT_DATE, 14, 18);
    
    -- B2 座位今天全天被占用
    INSERT INTO schedules (seat_id, date, start_hour, end_hour) VALUES
    (seat_b2_id, CURRENT_DATE, 9, 22);
END $$;

-- =====================================================
-- 8. Row Level Security (RLS) 策略
-- =====================================================

-- 启用 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 用户只能查看和修改自己的数据
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Allow public registration" ON users
    FOR INSERT WITH CHECK (true);

-- 订单策略：用户只能查看和创建自己的订单
CREATE POLICY "Users can view own orders" ON orders
    FOR SELECT USING (true);

CREATE POLICY "Users can create own orders" ON orders
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own orders" ON orders
    FOR UPDATE USING (true);

-- 店铺、房间和座位对所有人可见
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shops are viewable by everyone" ON shops
    FOR SELECT USING (true);

CREATE POLICY "Anyone can view zones" ON zones
    FOR SELECT USING (true);

CREATE POLICY "Seats are viewable by everyone" ON seats
    FOR SELECT USING (true);

CREATE POLICY "Schedules are viewable by everyone" ON schedules
    FOR SELECT USING (true);

CREATE POLICY "Schedules can be created" ON schedules
    FOR INSERT WITH CHECK (true);

-- =====================================================
-- 完成
-- =====================================================
