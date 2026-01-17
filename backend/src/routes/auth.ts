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
router.post('/register', async (req: Request, res: Response): Promise<void> => {
    try {
        const { username, phone, password }: RegisterRequest = req.body;

        // 验证必填字段
        if (!username || !password) {
            res.status(400).json({ success: false, message: '用户名和密码为必填项' });
            return;
        }

        if (password.length < 6) {
            res.status(400).json({ success: false, message: '密码长度至少为6位' });
            return;
        }

        // 检查用户名是否已存在
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('username', username)
            .single();

        if (existingUser) {
            res.status(400).json({ success: false, message: '用户名已被使用' });
            return;
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
                total_hours: 0,
                consecutive_days: 0,
                focus_points: 100, // 新用户赠送100积分
                balance: 0
            })
            .select('id, username, phone, avatar, member_level, total_hours, consecutive_days, focus_points, balance, created_at')
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
        const { username, password }: LoginRequest = req.body;

        if (!username || !password) {
            res.status(400).json({ success: false, message: '请输入用户名和密码' });
            return;
        }

        // 查找用户
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .single();

        if (error || !user) {
            res.status(401).json({ success: false, message: '用户名或密码错误' });
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
            .select('id, username, phone, avatar, member_level, total_hours, consecutive_days, focus_points, balance, created_at')
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
