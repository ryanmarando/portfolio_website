import { RequestHandler } from "express";
import axios from "axios";
import { prisma } from "../config.js";

const timestampFromNBMLine = (
  runDate: string,
  runHour: string,
  fHour: number
): Date => {
  const base = new Date(`${runDate}T${runHour}:00:00Z`);
  return new Date(base.getTime() + fHour * 60 * 60 * 1000);
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

    console.log("Raw lines fetched from NBM data:", lines.slice(0, 10)); // Log first 10 lines for inspection

    let runDate =
      date.slice(0, 4) + "-" + date.slice(4, 6) + "-" + date.slice(6);
    let forecastHours: number[] = [];

    const records: any[] = [];

    // Process lines for forecast hours
    let forecastLine = "";
    let paramData: any = {};

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Capture forecast hours (e.g., "06 09 12 15 18 21...")
      if (line.startsWith(" FHR")) {
        forecastHours = line
          .split(/\s+/)
          .slice(1)
          .map((h: any) => parseInt(h));
        continue;
      }

      // Capture parameter rows like TMP, TXN, TSD
      if (line.match(/^\s*[A-Z]{3}/)) {
        const parts = line.split(/\s+/);
        const param = parts[0]; // Parameter name (e.g., TMP, TXN)
        const values = parts.slice(1).map((v: any) => parseFloat(v));

        // Only add valid values (non-NaN)
        for (let j = 0; j < values.length; j++) {
          const value = values[j];
          if (isNaN(value)) continue;

          const validTime = timestampFromNBMLine(
            runDate,
            hour,
            forecastHours[j]
          );

          records.push({
            modelName: "NBM",
            location: "Unknown", // Since no station is provided, we're using "Unknown"
            runTime: new Date(`${runDate}T${hour}:00:00Z`),
            validTime,
            forecastHour: forecastHours[j],
            parameter: param,
            value,
          });
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

    res
      .status(200)
      .json({ message: "NBM data parsed and saved", count: saved });
  } catch (err: any) {
    console.error("Failed to fetch or process NBM data:", err.message);
    res.status(500).json({ error: "Failed to process NBM data" });
  }
};

export const getSavedModelData: RequestHandler = async (req, res) => {
  try {
    const savedData = await prisma.modelTrend.findMany({
      take: 50,
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
