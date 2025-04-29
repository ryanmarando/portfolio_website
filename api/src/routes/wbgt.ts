import express from "express";
import * as wbgtController from "../controllers/wbgt.js";

const router = express.Router();

router.get("/", wbgtController.getWBGT);

export default router;
