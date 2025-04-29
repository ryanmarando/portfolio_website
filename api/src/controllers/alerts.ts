import { RequestHandler } from "express";
import { NWS_API_BASE_URL } from "../config.js";
import {
  eventTypePriority,
  eventTypeColor,
  countiesInStateLibrary,
} from "../lib/alertdict.js";

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
  stringOutput: string;

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
    stringOutput: string;
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
    this.stringOutput = data.stringOutput;
  }
}

type UserData = {
  states: string;
  counties?: { [key: string]: string[] };
  alertTypes?: string;
  NWSoffices?: string;
};

let alertList: Alert[] = [];

export const getAlerts: RequestHandler = async (req, res) => {
  const { states, counties, alertTypes, NWSoffices } = req.body;

  // Validate that required parameters are provided
  if (!states) {
    res.status(400).json("Please enter a state to find alerts.");
    return;
  }

  // Structure the userData object from the request body
  const userData: UserData = {
    states,
    counties,
    alertTypes,
    NWSoffices,
  };

  // Get all active alerts based on the user data
  await getAllActiveAlerts(userData);

  // Check if there are any active alerts
  if (alertList.length === 0) {
    res.status(200).json("No alerts all clear!");
    return;
  }

  // Return the filtered alerts as a response
  res.status(200).json(alertList);
  return;
};

const getAllActiveAlerts = async (userData: UserData): Promise<void> => {
  alertList = [];

  try {
    // Loop through each state in the states array
    const states = userData.states.split(","); // Split by commas in case multiple states are provided

    // Iterate over each state
    for (let state of states) {
      // Make a request for each state's alerts
      const response = await fetch(
        `${NWS_API_BASE_URL}/alerts/active?area=${state}`
      );

      if (!response.ok) {
        console.error(`HTTP error for state ${state}: ${response.status}`);
        continue; // Continue to the next state if this request fails
      }

      // Get the alert data for this specific state
      const alertData = await response.json();

      // Call the function to append and filter alerts for this state
      await appendAndFilterAllAlerts(userData, alertData, state);
    }

    return;
  } catch (error) {
    console.error("Error fetching alerts:", error);
  }
};

const appendAndFilterAllAlerts = async (
  userData: UserData,
  alertData: any,
  state: string
) => {
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
        priority: getEventPriority(props.event),
        color: getEventColor(props.event),
        senderName: props.senderName,
        stringOutput: formatStringOutput(
          props.event,
          props.ends,
          props.expires
        ),
      });
    });

    if (userData.counties) {
      const filteredCountyAlerts = await filterAlertsByCounty(userData, state);
      alertList = filteredCountyAlerts;
    }

    if (userData.alertTypes) {
      const filteredAlertsByType = await filterAlertsByType(userData);
      alertList = filteredAlertsByType;
    }

    if (userData.NWSoffices) {
      const filteredAlertsByOffice = await filterAlertsByOffice(userData);
      alertList = filteredAlertsByOffice;
    }
  }
};

const getEventPriority = (event: string): number => {
  return eventTypePriority[event];
};

const getEventColor = (event: string): string => {
  return eventTypeColor[event];
};

const filterAlertsByCounty = async (
  userData: UserData,
  state: string
): Promise<Alert[]> => {
  if (!userData.counties) {
    return []; // No counties provided
  }

  const normalizeCounty = (county: string) => county.trim().toLowerCase();
  const userStateCounties = userData.counties[state];

  const userCountiesNormalized = userStateCounties.map((county) =>
    normalizeCounty(county)
  );

  console.log(
    `Checking these counties for state ${state}:`,
    userCountiesNormalized
  );

  const filteredAlerts = alertList.filter((alert) => {
    const alertAreaCounties = alert.areaDesc.split(";").map((c) => c.trim());

    // Normalize and filter counties
    const alertAreaCountiesNormalized = alertAreaCounties.map((county) =>
      normalizeCounty(county)
    );

    const matchingCounties = alertAreaCountiesNormalized.filter((county) =>
      userCountiesNormalized.includes(county)
    );

    if (matchingCounties.length > 0) {
      // Only include the matching counties in the areaDesc
      alert.areaDesc = matchingCounties.join("; ");
      return true;
    }

    return false;
  });

  return filteredAlerts;
};

const filterAlertsByType = async (userData: UserData): Promise<Alert[]> => {
  if (!userData.alertTypes) {
    return alertList; // If no alert types are provided, return the full list
  }

  // Split the user's alertTypes and remove extra spaces
  const userAlertTypes = userData.alertTypes.split(",").map((t) => t.trim());

  console.log("User alert types:", userAlertTypes);

  // Filter alerts: must match exactly any of the user-specified types
  const filteredAlerts = alertList.filter((alert) => {
    const alertEvent = alert.event.trim(); // Remove extra spaces if necessary
    return userAlertTypes.includes(alertEvent); // strict match only
  });

  return filteredAlerts;
};

const filterAlertsByOffice = async (userData: UserData): Promise<Alert[]> => {
  if (!userData.NWSoffices) {
    return []; // Return empty array if no NWS offices are provided
  }

  // Split the user's NWS offices and trim any extra spaces
  const userOffices = userData.NWSoffices.split(",").map((office) =>
    office.trim()
  );

  console.log("Checking these NWS offices:", userOffices);

  // Filter alerts: must match exactly any of the user-specified NWS offices
  const filteredAlerts = alertList.filter((alert) => {
    const alertSender = alert.senderName.trim(); // Get senderName and trim extra spaces

    // Check if any of the user's NWS offices match the senderName of the alert
    return userOffices.includes(alertSender);
  });

  return filteredAlerts;
};

const formatStringOutput = (
  event: string,
  ends: string,
  expires: string
): string => {
  if (ends) {
    const endFormatted = formatKitchenTime(ends);
    return `${event} until ${endFormatted}`;
  } else {
    const expiresFormatted = formatKitchenTime(expires);
    return `${event} expires ${expiresFormatted}`;
  }
};

const formatKitchenTime = (timestamp: string): string => {
  const date = new Date(timestamp);

  const options: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  };

  const timePart = date.toLocaleTimeString("en-US", options);
  const datePart = `${date.getMonth() + 1}/${date.getDate()}/${date
    .getFullYear()
    .toString()
    .slice(-2)}`;

  return `${timePart} ${datePart}`;
};
