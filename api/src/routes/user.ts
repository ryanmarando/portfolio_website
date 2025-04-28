import express from "express";
import * as userController from "../controllers/user.js";

const router = express.Router();

router.get("/", userController.getUsers);
router.get("/:id", userController.getUserById);
router.post("/", userController.createUser);
router.delete("/:id", userController.deleteUser);
router.patch("/:id", userController.editUser);

export default router;
