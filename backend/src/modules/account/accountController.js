// 📂 backend/src/modules/account/accountController.js
import jwt from 'jsonwebtoken';
import accountModel from './accountModel.js';
import { comparePassword, hashPassword } from '../../utils/hash.js';
import { uploadAvatar, deleteAvatar } from '../../utils/avatarUpload.js';

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password required' });
    if (!email.endsWith('@dtu.edu.vn'))
      return res.status(400).json({ success: false, message: 'Email must end with @dtu.edu.vn' });

    const user = await accountModel.getByEmail(email);
    if (!user)
      return res.status(401).json({ success: false, message: 'Invalid email or password' });

    const valid = await comparePassword(password, user.password);
    if (!valid)
      return res.status(401).json({ success: false, message: 'Invalid email or password' });

    const token = jwt.sign(
      { accountId: user.account_id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const register = async (req, res, next) => {
  try {
    const { email, password, user_name, phone_number } = req.body;

    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password required' });
    if (!email.endsWith('@dtu.edu.vn'))
      return res.status(400).json({ success: false, message: 'Email must end with @dtu.edu.vn' });

    const existingUser = await accountModel.getByEmail(email);
    if (existingUser)
      return res.status(400).json({ success: false, message: 'Email already registered' });

    const hashedPassword = await hashPassword(password);
    const newUser = await accountModel.create({
      email,
      password: hashedPassword,
      user_name: user_name || 'Anonymous',
      phone_number: phone_number || null,
    });

    // Generate JWT token for immediate login after registration
    const token = jwt.sign(
      { accountId: newUser.account_id, role: newUser.role, email: newUser.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: newUser,
    });
  } catch (error) {
    console.error('❌ Register error:', error.message);
    next(error);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const accountId = req.user?.accountId;

    if (!accountId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const user = await accountModel.getById(accountId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      user
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const accountId = req.user?.accountId;
    console.log('📝 UPDATE PROFILE REQUEST:', { accountId, body: req.body });

    if (!accountId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const { user_name, phone_number, avatar } = req.body;

    // Update only provided fields
    const updateData = {};
    if (user_name !== undefined) updateData.user_name = user_name;
    if (phone_number !== undefined) updateData.phone_number = phone_number;

    // Handle avatar upload if provided
    if (avatar !== undefined && avatar !== null && avatar !== '') {
      // Check if avatar is base64 string (needs upload)
      if (avatar.startsWith('data:image')) {
        console.log('📤 Uploading avatar to Supabase Storage...');
        
        // Get current user to check for old avatar
        const currentUser = await accountModel.getById(accountId);
        
        // Upload new avatar
        const uploadResult = await uploadAvatar(avatar, accountId);
        
        if (!uploadResult.success) {
          return res.status(400).json({
            success: false,
            message: 'Failed to upload avatar: ' + uploadResult.error
          });
        }
        
        // Delete old avatar if exists
        if (currentUser?.avatar && currentUser.avatar.includes('/storage/v1/object/public/Images/')) {
          await deleteAvatar(currentUser.avatar);
        }
        
        updateData.avatar = uploadResult.url;
        console.log('✅ Avatar uploaded:', uploadResult.url);
      } else {
        // If it's already a URL, keep it
        updateData.avatar = avatar;
      }
    }

    console.log('📝 UPDATE DATA:', updateData);

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    const updatedUser = await accountModel.update(accountId, updateData);
    console.log('✅ UPDATED USER:', updatedUser);

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('❌ Update profile error:', error.message);
    next(error);
  }
};
