import express from "express";
import * as youtubeURLController from "../controllers/youtubeurls.js";

const router = express.Router();

router.get("/", youtubeURLController.getYoutubeURLs);
router.post("/", youtubeURLController.createYoutubeURLs);
router.patch("/", youtubeURLController.editYoutubeURLs);

export default router;
