import { RequestHandler } from "express";
import axios from "axios";
import { prisma } from "../config.js";
import { ModelTrend } from "@prisma/client";

const sampleData = `
KDAN    NBM V4.2 NBS GUIDANCE    5/06/2025  0800 UTC
 DT /MAY   6      /MAY   7                /MAY   8                /MAY   9
 UTC  12 15 18 21 00 03 06 09 12 15 18 21 00 03 06 09 12 15 18 21 00 03 06
 FHR  04 07 10 13 16 19 22 25 28 31 34 37 40 43 46 49 52 55 58 61 64 67 70
 TXN              75          50          79          55          80
 XND               1           1           2           1           1
 TMP  54 67 72 73 67 59 55 53 56 71 77 77 70 63 60 57 60 72 78 77 70 64 61
 TSD   2  2  2  2  2  2  2  2  1  2  2  2  3  2  2  2  2  2  2  2  2  1  2
 DPT  49 48 46 47 50 49 48 47 50 51 49 50 53 53 53 53 56 57 56 56 58 58 57
 DSD   2  2  2  2  2  2  2  2  1  2  2  2  3  2  2  2  2  2  2  2  2  1  2
 SKY   7  5 24 14  6 16 18 38 21 34 36 52 63 66 60 58 38 31 42 43 58 67 70
 SSD  12  9 27 18 10 29 23 26 26 35 33 29 25 21 21 15 22 27 23 23 23 17 16
 WDR  28 25 25 25 23 27 30 28 27 29 25 24 21 23 28 00 33  1 26 28 32 36 36
 WSP   1  4  8  7  2  1  1  1  1  3  5  4  2  1  1  0  1  1  2  2  1  2  2
 WSD   2  2  2  2  2  1  1  1  2  2  2  2  2  2  1  1  1  2  2  3  2  2  3
 GST   4  9 14 12  6  4  4  4  4  7  9  9  6  4  3  3  3  4  6  6  5  5  6
 GSD   2  2  3  2  2  2  2  2  2  3  3  3  3  3  2  2  2  2  3  3  3  4  4
 P06         0     1     0     0     0     1     3     7     6    30    38
 P12               1           0           1          11          34
 Q06         0     0     0     0     0     0     0     0     0     1     4
 Q12               0           0           0           0           1
 DUR               0           0           0           0           1
 T03   0  0  0  1  0  0  0  0  0  0  0  0  0  1  1  1  1  1  4 13 23 17 10
 T06         1     3     1     0     0     2     4     3     6    30    27
 T12               3           1           2           7          30
 PZR   0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0
 PSN   0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0
 PPL   0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0
 PRA   0  0  1  1  0  0  0  0  0  0  0  0  0  2  2  8 14 33 48 51 53 57 41
 S06         0     0     0     0     0     0     0     0     0     0     0
 SLV  68 67 73 77 76 75 75 74 72 71 76 83 86 87 89 93 98 98100100100100 97
 I06         0     0     0     0     0     0     0     0     0     0     0
 CIG -88-88-88-88-88-88-88-88-88-88-88-88-88-88-88-88-88-88-88-88 90 80 29
 IFC   0  0  0  0  0  0  0  0  0  0  0  0  0  0  1  5  5  0  0  0  0  0 25
 LCB  50 90 70 70 60-99210 80100190150160 80 60 60 90 90 90 60 60 50 50 29
 VIS 100100100100100100100100100100100100100100100100100100100100100100100
 IFV   2  0  0  0  0  0  0  2  6  0  0  0  0  0  5  9  5  0  0  0  0  0  7
 MHT   5 50 76 71  5  4  4  4  4 33 59 62  4  4  4  4 10 27 57 33  5  4  4
 TWD  29 25 26 26 25 28 30 32 29 29 26 27 22 24 28 30  2  3 26 27 18 36 35
 TWS   6 11 15 14  7  5  6  6  4  5  7  7  7  7  4  5  6  5  6  6  4  5  6
 HID       -99     4     4     4     5     5     5     4   -99     4     4
 SOL  23 80 81 57  9  0  0  0 21 76 89 59 11  0  0  0 15 57 75 48 29  0  0

 KDAW    NBM V4.2 NBS GUIDANCE    5/06/2025  0800 UTC
 DT /MAY   6      /MAY   7                /MAY   8                /MAY   9
 UTC  12 15 18 21 00 03 06 09 12 15 18 21 00 03 06 09 12 15 18 21 00 03 06
 FHR  04 07 10 13 16 19 22 25 28 31 34 37 40 43 46 49 52 55 58 61 64 67 70
 TXN              60          52          70          51          70
 XND               3           2           2           1           2
 TMP  50 53 56 56 54 54 55 55 57 63 67 64 60 56 54 53 56 63 67 64 58 54 50
 TSD   2  2  3  3  3  2  3  3  2  2  3  2  2  2  2  1  1  2  2  2  2  2  2
 DPT  49 52 54 52 51 52 52 53 54 54 54 53 53 51 50 49 50 49 48 46 46 46 45
 DSD   2  2  3  3  2  2  3  3  2  2  2  2  2  2  2  1  1  1  2  2  2  2  2
 SKY  94 93 92 91 94 94 96 95 88 67 48 67 47 21 15 24 38 45 61 76 84 86 85
 SSD   8  8 10 10  7  8  6 13 12 26 25 20 29 18 15 19 24 22 15 14 13 11 11
 WDR   8 10 11 11 11 11 14 17 20 19 18 19 22 25 27 28 30 31 30 34  2  2  3
 WSP   5  5  6  6  4  2  1  1  3  4  6  5  2  2  3  4  5  5  5  4  2  2  3
 WSD   2  2  2  2  2  2  2  2  2  3  3  3  2  2  3  3  3  3  3  3  2  2  2
 GST  10 11 13 13  9  7  5  5  7 10 13 11  7  7  8  9 11 11 11 10  7  7  8
 GSD   2  2  3  3  3  3  3  3  3  4  4  4  4  4  4  4  4  4  4  4  4  3  3
 P06        69    83    90    12    32    47     5     3     3     9    22
 P12              93          90          63           6          12
 Q06        10    25    14     1     0    16     0     0     0     0     0
 Q12              35          15          16           0           0
 DUR              11           4           4           0           0
 T03   4  2  5 11 17 21 11  1  0  1  6 17 10  1  0  0  0  0  1  2  1  2  2
 T06         9    22    24     1     9    24     1     0     2     4     4
 T12              22          24          25           1           4
 PZR   0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0
 PSN   0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0
 PPL   0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0
 PRA  81 70 50 49 52 71 28  6  7 16 35 37 13  3  0  0  0  9  7 16 19 27 27
 S06         0     0     0     0     0     0     0     0     0     0     0
 SLV  97100 97 98 98 94 78 73 71 74 73 75 77 77 76 77 74 72 71 71 70 68 68
 I06         0     0     0     0     0     0     0     0     0     0     0
 CIG   1  2  2  2  2  1  1  1  1  2  4 49 49 48-88-88-88-88 43 46 41 34 21
 IFC 100 98 95 96100100100 91 86 60 31  0  5  5 11 11 14  6  1  0  1 14 21
 LCB   1  2  2  2  2-99  1  1  1  2  4 35 49 48120150160 49 42 35 15 15 21
 VIS   2  7  5  2  2  2  2  2  2 10 40100100100100100100100100100100100100
 IFV  84 56 59 64 74 64 74 63 56 30 11  1  0  0  5 11  3  0  0  0  0  0  3
 MHT   5  7 10  8  4  4  4  5 12 27 28 19  5  6  4  7 15 34 55 24  5 16 11
 TWD  10 12 12 13 12 12 16 18 21 20 19 21 25 26 28 29 31 31 30  6  5  5  5
 TWS   8  9 11 10  7  6  6  8  8 12 15 13  7  9  9 10 10  9  8  5  6 12 11
 HID       -99     3     3     4     3     3     3     3   -99     3     3
 SOL   3 11 12  5  1  0  0  0 18 45 56 35  6  0  0  0 21 61 72 33 17  0  0

 KDAY    NBM V4.2 NBS GUIDANCE    5/06/2025  0800 UTC
 DT /MAY   6      /MAY   7                /MAY   8                /MAY   9
 UTC  12 15 18 21 00 03 06 09 12 15 18 21 00 03 06 09 12 15 18 21 00 03 06
 FHR  04 07 10 13 16 19 22 25 28 31 34 37 40 43 46 49 52 55 58 61 64 67 70
 TXN              68          53          74          53          66
 XND               2           2           1           1           2
 TMP  52 55 62 66 63 59 56 54 56 66 72 73 69 63 59 55 54 59 62 62 57 51 46
 TSD   1  2  3  2  2  2  2  1  1  2  2  2  2  2  2  2  2  3  2  3  3  3  3
 DPT  47 49 50 51 50 50 48 47 49 53 53 53 54 53 51 48 46 48 47 45 41 37 35
 DSD   1  1  2  2  2  2  2  1  1  2  2  2  2  2  2  2  2  2  2  2  3  3  3
 SKY  94 85 56 32 70 37 36 28 10 14 33 61 67 66 60 74 69 60 62 47 39 11  5
 SSD   6 13 34 32 34 25 32 33 11 15 26 26 25 29 29 20 17 22 14 29 32 10  8
 WDR  22 25 27 28 26 26 26 28 30 31 33 36  4  5  5  4  4  4  3  3  4  4  4
 WSP  10 12 14 13  9  7  7  6  5  4  4  4  3  4  5  8 10 10 12 13 12 10  9
 WSD   3  2  3  3  2  2  2  2  2  3  3  3  2  3  3  3  3  3  2  2  2  2  2
 GST  16 18 21 20 15 12 11 10  8  8  8  8  7  7  9 13 15 16 17 19 18 17 15
 GSD   3  3  4  4  3  3  3  3  3  3  3  3  2  4  5  4  4  4  4  3  3  3  3
 P06        94    24     6     1     2     6     5     4    16    10     1
 P12              94           7           8          11          23
 Q06        18     1     0     0     0     0     0     0     0     0     0
 Q12              19           0           0           0           0
 DUR               4           0           0           0           0
 T03   8  5  3  3  3  2  1  1  1  1  1  5  7  5  3  4  5  5  5  7  3  1  0
 T06         7     9     4     1     1    17    11     9    10    11     3
 T12              13           4          17          14          16
 PZR   0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0
 PSN   0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0
 PPL   0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0
 PRA  96 70 19  3  1  0  0  0  0  0  4  1  4  1  1  7 13 16 16  7  7  1  1
 S06         0     0     0     0     0     0     0     0     0     0     0
 SLV  68 71 72 72 75 84 84 84 84 85 84 85 84 83 82 81 77 68 62 62 55 47 42
 I06         0     0     0     0     0     0     0     0     0     0     0
 CIG  27 22 45-88 70-88-88-88-88-88 45100130100100 60 39 14 14 24-88-88-88
 IFC   7 12  1  0  0  0  1  7  9  4  0  0  0  0  7 18 24 24 12  3  0  0  7
 LCB  23 22 45 60 60-99 50 70 50 80 45 41 60 29 25 23 20 10 14 20 32 60260
 VIS  40 60100100100100100 90100100100100100100100100100100100100100100100
 IFV  16  8  2  1  1  1  1  5  5  1  0  0  0  0  3  6  5  4  3  2  0  0  2
 MHT  10 15 33 47  6  4  4  5  4 25 46 51  4  4  4  6 12 17 27 26 14  5  5
 TWD  23 27 27 28 27 26 27 28 30 32 33 33  5 10  7  5  6  5  4  3  4  4  4
 TWS  14 15 19 18 11 11 11 10  7  7  7  4  4  5  7 10 11 11 12 15 15 12 11
 HID       -99     4     4     3     4     4     4     3   -99     3     4
 SOL   3 16 45 56 11  0  0  0 16 67 86 56 15  1  1  0  4 20 34 35 32  1  1
`;

const modelData = [
  {
    id: 1,
    modelName: "NBM",
    location: "KDAY",
    runTime: new Date("2025-05-10T00:00:00.000Z"),
    validTime: new Date("2025-05-10T06:00:00.000Z"),
    forecastHour: 6,
    parameter: "TMP",
    value: 48,
  },
  {
    id: 2,
    modelName: "NBM",
    location: "KDAY",
    runTime: new Date("2025-05-10T01:00:00.000Z"),
    validTime: new Date("2025-05-10T06:00:00.000Z"),
    forecastHour: 5,
    parameter: "TMP",
    value: 51,
  },
  {
    id: 3,
    modelName: "NBM",
    location: "KDAY",
    runTime: new Date("2025-05-10T02:00:00.000Z"),
    validTime: new Date("2025-05-10T06:00:00.000Z"),
    forecastHour: 4,
    parameter: "TMP",
    value: 30,
  },
];

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

export const getModelData: RequestHandler = async (req, res) => {
  const date =
    (req.query.date as string) ||
    new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const now = new Date();
  const currentHour = now.getUTCHours().toString().padStart(2, "0");
  const hour = (req.query.hour as string) || String(Number(currentHour) - 1);
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

    console.log(`Saved ${saved} records to the database.`);
    res
      .status(200)
      .json({ message: `Saved ${saved} records to the database.` });
  } catch (err: any) {
    console.error("Failed to fetch or process NBM data:", err.message);
    res.status(500).json({ error: "Failed to process NBM data" });
  }
};

export const getSavedModelData: RequestHandler = async (req, res) => {
  const location = req.query.location as string | undefined;
  const parameter = req.query.parameter as string | undefined;
  try {
    const savedData = await prisma.modelTrend.findMany({
      take: 100,
      where: {
        parameter: parameter,
        location: location,
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

type TrendResult = ModelTrend & {
  trend: "rising" | "falling" | "steady";
  delta: number;
  original: number;
};

function attachTrendsToForecasts(data: ModelTrend[]): TrendResult[] {
  const result: TrendResult[] = [];

  // Group by location, parameter, and validTime
  const groups = new Map<string, ModelTrend[]>();

  for (const record of data) {
    const key = `${record.location}-${
      record.parameter
    }-${record.validTime.toISOString()}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(record);
  }

  for (const [key, records] of groups.entries()) {
    if (records.length < 2) continue; // Skip if only one runTime present

    const runMap = new Map<number, ModelTrend>();
    for (const rec of records) {
      runMap.set(rec.runTime.getTime(), rec);
    }

    const sortedRunTimes = Array.from(runMap.keys()).sort((a, b) => a - b);

    for (let i = 1; i < sortedRunTimes.length; i++) {
      const prevTime = sortedRunTimes[i - 1];
      const currentTime = sortedRunTimes[i];

      const previous = runMap.get(prevTime)!;
      const current = runMap.get(currentTime)!;

      const delta = current.value - previous.value;
      let trend: "rising" | "falling" | "steady" = "steady";
      if (delta > 0) trend = "rising";
      else if (delta < 0) trend = "falling";

      result.push({
        ...current,
        trend,
        delta,
        original: previous.value,
      });
    }
  }

  return result;
}

export const getModelComparison: RequestHandler = async (req, res) => {
  const location = req.query.location as string | undefined;

  if (!location) {
    res.status(400).json({ error: "Missing location or parameter in query" });
    return;
  }

  try {
    const rawData = await prisma.modelTrend.findMany({
      where: {
        location,
      },
      orderBy: [
        {
          runTime: "desc",
        },
        {
          validTime: "asc",
        },
      ],
    });

    if (!rawData || rawData.length === 0) {
      res.status(404).json({ message: "No model data found." });
      return;
    }

    const withTrends = attachTrendsToForecasts(rawData);

    res.status(200).json(withTrends);
  } catch (error: any) {
    console.error("Error computing model trends:", error);
    res.status(500).json({ error: "Failed to retrieve model trend data" });
  }
};

export const getLatestRunTime: RequestHandler = async (req, res) => {
  const location = req.query.location as string | undefined;

  if (!location) {
    res.status(400).json({ error: "Missing location in query" });
    return;
  }

  try {
    const latestEntry = await prisma.modelTrend.findFirst({
      where: { location },
      orderBy: {
        runTime: "desc",
      },
      select: {
        runTime: true,
      },
    });

    if (!latestEntry) {
      res
        .status(404)
        .json({ message: "No model data found for that location." });
      return;
    }

    res.status(200).json({ latestRunTime: latestEntry.runTime });
  } catch (error: any) {
    console.error("Error retrieving latest runTime:", error);
    res.status(500).json({ error: "Failed to retrieve latest runTime" });
  }
};
