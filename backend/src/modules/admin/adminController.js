import { getAllStudents, getAllPosts, getAllUsers, lockUser, unlockUser, deleteUser } from "./adminModel.js";
import { sendAccountLockEmail, sendAccountUnlockEmail } from "../../utils/emailService.js";
import accountModel from "../account/accountModel.js";

export const getStudents = async (req, res) => {
  try {
    if (req.user?.role !== "Admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied: Admins only"
      });
    }

    const students = await getAllStudents();
    res.status(200).json({
      success: true,
      message: "Students retrieved successfully",
      data: students
    });
  } catch (error) {
    console.error("Error fetching students:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch students",
      error: error.message
    });
  }
};

export const getPosts = async (req, res) => {
  try {
    if (req.user?.role !== "Admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied: Admins only"
      });
    }

    const posts = await getAllPosts();
    res.status(200).json({
      success: true,
      message: "Posts retrieved successfully",
      data: posts
    });
  } catch (error) {
    console.error("Error fetching posts:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch posts",
      error: error.message
    });
  }
};

/**
 * GET /api/admin/users
 * Get all users with optional filters
 */
export const getUsers = async (req, res) => {
  try {
    if (req.user?.role !== "Admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied: Admins only"
      });
    }

    const { search, isLocked } = req.query;
    const filters = {};

    if (search) filters.search = search;
    if (isLocked !== undefined) filters.isLocked = isLocked === 'true';

    const users = await getAllUsers(filters);
    res.status(200).json({
      success: true,
      message: "Users retrieved successfully",
      data: users
    });
  } catch (error) {
    console.error("Error fetching users:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.message
    });
  }
};

/**
 * PUT /api/admin/users/:id/lock
 * Lock a user account
 */
export const lockUserAccount = async (req, res) => {
  try {
    if (req.user?.role !== "Admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied: Admins only"
      });
    }

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "User ID is required"
      });
    }

    const user = await lockUser(id);

    // Send email notification
    try {
      const userAccount = await accountModel.getById(id);
      if (userAccount && userAccount.email) {
        const emailResult = await sendAccountLockEmail(
          userAccount.email,
          userAccount.user_name,
          req.body.reason || '' // Optional reason from request body
        );
        if (emailResult.success) {
          console.log(`📧 Lock notification email sent to: ${userAccount.email}`);
        } else {
          console.warn(`⚠️ Failed to send lock email to ${userAccount.email}:`, emailResult.error);
        }
      }
    } catch (emailError) {
      console.error('❌ Error sending lock notification email:', emailError);
      // Continue - don't fail the request if email fails
    }

    res.status(200).json({
      success: true,
      message: "User locked successfully",
      data: user
    });
  } catch (error) {
    console.error("Error locking user:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to lock user",
      error: error.message
    });
  }
};

/**
 * PUT /api/admin/users/:id/unlock
 * Unlock a user account
 */
export const unlockUserAccount = async (req, res) => {
  try {
    if (req.user?.role !== "Admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied: Admins only"
      });
    }

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "User ID is required"
      });
    }

    const user = await unlockUser(id);

    // Send email notification
    try {
      const userAccount = await accountModel.getById(id);
      if (userAccount && userAccount.email) {
        const emailResult = await sendAccountUnlockEmail(
          userAccount.email,
          userAccount.user_name
        );
        if (emailResult.success) {
          console.log(`📧 Unlock notification email sent to: ${userAccount.email}`);
        } else {
          console.warn(`⚠️ Failed to send unlock email to ${userAccount.email}:`, emailResult.error);
        }
      }
    } catch (emailError) {
      console.error('❌ Error sending unlock notification email:', emailError);
      // Continue - don't fail the request if email fails
    }

    res.status(200).json({
      success: true,
      message: "User unlocked successfully",
      data: user
    });
  } catch (error) {
    console.error("Error unlocking user:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to unlock user",
      error: error.message
    });
  }
};

/**
 * DELETE /api/admin/users/:id
 * Delete a user account
 */
export const deleteUserAccount = async (req, res) => {
  try {
    if (req.user?.role !== "Admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied: Admins only"
      });
    }

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "User ID is required"
      });
    }

    const user = await deleteUser(id);
    res.status(200).json({
      success: true,
      message: "User deleted successfully",
      data: user
    });
  } catch (error) {
    console.error("Error deleting user:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to delete user",
      error: error.message
    });
  }
};

