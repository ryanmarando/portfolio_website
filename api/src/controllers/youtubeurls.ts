import { RequestHandler } from "express";
import { prisma } from "../config.js";

export const getYoutubeURLs: RequestHandler = async (req, res) => {
  const youtubeURLs = await prisma.youtubeUrls.findUnique({
    where: { name: "main" },
  });
  res.json(youtubeURLs);
  return;
};

export const createYoutubeURLs: RequestHandler = async (req, res) => {
  try {
    const youtubeURLs = await prisma.youtubeUrls.create({
      data: req.body,
    });
    res.status(201).json(youtubeURLs);
    console.log("Successful POST Youtube URLS", youtubeURLs.id);
    return;
  } catch (error) {
    console.log("Unsuccessful POST");
    res.status(500).json({
      error: `Unsuccessful POST...${error}`,
    });
  }
};

export const editYoutubeURLs: RequestHandler = async (req, res) => {
  try {
    const youtubeURLs = await prisma.youtubeUrls.update({
      where: { name: "main" },
      data: req.body,
    });
    res.status(200).json({ youtubeURLs });
  } catch (error) {
    console.log("Unsuccessful PATCH");
    res.status(404).json({
      error: `Unsuccessful PATCH... ${error}.`,
    });
  }
};
