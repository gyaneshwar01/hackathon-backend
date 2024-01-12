import userController from "../controllers/user.controller";
import express from "express";
import requireAuth from "../middleware/auth.middleware";

const router = express.Router();

router.get("/current", requireAuth, userController.getUser);

export default router;
