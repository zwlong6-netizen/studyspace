-- =====================================================
-- 在 Supabase SQL Editor 中直接执行此脚本
-- 为管理后台的增删改查功能添加必要的 RLS 策略
-- =====================================================

-- ===== SHOPS 店铺表 =====
DROP POLICY IF EXISTS "Admins can insert shops" ON shops;
DROP POLICY IF EXISTS "Admins can update shops" ON shops;
DROP POLICY IF EXISTS "Admins can delete shops" ON shops;

CREATE POLICY "Admins can insert shops" ON shops
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update shops" ON shops
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Admins can delete shops" ON shops
    FOR DELETE USING (true);

-- ===== SEATS 座位表 =====
DROP POLICY IF EXISTS "Admins can insert seats" ON seats;
DROP POLICY IF EXISTS "Admins can update seats" ON seats;
DROP POLICY IF EXISTS "Admins can delete seats" ON seats;

CREATE POLICY "Admins can insert seats" ON seats
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update seats" ON seats
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Admins can delete seats" ON seats
    FOR DELETE USING (true);

-- ===== USERS 用户表 =====
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (true);

CREATE POLICY "Admins can delete users" ON users
    FOR DELETE USING (true);

-- ===== ANNOUNCEMENTS 公告表 =====
DROP POLICY IF EXISTS "Admins can insert announcements" ON announcements;
DROP POLICY IF EXISTS "Admins can update announcements" ON announcements;
DROP POLICY IF EXISTS "Admins can delete announcements" ON announcements;

CREATE POLICY "Admins can insert announcements" ON announcements
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update announcements" ON announcements
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Admins can delete announcements" ON announcements
    FOR DELETE USING (true);

-- ===== 完成 =====
-- 现在管理后台的所有增删改查功能应该都能正常工作了
