import { RequestHandler } from "express";
import { prisma } from "../config.js";
import axios from "axios";
import * as cheerio from "cheerio"; // Use named import

type ModelConfig = {
  baseUrl: string;
  modelTypes: string[];
};

const modelConfigs: Record<string, ModelConfig> = {
  gfs: {
    baseUrl: "https://nomads.ncep.noaa.gov/pub/data/nccf/com/gfs/prod",
    modelTypes: ["gfs"],
  },
  // You can add more models here
  // e.g., "ecmwf": { baseUrl: "https://some-ecmwf-url.com", modelTypes: ["ecmwf"] }
};

function formatDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

async function findLatestRunForModel(model: string) {
  if (!modelConfigs[model]) {
    throw new Error(`Model "${model}" not supported.`);
  }

  const { baseUrl, modelTypes } = modelConfigs[model];
  const runHours = ["18", "12", "06", "00"];
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setUTCDate(today.getUTCDate() - 1);

  const candidates: { date: string; hour: string; modelType: string }[] = [];

  // Prepare candidate runs for today and yesterday
  for (const date of [today, yesterday]) {
    const dateStr = formatDate(date);
    for (const hour of runHours) {
      for (const modelType of modelTypes) {
        candidates.push({ date: dateStr, hour, modelType });
      }
    }
  }

  // Attempt to find a valid model run
  for (const { date, hour, modelType } of candidates) {
    const testUrl = `${baseUrl}/${modelType}.${date}/${hour}/atmos/${modelType}.t${hour}z.pgrb2.0p25.f000`;
    try {
      const headRes = await fetch(testUrl, { method: "HEAD" });
      if (headRes.ok) {
        return {
          baseUrl: `${baseUrl}/${modelType}.${date}/${hour}/atmos`,
          modelType,
          date,
          hour,
          file: `${modelType}.t${hour}z.pgrb2.0p25.f000`,
        };
      }
    } catch (err) {
      // Ignore and continue
    }
  }

  throw new Error(`No recent ${model} model run found.`);
}

export const getModelRun: RequestHandler = async (req, res) => {
  const baseUrl =
    "https://nomads.ncep.noaa.gov/pub/data/nccf/com/gfs/prod/gfs.20250503/00/atmos/";

  try {
    // Request the page to get a list of available files
    const response: any = await axios.get(baseUrl);

    // Use cheerio to parse the HTML response
    const $ = cheerio.load(response.data);

    // Look for files that include 'prate' or 'apcp' in the name or any file with 'pgrb2full' and 'f' (forecast hours)
    const precipFiles: any = [];
    $("a").each((index, element) => {
      const fileName = $(element).attr("href");
      // Check for filenames that include 'pgrb2full' and a forecast hour ('f360', 'f363', etc.)
      if (
        fileName &&
        fileName.includes("pgrb2full") &&
        fileName.match(/\.f\d+/)
      ) {
        precipFiles.push(fileName);
      }
    });

    // Send back the list of precipitation files found
    res.json({ precipFiles });
  } catch (error) {
    console.error("Error fetching model files:", error);
    res.status(500).json({ error: "Failed to fetch precipitation files" });
  }
  //   const model = (req.query.model as string) || "gfs"; // Default to "gfs" if no model is specified
  //   try {
  //     const latestRun = await findLatestRunForModel(model);
  //     res.status(200).json({
  //       message: `Latest ${model} model run found`,
  //       ...latestRun,
  //     });
  //   } catch (error) {
  //     console.error(`Error fetching ${model} model run:`, error);
  //     res
  //       .status(500)
  //       .json({ error: `Failed to retrieve latest ${model} model run` });
  //   }
};
