import express from "express";
import { getStudents, getPosts } from "./adminController.js";
import { verifyToken } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.get("/students", verifyToken, getStudents);
router.get("/posts", verifyToken, getPosts);

export default router;

