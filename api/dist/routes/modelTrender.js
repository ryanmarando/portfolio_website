import express from "express";
import * as modelTrenderController from "../controllers/modelTrender.js";
const router = express.Router();
router.get("/", modelTrenderController.getModelRun);
export default router;
