-- =====================================================
-- Update announcements table to include shop_id
-- =====================================================

DROP TABLE IF EXISTS announcements;

CREATE TABLE IF NOT EXISTS announcements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    tag TEXT,               -- 显示在图片上的小标签
    tag_color VARCHAR(50),  -- 标签颜色: brand-green, white, red, orange
    type VARCHAR(50) DEFAULT 'info', -- info, warning, promotion, emergency, activity
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable RLS for announcements
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active announcements
DROP POLICY IF EXISTS "Public announcements are viewable by everyone" ON announcements;
CREATE POLICY "Public announcements are viewable by everyone" ON announcements
    FOR SELECT USING (true);

-- Insert diversified seed data for announcements with shop_id

-- 1. 五道口店 (a1b2c3d4-e5f6-7890-abcd-ef1234567890)
INSERT INTO announcements (shop_id, title, content, image_url, tag, tag_color, type, active) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '全场8折起优惠', '仅限本周，快来体验！', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBSQh8P7sZQKwx9ai8eqY6Z9H1RTskQfW9-_25S1UMJJ3sluFys_YqEYrQ98pbEmRjXnb16YS9qPcXiPmUA7qTHMtTlYyqqiZ2IaDoSti1xxKsIjGd5vr9vBCjMf_G701whOGQt24NjCmrk8_XgBj_XsW6JrwYEEvm_jHe3tR4TRH8nA4sijBguNFBnaldSi1C-KMoinQlRrmWVZ13dRApx8JEptXJ936KtNaLh_wFEle8nlrHYsp_gjUHdVxTY3q0sdmU40HydeHU', '新店开业', '#05c184', 'promotion', true),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '早安会员日', '每周三会员饮品免费续杯，不仅是咖啡，还有更多选择！', 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', '会员福利', '#f97316', 'promotion', true);

-- 2. 中关村店 (b2c3d4e5-f6a7-8901-bcde-f23456789012)
INSERT INTO announcements (shop_id, title, content, image_url, tag, tag_color, type, active) VALUES
('b2c3d4e5-f6a7-8901-bcde-f23456789012', '周末读书会报名', '寻找志同道合的书友，一起分享阅读的乐趣。', 'https://lh3.googleusercontent.com/aida-public/AB6AXuCcm3_lhKE0Ga-0vZjOh0ygddxMnAhoFOhCdBKB5U0VfiTTYkcZN_35LZnoBpp2T8UhonqUkiAvat1CwS62_c_DJ2dGQTEGTKFOytoRvPbwIZ59TQYsVjOa4lWFgFWbMB5pPKV8XGH8Sck4-4bG1q_sWz19ycGn9U1d4m25ueiZdOh1yTrLBYmC_-O2HzbHQ7sEGWZyAYJ9vvqAkqvNYzEYp3M9UK-hn22519WOG6u58pFL3f7dVEZF1r08M8LYzJ7_nVtH8O5NS7U', '限时活动', '#ffffff', 'activity', true);

-- 3. 三里屯店 (c3d4e5f6-a7b8-9012-cdef-345678901234)
INSERT INTO announcements (shop_id, title, content, image_url, tag, tag_color, type, active) VALUES
('c3d4e5f6-a7b8-9012-cdef-345678901234', '店铺维护通知', '为了提供更好的服务，本店将于下周一凌晨进行系统升级，期间无法预约。', 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', '紧急通知', '#ef4444', 'emergency', true);
