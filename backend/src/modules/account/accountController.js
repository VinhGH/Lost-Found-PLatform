// 📂 backend/src/modules/account/accountController.js
import jwt from "jsonwebtoken";
import accountModel from "./accountModel.js";
import { comparePassword, hashPassword } from "../../utils/hash.js";
import { uploadAvatar, deleteAvatar } from "../../utils/avatarUpload.js";

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res
        .status(400)
        .json({ success: false, message: "Email and password required" });
    if (!email.endsWith("@dtu.edu.vn"))
      return res
        .status(400)
        .json({ success: false, message: "Email must end with @dtu.edu.vn" });

    const user = await accountModel.getByEmail(email);
    if (!user)
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });

    const valid = await comparePassword(password, user.password);
    if (!valid)
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });

    const token = jwt.sign(
      { accountId: user.account_id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
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
      return res
        .status(400)
        .json({ success: false, message: "Email and password required" });
    if (!email.endsWith("@dtu.edu.vn"))
      return res
        .status(400)
        .json({ success: false, message: "Email must end with @dtu.edu.vn" });

    const existingUser = await accountModel.getByEmail(email);
    if (existingUser)
      return res
        .status(400)
        .json({ success: false, message: "Email already registered" });

    const hashedPassword = await hashPassword(password);
    const newUser = await accountModel.create({
      email,
      password: hashedPassword,
      user_name: user_name || "Anonymous",
      phone_number: phone_number || null,
    });

    // Generate JWT token for immediate login after registration
    const token = jwt.sign(
      {
        accountId: newUser.account_id,
        role: newUser.role,
        email: newUser.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      success: true,
      message: "Registration successful",
      token,
      user: newUser,
    });
  } catch (error) {
    console.error("❌ Register error:", error.message);
    next(error);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const accountId = req.user?.accountId;

    if (!accountId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const user = await accountModel.getById(accountId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Profile retrieved successfully",
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const accountId = req.user?.accountId;
    console.log("📝 UPDATE PROFILE REQUEST:", { accountId, body: req.body });

    if (!accountId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const { user_name, phone_number, address, avatar } = req.body;

    // Update only provided fields
    const updateData = {};
    if (phone_number !== undefined) updateData.phone_number = phone_number;
    if (address !== undefined) updateData.address = address || null;

    // ⛔ BLOCK: Không cho admin đổi tên
    if (req.user.email === process.env.ADMIN_EMAIL) {
      console.log("⛔ Admin cannot change name");
      // Không thêm user_name vào updateData
    } else {
      // User thường được phép đổi tên
      if (user_name !== undefined) updateData.user_name = user_name;
    }

    // Handle avatar upload
    if (avatar !== undefined && avatar !== null && avatar !== "") {
      if (avatar.startsWith("data:image")) {
        console.log("📤 Uploading avatar to Supabase Storage...");

        const currentUser = await accountModel.getById(accountId);

        const uploadResult = await uploadAvatar(avatar, accountId);

        if (!uploadResult.success) {
          return res.status(400).json({
            success: false,
            message: "Failed to upload avatar: " + uploadResult.error,
          });
        }

        // Xoá avatar cũ
        if (
          currentUser?.avatar &&
          currentUser.avatar.includes("/storage/v1/object/public/Images/")
        ) {
          await deleteAvatar(currentUser.avatar);
        }

        updateData.avatar = uploadResult.url;
        console.log("✅ Avatar uploaded:", uploadResult.url);
      } else {
        updateData.avatar = avatar;
      }
    }

    console.log("📝 UPDATE DATA:", updateData);

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields to update",
      });
    }

    const updatedUser = await accountModel.update(accountId, updateData);
    console.log("✅ UPDATED USER:", updatedUser);

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("❌ Update profile error:", error.message);
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const accountId = req.user?.accountId;
    const { currentPassword, newPassword } = req.body;

    if (!accountId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    const user = await accountModel.getByIdWithPassword(accountId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isCurrentValid = await comparePassword(
      currentPassword,
      user.password
    );
    if (!isCurrentValid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from current password",
      });
    }

    const hashedPassword = await hashPassword(newPassword);
    await accountModel.updatePassword(accountId, hashedPassword);

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("❌ Change password error:", error.message);
    next(error);
  }
};
