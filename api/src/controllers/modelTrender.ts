import { RequestHandler } from "express";
import axios from "axios";
import { prisma } from "../config.js";

const timestampFromNBMLine = (
  runDate: string,
  runHour: string,
  fHour: number
): Date => {
  try {
    const isoRunDate = `${runDate}T${runHour.padStart(2, "0")}:00:00Z`;
    const base = new Date(isoRunDate);

    if (isNaN(base.getTime())) {
      throw new Error(`Invalid base date: ${isoRunDate}`);
    }

    const finalDate = new Date(base.getTime() + fHour * 3600 * 1000);
    return finalDate;
  } catch (err) {
    console.error("timestampFromNBMLine error:", err);
    return new Date("Invalid");
  }
};

export const getModelData: RequestHandler = async (req, res) => {
  const date =
    (req.query.date as string) ||
    new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const hour = (req.query.hour as string) || "00";
  const url = `https://nomads.ncep.noaa.gov/pub/data/nccf/com/blend/prod/blend.${date}/${hour}/text/blend_nbstx.t${hour}z`;

  try {
    const response: any = await axios.get(url, { responseType: "text" });
    const lines = response.data.split("\n");

    console.log("Raw lines fetched from NBM data:", lines.slice(0, 10));

    let runDate =
      date.slice(0, 4) + "-" + date.slice(4, 6) + "-" + date.slice(6);
    let forecastHours: number[] = [];
    const records: any[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      // Extract K call letters (e.g., "KATL") from the parameter line
      const kCallLetterMatch = line.match(/\s*K[A-Z]{3}\s*/);
      const kCallLetter = kCallLetterMatch
        ? kCallLetterMatch[0].trim()
        : "Unknown";

      if (kCallLetter !== "Unknown") {
        console.log(kCallLetterMatch, kCallLetter);
      }

      // Capture forecast hours
      if (line.includes("FHR")) {
        const parts = line.match(/\d+/g);
        if (parts) {
          forecastHours = parts.map((h: string) => parseInt(h));
        } else {
          console.warn("No forecast hours found in FHR line:", line);
        }
        continue;
      }

      // Capture parameter rows (e.g., TMP, DPT, SKY)
      if (line.match(/^\s*[A-Z]{3}/)) {
        const parts = line.trim().split(/\s+/);
        const param = parts[0];
        const values = parts.slice(1).map((v: any) => parseFloat(v));

        for (let j = 0; j < values.length; j++) {
          const value = values[j];
          if (isNaN(value)) continue;

          const fh = forecastHours[j];
          if (isNaN(fh)) {
            console.warn(
              `Skipping invalid forecast hour at index ${j}:`,
              forecastHours[j]
            );
            continue;
          }

          const validTime = timestampFromNBMLine(runDate, hour, fh);
          if (isNaN(validTime.getTime())) {
            console.error(
              `Invalid validTime for runDate=${runDate}, runHour=${hour}, fHour=${fh}`
            );
            continue;
          }

          //console.log("Valid time:", validTime);

          if (kCallLetter !== "Unknown") {
            records.push({
              modelName: "NBM",
              location: kCallLetter,
              runTime: validTime,
              validTime,
              forecastHour: fh,
              parameter: param,
              value,
            });
          }
        }
      }
    }

    if (records.length === 0) {
      console.log("No records found after parsing NBM data.");
    }

    let saved = 0;
    for (const record of records) {
      try {
        await prisma.modelTrend.upsert({
          where: {
            modelName_runTime_validTime_parameter: {
              modelName: record.modelName,
              runTime: record.runTime,
              validTime: record.validTime,
              parameter: record.parameter,
            },
          },
          update: { value: record.value },
          create: record,
        });
        saved++;
      } catch (err) {
        console.error("Error inserting record into database:", err);
      }
    }

    console.log(`Saved ${saved} records to the database.`);
    res.status(200).json({ message: "NBM data parsed and saved" });
  } catch (err: any) {
    console.error("Failed to fetch or process NBM data:", err.message);
    res.status(500).json({ error: "Failed to process NBM data" });
  }
};

export const getSavedModelData: RequestHandler = async (req, res) => {
  try {
    const savedData = await prisma.modelTrend.findMany({
      take: 50,
      where: {
        parameter: "TMP",
        location: {
          not: "Unknown",
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!savedData || savedData.length === 0) {
      res.status(404).json({ message: "No model data found." });
      return;
    }

    res.status(200).json(savedData);
  } catch (error: any) {
    console.error("Error retrieving saved model data:", error);
    res.status(500).json({ error: "Failed to retrieve model data" });
  }
};

export const deleteAllModelData: RequestHandler = async (req, res) => {
  try {
    const deleted = await prisma.modelTrend.deleteMany({});

    res.status(200).json({
      message: "All model data deleted successfully",
      deletedCount: deleted.count,
    });
  } catch (error: any) {
    console.error("Error deleting model data:", error);
    res.status(500).json({ error: "Failed to delete model data" });
  }
};
