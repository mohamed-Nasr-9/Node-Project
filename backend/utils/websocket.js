import { WebSocketServer } from "ws";
import { winstonLogger } from "../config/logger.js";

let wss;
export function wssInit(server) {
    wss = new WebSocketServer({ server });

    wss.on("connection", (ws) => {
        winstonLogger.info("A new client connected.");

        ws.send(JSON.stringify({
            type: "WELCOME",
            message: "Hi everyone, welcome from our server"
        }));

        ws.on("close", () => {
            winstonLogger.info("Client disconnected.");
        });

        ws.on("error", (error) => {
            winstonLogger.error("WebSocket Error:", error);
        });
    });

    winstonLogger.info("WebSocket server initialized.");
};

export function wssBroadcast(data) {
    if (!wss) {
        winstonLogger.error("WebSocket server not initialized. Cannot broadcast.");
        return;
    }

    const message = JSON.stringify(data);
    winstonLogger.info(`Broadcasting message to ${wss.clients.size} clients: ${message}`);

    wss.clients.forEach(client => {
        if (client.readyState === client.OPEN) {
            client.send(message);
        }
    });
};
