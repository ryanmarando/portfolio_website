// scripts/fetchModelData.js
import axios from "axios";
import { API_URL } from "../src/lib/alertdict.js";

const run = async () => {
  try {
    const res = await axios.get(`${API_URL}/modelTrender`);
    console.log("Triggered modelTrender:", res.data);
  } catch (err) {
    console.error("Error triggering modelTrender:", err);
    process.exit(1);
  }
};

run();
