// scripts/fetchAndSaveModelData.ts
import axios from "axios";
import { prisma } from "../src/config.js";

const parameterTypes = [
  "TMP",
  "DPT",
  "SKY",
  "WDR",
  "WSP",
  "P06",
  "P12",
  "Q06",
  "Q12",
  "T03",
  "T06",
  "T12",
];

const getRunTimeStamp = (line: string): string | null => {
  const match = line.match(/(\d{1,2}\/\d{2}\/\d{4})\s+(\d{4})\s+UTC/);
  if (match) {
    const [_, dateStr, timeStr] = match;
    const [month, day, year] = dateStr.split("/").map(Number);
    const hours = Number(timeStr.slice(0, 2));
    const minutes = Number(timeStr.slice(2, 4));
    const utcDate = new Date(Date.UTC(year, month - 1, day, hours, minutes));
    return utcDate.toISOString();
  } else {
    console.log("Date/time not found");
    return null;
  }
};

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
    return new Date(base.getTime() + fHour * 3600 * 1000);
  } catch (err) {
    console.error("timestampFromNBMLine error:", err);
    return new Date("Invalid");
  }
};

const run = async () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const now = new Date();
  const currentHour = now.getUTCHours().toString().padStart(2, "0");
  let hour = String(Number(currentHour) - 1).padStart(2, "0");
  const url = `https://nomads.ncep.noaa.gov/pub/data/nccf/com/blend/prod/blend.${date}/${hour}/text/blend_nbstx.t${hour}z`;

  console.log("Latest Run:", hour, "at", url);

  try {
    const response: any = await axios.get(url, { responseType: "text" });
    const lines: any = response.data.split("\n");

    const runDate = `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6)}`;
    let forecastHours: number[] = [];
    const records: any[] = [];
    let location = "";
    let parameter = "";
    let runTimeStamp: string | null = null;
    let saved = 0;

    for (const line of lines) {
      if (!line.trim()) continue;

      const kCallLetterMatch = line.match(/\s*K[A-Z]{3}\s*/);
      if (kCallLetterMatch) {
        location = kCallLetterMatch[0].trim();
        runTimeStamp = getRunTimeStamp(line) ?? null;
      }

      if (line.includes("FHR")) {
        const parts = line.match(/\d+/g);
        forecastHours = parts ? parts.map(Number) : [];
        continue;
      }

      if (line.match(/^\s*[A-Z0-9]{3}/)) {
        const parts = line.trim().split(/\s+/);
        parameter = parts[0];
        if (!parameterTypes.includes(parameter)) continue;

        const values = parts.slice(1);

        const getForecastHour = (i: number, multiplier: number) =>
          forecastHours[i * multiplier];

        const pushRecord = (
          forecastHour: number,
          valueStr: string,
          parameter: string
        ) => {
          if (!valueStr || isNaN(parseFloat(valueStr))) return;
          const value = parseFloat(valueStr);
          const validTime = timestampFromNBMLine(runDate, hour, forecastHour);
          if (isNaN(validTime.getTime())) return;

          if (location[0] === "K" && runTimeStamp) {
            records.push({
              modelName: "NBM",
              location,
              runTime: runTimeStamp,
              validTime,
              forecastHour,
              parameter,
              value,
            });
          }
        };

        if (["P06", "Q06", "T06"].includes(parameter)) {
          values.forEach((val: any, i: any) => {
            const fh = getForecastHour(i, 2);
            if (fh !== undefined) pushRecord(fh, val, parameter);
          });
        } else if (["P12", "Q12", "T12"].includes(parameter)) {
          values.forEach((val: any, i: any) => {
            const fh = getForecastHour(i, 4);
            if (fh !== undefined) pushRecord(fh, val, parameter);
          });
        } else {
          forecastHours.forEach((fh, i) => {
            pushRecord(fh, values[i], parameter);
          });
        }
      }
    }

    console.log("Completed reading in data...");

    const BATCH_SIZE = 250;
    const filteredRecords = records.filter(
      (r) => r.location?.startsWith("K") && r.runTime
    );
    console.log("Filtered to", filteredRecords.length, "valid records");

    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
    try {
      const deleted = await prisma.modelTrend.deleteMany({
        where: { runTime: { lt: cutoffTime } },
      });
      console.log(`Deleted ${deleted.count} old records`);
    } catch (err) {
      console.error("Error deleting old records:", err);
    }

    console.log("Saving to database...");
    for (let i = 0; i < filteredRecords.length; i += BATCH_SIZE) {
      const batch = filteredRecords.slice(i, i + BATCH_SIZE);
      try {
        const result = await prisma.modelTrend.createMany({
          data: batch,
          skipDuplicates: true,
        });
        saved += result.count;
      } catch (err) {
        console.error("Batch insert error:", err);
      }
    }

    console.log(`Saved ${saved} records to DB`);

    // 🧠 Memory usage report
    const mem = process.memoryUsage();
    console.log("Memory usage:");
    console.log(`  RSS: ${(mem.rss / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Heap Total: ${(mem.heapTotal / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Heap Used: ${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  External: ${(mem.external / 1024 / 1024).toFixed(2)} MB`);

    process.exit(0);
  } catch (err) {
    console.error("Error processing model data:", err);
    process.exit(1);
  }
};

run();
