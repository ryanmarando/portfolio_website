import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
export const prisma = new PrismaClient();
export const NWS_API_BASE_URL = "https://api.weather.gov";
dotenv.config();
