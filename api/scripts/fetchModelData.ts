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

const getRunTimeStamp = (line: string) => {
  // Use regex to extract the date and time portion
  const match = line.match(/(\d{1,2}\/\d{2}\/\d{4})\s+(\d{4})\s+UTC/);

  if (match) {
    const [_, dateStr, timeStr] = match;

    // Convert to ISO 8601 format: yyyy-MM-ddTHH:mm:ssZ
    const [month, day, year] = dateStr.split("/").map(Number);
    const hours = Number(timeStr.slice(0, 2));
    const minutes = Number(timeStr.slice(2, 4));

    // Construct a Date object in UTC
    const utcDate = new Date(Date.UTC(year, month - 1, day, hours, minutes));

    //console.log(utcDate.toISOString()); // e.g., 2025-05-06T08:00:00.000Z
    return utcDate.toISOString();
  } else {
    console.log("Date/time not found");
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

    const finalDate = new Date(base.getTime() + fHour * 3600 * 1000);
    return finalDate;
  } catch (err) {
    console.error("timestampFromNBMLine error:", err);
    return new Date("Invalid");
  }
};

const run = async () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const now = new Date();
  const currentHour = now.getUTCHours().toString().padStart(2, "0");
  const hour = String(Number(currentHour) - 1);
  const url = `https://nomads.ncep.noaa.gov/pub/data/nccf/com/blend/prod/blend.${date}/${hour}/text/blend_nbstx.t${hour}z`;
  console.log("Latest Run: ", hour, " at ", url);

  try {
    const response: any = await axios.get(url, { responseType: "text" });
    const lines = response.data.split("\n"); //.slice(0, 50);
    //const lines = sampleData.split("\n");

    let runDate =
      date.slice(0, 4) + "-" + date.slice(4, 6) + "-" + date.slice(6);
    let forecastHours: number[] = [];
    const records: any[] = [];
    let location = "";
    let parameter = "";
    let runTimeStamp = null;
    let saved = 0;

    for (const line of lines) {
      // Skip if line is empty
      if (!line.trim()) continue;

      // Extract K call letters
      const kCallLetterMatch = line.match(/\s*K[A-Z]{3}\s*/);
      if (kCallLetterMatch) {
        location = kCallLetterMatch ? kCallLetterMatch[0].trim() : "Unknown";
        runTimeStamp = getRunTimeStamp(line);
        //console.log(location);
      }

      // Capture forecast hours
      if (line.includes("FHR")) {
        const parts = line.match(/\d+/g);
        if (parts) {
          forecastHours = parts.map((h: string) => parseInt(h));
          //console.log(forecastHours);
        } else {
          console.warn("No forecast hours found in FHR line:", line);
        }
        continue;
      }

      if (line.match(/^\s*[A-Z0-9]{3}/)) {
        const parts = line.trim().split(/\s+/);
        parameter = parts[0];
        if (!parameterTypes.includes(parameter)) continue;
        const values = parts.slice(1);
        //console.log(parameter, forecastHours, values);

        if (["P06", "Q06", "T06"].includes(parameter)) {
          // These parameters provide values every 6 hours, but forecastHours is in 3-hour increments.
          // So value[0] matches forecastHour[2], value[1] matches forecastHour[4], etc.
          for (let i = 0; i < values.length; i++) {
            const valueStr = values[i];
            const fhIndex = i * 2;
            const forecastHour = forecastHours[fhIndex];
            if (!forecastHour) break; // Safety check

            if (!valueStr) continue;

            const value = parseFloat(valueStr);
            if (isNaN(value)) continue;

            let validTime;
            try {
              validTime = timestampFromNBMLine(runDate, hour, forecastHour);
            } catch (err) {
              console.error("timestamp error:", err);
              continue;
            }

            if (isNaN(validTime.getTime())) continue;

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
          }
        } else if (["P12", "Q12", "T12"].includes(parameter)) {
          for (let i = 0; i < values.length; i++) {
            const valueStr = values[i];
            const fhIndex = i * 4;
            const forecastHour = forecastHours[fhIndex];
            if (!forecastHour) break; // Safety check

            if (!valueStr) continue;

            const value = parseFloat(valueStr);
            if (isNaN(value)) continue;

            let validTime;
            try {
              validTime = timestampFromNBMLine(runDate, hour, forecastHour);
            } catch (err) {
              console.error("timestamp error:", err);
              continue;
            }

            if (isNaN(validTime.getTime())) continue;

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
          }
        } else {
          for (let i = 0; i < forecastHours.length; i++) {
            const forecastHour = forecastHours[i];
            let valueStr = values[i];

            // If valueStr is empty, skip this forecast hour
            if (!valueStr) continue;

            // Parse the value and ensure it's valid
            const value = parseFloat(valueStr);
            if (isNaN(value)) continue;

            let validTime;
            try {
              validTime = timestampFromNBMLine(runDate, hour, forecastHour);
            } catch (err) {
              console.error("timestamp error:", err);
              continue;
            }

            if (isNaN(validTime.getTime())) {
              continue;
            }

            if (location[0] === "K" && runTimeStamp) {
              records.push({
                modelName: "NBM",
                location,
                runTime: runTimeStamp,
                validTime,
                forecastHour: forecastHour,
                parameter,
                value,
              });
            }
          }
        }
      }
    }
    console.log("Completed reading in data...");

    // Save all the records to the database
    const BATCH_SIZE = 1000;

    // Filter only valid records first
    const filteredRecords = records.filter(
      (record) => record.location?.startsWith("K") && record.runTime
    );
    console.log("Completed filtering from K locations only...");

    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    try {
      const deleted = await prisma.modelTrend.deleteMany({
        where: {
          runTime: {
            lt: cutoffTime,
          },
        },
      });
      console.log(`Deleted ${deleted.count} old records (older than 24h)`);
    } catch (err) {
      console.error("Error deleting old records:", err);
    }

    console.log("Saving to database...");
    // Process in batches
    for (let i = 0; i < filteredRecords.length; i += BATCH_SIZE) {
      const batch = filteredRecords.slice(i, i + BATCH_SIZE);

      try {
        const result = await prisma.modelTrend.createMany({
          data: batch,
          skipDuplicates: true, // Skip if a unique record already exists
        });

        saved += result.count;
        //console.log(saved, "/", filteredRecords.length, "saved");
      } catch (err) {
        console.error("Error in batch insert:", err);
      }
    }

    console.log(`Saved ${saved} records to DB`);
    process.exit(0);
  } catch (err) {
    console.error("Error processing model data:", err);
    process.exit(1);
  }
};

run();
