import express from "express";
import { getStudents, getPosts, getUsers, lockUserAccount, unlockUserAccount, deleteUserAccount } from "./adminController.js";
import { verifyToken } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.get("/students", verifyToken, getStudents);
router.get("/posts", verifyToken, getPosts);

// User management routes
router.get("/users", verifyToken, getUsers);
router.put("/users/:id/lock", verifyToken, lockUserAccount);
router.put("/users/:id/unlock", verifyToken, unlockUserAccount);
router.delete("/users/:id", verifyToken, deleteUserAccount);

export default router;

