import { RequestHandler } from "express";
import { NWS_API_BASE_URL } from "../config.js";

interface TemperatureReading {
  validTime: string;
  value: number;
}

interface TemperatureData {
  uom: string;
  values: TemperatureReading[];
}

export const getWBGT: RequestHandler = async (req, res): Promise<void> => {
  const lat = typeof req.query.lat === "string" ? req.query.lat : null;
  const long = typeof req.query.long === "string" ? req.query.long : null;

  if (!lat || !long) {
    res.status(400).json({ error: "Missing lat or long query parameters" });
    return;
  }

  try {
    const response = await fetch(`${NWS_API_BASE_URL}/points/${lat},${long}`);
    if (!response.ok) {
      console.error(`HTTP error: ${response.status}`);
      res
        .status(500)
        .json({ error: `Point fetch failed with ${response.status}` });
      return;
    }

    const stationData = await response.json();
    const forecastGridUrl = stationData?.properties?.forecastGridData;
    if (!forecastGridUrl) {
      res.status(500).json({ error: "Missing forecastGridData URL" });
      return;
    }

    const stationForecastGridDataResponse = await fetch(forecastGridUrl);
    if (!stationForecastGridDataResponse.ok) {
      console.error(`HTTP error: ${stationForecastGridDataResponse.status}`);
      res.status(500).json({
        error: `Grid data fetch failed with ${stationForecastGridDataResponse.status}`,
      });
      return;
    }

    const stationForecastGridData =
      await stationForecastGridDataResponse.json();
    const wbgtForecast =
      stationForecastGridData?.properties?.wetBulbGlobeTemperature;

    if (!wbgtForecast) {
      res.status(500).json({ error: "No WBGT data found" });
      return;
    }

    const formattedWBGTForecast = convertCelsiusToFahrenheit(wbgtForecast);

    res.status(200).json(formattedWBGTForecast);
    return;
  } catch (error) {
    console.error("Unhandled error:", error);
    res.status(500).json({ error: "Internal server error" });
    return;
  }
};

const convertCelsiusToFahrenheit = (
  data: TemperatureData
): TemperatureReading[] => {
  return data.values.map((reading) => ({
    validTime: reading.validTime,
    value: +((reading.value * 9) / 5 + 32).toFixed(2), // rounded to 2 decimal places
  }));
};
