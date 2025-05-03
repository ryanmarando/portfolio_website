import { NWS_API_BASE_URL } from "../config.js";
import { eventTypePriority, eventTypeColor, countiesInStateLibrary, } from "../lib/alertdict.js";
class Alert {
    id;
    areaDesc;
    event;
    effective;
    ends;
    expires;
    headline;
    description;
    priority;
    color;
    senderName;
    stringOutput;
    constructor(data) {
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
let alertList = [];
export const getAlerts = async (req, res) => {
    const { states, counties, alertTypes, NWSoffices } = req.body;
    console.log(req.body);
    // Validate that required parameters are provided
    if (!states) {
        res.status(400).json("Please enter a state to find alerts.");
        return;
    }
    // Structure the userData object from the request body
    const userData = {
        states,
        counties,
        alertTypes,
        NWSoffices,
    };
    // Get all active alerts based on the user data
    await getAllActiveAlerts(userData);
    // Return the filtered alerts as a response
    res.status(200).json(alertList);
    //console.log("done");
    return;
};
const getAllActiveAlerts = async (userData) => {
    alertList = [];
    try {
        // Loop through each state in the states array
        const states = userData.states.split(","); // Split by commas in case multiple states are provided
        // Iterate over each state
        for (let state of states) {
            // Make a request for each state's alerts
            const response = await fetch(`${NWS_API_BASE_URL}/alerts/active?area=${state}`);
            if (!response.ok) {
                console.error(`HTTP error for state ${state}: ${response.status}`);
                continue; // Continue to the next state if this request fails
            }
            // Get the alert data for this specific state
            const alertData = await response.json();
            // Skip if no alerts for that state
            if (alertData["features"].length === 0) {
                continue;
            }
            // Call the function to append and filter alerts for this state
            await appendAndFilterAllAlerts(userData, alertData["features"], state);
            //console.log(state, ":", alertList.length);
        }
        const uniqueById = new Map();
        alertList.forEach((alert) => uniqueById.set(alert.id, alert));
        alertList = Array.from(uniqueById.values());
        return;
    }
    catch (error) {
        console.error("Error fetching alerts:", error);
    }
};
const appendAndFilterAllAlerts = async (userData, alertData, state) => {
    // Filter by county first, remove ones not matching
    if (userData.counties && userData.counties?.[state]?.length > 0) {
        const userCounties = userData.counties[state].map((c) => c
            .trim()
            .toLowerCase()
            .replace(/,\s*\w{2}$/, ""));
        for (let i = alertData.length - 1; i >= 0; i--) {
            const feature = alertData[i];
            const rawAreaDescs = feature.properties.areaDesc.split(";");
            const normalizedAreaDescs = rawAreaDescs.map((c) => c
                .trim()
                .toLowerCase()
                .replace(/,\s*\w{2}$/, ""));
            // Match normalized alert counties against normalized user counties
            const matchingCounties = normalizedAreaDescs
                .map((normalizedCounty, index) => {
                if (userCounties.includes(normalizedCounty)) {
                    return rawAreaDescs[index].trim(); // Use original string for display
                }
                return null;
            })
                .filter((c) => c !== null);
            if (matchingCounties.length === 0) {
                alertData.splice(i, 1); // Remove alert if no counties match
            }
            else {
                // Deduplicate and update areaDesc
                const uniqueMatchingCounties = Array.from(new Set(matchingCounties));
                feature.properties.areaDesc = uniqueMatchingCounties.join("; ");
            }
        }
    }
    // Filter by alert type
    if (userData.alertTypes && userData.alertTypes?.length > 0) {
        const alertTypes = userData.alertTypes.map((t) => t.trim());
        for (let i = alertData.length - 1; i >= 0; i--) {
            const event = alertData[i].properties.event.trim();
            if (!alertTypes.includes(event)) {
                alertData.splice(i, 1);
            }
        }
    }
    // Filter by NWS office
    if (userData.NWSoffices && userData.NWSoffices?.length > 0) {
        const nwsOffices = userData.NWSoffices.map((o) => o.trim());
        for (let i = alertData.length - 1; i >= 0; i--) {
            const sender = alertData[i].properties.senderName.trim();
            if (!nwsOffices.includes(sender)) {
                alertData.splice(i, 1);
            }
        }
    }
    // Convert remaining alerts to Alert objects and append
    alertList = alertList.concat(alertData.map((feature) => {
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
            stringOutput: formatStringOutput(props.event, props.ends, props.expires),
        });
    }));
};
const getEventPriority = (event) => {
    return eventTypePriority[event];
};
const getEventColor = (event) => {
    return eventTypeColor[event];
};
const formatStringOutput = (event, ends, expires) => {
    if (ends) {
        const endFormatted = formatKitchenTime(ends);
        return `${event} until ${endFormatted}`;
    }
    else {
        const expiresFormatted = formatKitchenTime(expires);
        return `${event} expires ${expiresFormatted}`;
    }
};
const formatKitchenTime = (timestamp) => {
    const date = new Date(timestamp);
    const options = {
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
export const getCountiesByState = async (req, res) => {
    const state = req.query.state;
    const countyList = countiesInStateLibrary[state] || [];
    if (countyList) {
        res.status(200).json(countyList);
    }
    else {
        res.status(400).json("Error fetching counties");
    }
    return;
};
