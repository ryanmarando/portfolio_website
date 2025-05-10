// scripts/fetchModelData.js
import { API_URL } from "../src/lib/alertdict.js";
const run = async () => {
    try {
        const res = await fetch(`${API_URL}/modelTrender`);
        console.log("Triggered modelTrender");
    }
    catch (err) {
        console.error("Error triggering modelTrender:", err);
        process.exit(1);
    }
};
run();
