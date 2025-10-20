import { getAllStudents, getAllPosts } from "./adminModel.js";

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

