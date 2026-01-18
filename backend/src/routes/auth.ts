import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { supabase } from '../config/supabase.js';
import { generateToken, authMiddleware } from '../middleware/auth.js';
import { RegisterRequest, LoginRequest } from '../types/index.js';

const router = Router();

/**
 * POST /api/auth/register
 * 用户注册
 */
/**
 * POST /api/auth/register
 * 用户注册
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
    try {
        const { username, phone, password, shop_id }: RegisterRequest & { shop_id: string } = req.body;

        // 验证必填字段
        if (!username || !password || !shop_id) {
            res.status(400).json({ success: false, message: '用户名、密码和店铺为必填项' });
            return;
        }

        if (password.length < 6) {
            res.status(400).json({ success: false, message: '密码长度至少为6位' });
            return;
        }

        // 检查用户名是否已存在 (在当前店铺内)
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('shop_id', shop_id)
            .eq('username', username)
            .single();

        if (existingUser) {
            res.status(400).json({ success: false, message: '该店铺内用户名已被使用' });
            return;
        }

        // 检查手机号是否已存在 (在当前店铺内)
        if (phone) {
            const { data: existingPhone } = await supabase
                .from('users')
                .select('id')
                .eq('shop_id', shop_id)
                .eq('phone', phone)
                .single();

            if (existingPhone) {
                res.status(400).json({ success: false, message: '该店铺内手机号已被使用' });
                return;
            }
        }

        // 加密密码
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // 创建用户
        const { data: newUser, error } = await supabase
            .from('users')
            .insert({
                username,
                phone: phone || null,
                password_hash: passwordHash,
                member_level: 'normal',
                role: 0,
                shop_id: shop_id,
                total_hours: 0,
                consecutive_days: 0,
                focus_points: 100, // 新用户赠送100积分
                balance: 0
            })
            .select('id, username, phone, avatar, member_level, total_hours, consecutive_days, focus_points, balance, created_at, shop_id')
            .single();

        if (error) {
            console.error('Register error:', error);
            res.status(500).json({ success: false, message: '注册失败，请稍后重试' });
            return;
        }

        // 生成 JWT token
        const token = generateToken({ userId: newUser.id, username: newUser.username });

        res.status(201).json({
            success: true,
            message: '注册成功',
            user: newUser,
            token
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

/**
 * POST /api/auth/login
 * 用户登录
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
    try {
        const { username, password, shop_id }: LoginRequest & { shop_id?: string } = req.body;

        if (!username || !password) {
            res.status(400).json({ success: false, message: '请输入用户名和密码' });
            return;
        }

        // 查找用户 logic:
        // 1. 如果是 Admin (role=1)，可能没有 shop_id 或允许跨店? 
        //    为了安全且简单，我们先尝试用 (username + shop_id) 查找。
        //    如果没找到，且是 Admin 账号 (全局唯一 admin username?) -> 这里我们假设 admin 也是要在具体店登录，或者 admin 有特殊的全局入口?
        //    目前的 demand: "A store account cannot login to B store".
        //    So strict check: MUST match shop_id.
        //    Exception: "admin" user might be legacy and have NULL shop_id.

        let query = supabase
            .from('users')
            .select('*');

        // 支持通过用户名或手机号登录
        // .or(`username.eq.${username},phone.eq.${username}`)
        // 但这比较复杂，因为我们要同时 filter by shop_id

        // 组合查询: (username=X OR phone=X) AND (shop_id=Y OR (role=1 AND shop_id IS NULL))
        // Supabase query builder for OR with AND is tricky.
        // Simplification: query by username/phone first, then filter by shop_id in code? No, security.

        // 方案: 
        // 1. 尝试找该店铺下的用户
        let { data: users, error } = await supabase
            .from('users')
            .select('*')
            .eq('shop_id', shop_id)
            .or(`username.eq.${username},phone.eq.${username}`);

        // 2. 如果没找到，并且没有提供 shop_id (或者提供了 but user not found), check for GLOBAL ADMIN
        //    But wait, user MUST provide shop_id per new flow.

        // 特殊处理 Admin: 如果是超级管理员 'admin'，且在当前店铺没找到账号，
        // 我们检查是否是全局 Admin (shop_id is NULL)且 username='admin'。
        let user = null;

        if (users && users.length > 0) {
            user = users[0];
        } else {
            // Check for global admin
            const { data: adminUser } = await supabase
                .from('users')
                .select('*')
                .is('shop_id', null)
                .eq('role', 1)
                .eq('username', 'admin') // Hardcode constraint for safety or just check username
                .eq('username', username) // Only if they typed 'admin'
                .single();

            if (adminUser) {
                user = adminUser;
            }
        }

        if (error && !user) {
            // ignoring error if strictly looking for user
        }

        if (!user) {
            res.status(401).json({ success: false, message: '该店铺内未找到此账号' });
            return;
        }

        // 验证密码
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            res.status(401).json({ success: false, message: '用户名或密码错误' });
            return;
        }

        // 生成 JWT token
        const token = generateToken({ userId: user.id, username: user.username });

        // 返回用户信息（排除密码）
        const { password_hash, ...userWithoutPassword } = user;

        res.json({
            success: true,
            message: '登录成功',
            user: userWithoutPassword,
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

/**
 * GET /api/auth/profile
 * 获取当前用户信息
 */
router.get('/profile', authMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;

        const { data: user, error } = await supabase
            .from('users')
            .select('id, username, phone, avatar, member_level, role, total_hours, consecutive_days, focus_points, balance, created_at')
            .eq('id', userId)
            .single();

        if (error || !user) {
            res.status(404).json({ success: false, message: '用户不存在' });
            return;
        }

        res.json({
            success: true,
            user
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

/**
 * PUT /api/auth/profile
 * 更新用户信息
 */
router.put('/profile', authMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const { avatar, phone } = req.body;

        const updateData: Record<string, unknown> = {};
        if (avatar) updateData.avatar = avatar;
        if (phone) updateData.phone = phone;

        const { data: user, error } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', userId)
            .select('id, username, phone, avatar, member_level, total_hours, consecutive_days, focus_points, balance, created_at')
            .single();

        if (error) {
            res.status(500).json({ success: false, message: '更新失败' });
            return;
        }

        res.json({
            success: true,
            message: '更新成功',
            user
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

export default router;
