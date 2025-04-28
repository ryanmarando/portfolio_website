import { RequestHandler } from "express";
import { prisma } from "../config.js";
import { NWS_API_BASE_URL } from "../config.js";

class Alert {
  id: string;
  areaDesc: string;
  event: string;
  effective: string;
  ends: string;
  expires: string;
  headline: string;
  description: string;
  priority: number;
  color: string;
  senderName: string;

  constructor(data: {
    id: string;
    areaDesc: string;
    event: string;
    effective: string;
    ends: string;
    expires: string;
    headline: string;
    description: string;
    priority: number;
    color: string;
    senderName: string;
  }) {
    this.id = data.id;
    this.areaDesc = data.areaDesc;
    this.event = data.event;
    this.effective = data.effective;
    this.ends = data.ends;
    this.expires = data.expires;
    this.headline = data.headline;
    this.description = data.description;
    this.priority = data.priority;
    this.color = data.color;
    this.senderName = data.senderName;
  }
}

type UserData = {
  states: string;
  counties: string;
  alertTypes: string;
  NWSoffices: string;
};

let alertList: Alert[] = [];

export const getAlerts: RequestHandler = async (req, res) => {
  const states = typeof req.query.states === "string" ? req.query.states : "";
  const counties =
    typeof req.query.counties === "string" ? req.query.counties : "";
  const alertTypes =
    typeof req.query.alertTypes === "string"
      ? decodeURIComponent(req.query.alertTypes)
      : "";

  const NWSoffices =
    typeof req.query.NWSoffices === "string"
      ? decodeURIComponent(req.query.NWSoffices)
      : "";

  const userData: UserData = {
    states,
    counties,
    alertTypes,
    NWSoffices,
  };

  await getAllActiveAlerts(userData);

  if (alertList.length === 0) {
    res.status(500).json("No alerts all clear!");
  }

  res.status(200).json(alertList);
  return;
};

const getAllActiveAlerts = async (userData: UserData): Promise<void> => {
  alertList = [];
  try {
    const response = await fetch(
      `${NWS_API_BASE_URL}/alerts/active?area=${userData.states}`
    );

    if (!response.ok) {
      console.error(`HTTP error: ${response.status}`);
      return;
    }

    const alertData = await response.json();

    await appendAndFilterAllAlerts(userData, alertData);

    return;
  } catch (error) {
    console.error(error);
  }
};

const appendAndFilterAllAlerts = async (userData: UserData, alertData: any) => {
  if (alertData) {
    const raw_alert_list = alertData["features"];

    alertList = raw_alert_list.map((feature: any) => {
      const props = feature.properties;
      return new Alert({
        id: props.id,
        areaDesc: props.areaDesc,
        event: props.event,
        effective: props.effective,
        ends: props.ends,
        expires: props.expires,
        headline: props.headline,
        description: props.description,
        priority: props.priority,
        color: props.color,
        senderName: props.senderName,
      });
    });

    const filteredCountyAlerts = await filterAlertsByCounty(userData);
    alertList = filteredCountyAlerts;

    const filteredAlertsByType = await filterAlertsByType(userData);
    alertList = filteredAlertsByType;

    const filteredAlertsByOffice = await filterAlertsByOffice(userData);
    alertList = filteredAlertsByOffice;

    //console.log("Alerts:", alertList); // ✅ list of alert types
  }
};

const filterAlertsByCounty = async (userData: UserData): Promise<Alert[]> => {
  if (!userData.counties) {
    return []; // Return empty array if no counties are provided
  }

  // Split and normalize the counties provided by the user
  const userCounties = userData.counties
    .split(",")
    .map((c) => c.trim().toLowerCase());

  console.log("Checking these counties:", userCounties);

  // Filter alerts based on whether any of the user's counties are found in the alert's areaDesc
  const filteredAlerts = alertList.filter((alert) => {
    const alertAreaDesc = alert.areaDesc.toLowerCase(); // Normalize to lowercase

    // Check if any of the user's counties match the area description of the alert
    return userCounties.some((county) => alertAreaDesc.includes(county));
  });

  return filteredAlerts;
};

const filterAlertsByType = async (userData: UserData): Promise<Alert[]> => {
  if (!userData.alertTypes) {
    return alertList; // If no alert types are provided, return the full list
  }

  // Split and normalize the types provided by the user
  const userAlertTypes = userData.alertTypes
    .split(",")
    .map((t) => t.trim().toLowerCase());

  console.log("User alert types:", userAlertTypes);

  // Filter the alerts based on whether the event matches any of the user's alert types
  const filteredAlerts = alertList.filter((alert) => {
    const alertEvent = alert.event.toLowerCase(); // Normalize the event type to lowercase

    // Check if the event matches any of the user's alert types
    return userAlertTypes.some((type) => alertEvent.includes(type));
  });

  console.log("Filtered alerts by type:", filteredAlerts);

  return filteredAlerts;
};

const filterAlertsByOffice = async (userData: UserData): Promise<Alert[]> => {
  if (!userData.NWSoffices) {
    return []; // Return empty array if no NWS offices are provided
  }

  // Split and normalize the NWS offices provided by the user
  const userOffices = userData.NWSoffices.split(",").map((office) =>
    office.trim().toLowerCase()
  );

  console.log("Checking these NWS offices:", userOffices);

  // Filter the alerts based on whether the senderName matches the user's NWS offices
  const filteredAlerts = alertList.filter((alert) => {
    const alertSender = alert.senderName.toLowerCase(); // Normalize the senderName to lowercase

    // Check if any of the user's NWS offices match the senderName of the alert
    return userOffices.some((office) => alertSender.includes(office));
  });

  return filteredAlerts;
};
