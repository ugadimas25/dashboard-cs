import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getAvailablePeriods, getDashboardData, getDashboardStats } from "./dashboard";
import { upload, uploadCSV } from "./upload";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Dashboard routes
  app.get("/api/dashboard/periods", getAvailablePeriods);
  app.get("/api/dashboard/data", getDashboardData);
  app.get("/api/dashboard/stats", getDashboardStats);
  
  // Upload route
  app.post("/api/dashboard/upload", upload.single('file'), uploadCSV);

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  return httpServer;
}
