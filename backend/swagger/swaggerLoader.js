import path from "path";
import { fileURLToPath } from "url";
import { readFileSync } from "fs";
import dotenv from "dotenv";
import yaml from "js-yaml";
import swaggerUi from "swagger-ui-express";
import { winstonLogger } from "../config/logger.js";

dotenv.config();

const HOST = process.env.HOST || "http://localhost";
const PORT = process.env.PORT || 3000;

const loadSwagger = (app) => {
  if (process.env.NODE_ENV !== "production") {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const filePath = path.join(__dirname, "..", "swagger", "swagger.yaml");

    try {
      const specsFile = readFileSync(filePath, "utf8");
      const swaggerDoc = yaml.load(specsFile);

      app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDoc));
      winstonLogger.info(`Serving the endpoint of Swagger UI at : ${HOST}:${PORT}/api-docs`);

    } catch (error) {
      winstonLogger.error(`Error loading the Swagger documentation file: ${error}`);
    }
  }
};

export default loadSwagger;