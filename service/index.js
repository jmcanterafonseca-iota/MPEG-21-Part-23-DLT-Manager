const express = require("express");
const app = express();
app.use(express.json());

require("dotenv").config();

const { GENERATION_SERVICE_PORT, GENERATION_SERVICE_LOG_LEVEL } = process.env;

const logger = require("tslog");
const appLogger = new logger.Logger({
    minLevel: parseInt(GENERATION_SERVICE_LOG_LEVEL ?? "1", 10)
});

const BASE_DIR = ".contracts";

const fs = require("fs");
const path = require("path");

if (!fs.existsSync(BASE_DIR)) {
    appLogger.error(`'${BASE_DIR}' folder does not exist`);
    process.exit(-1);
}

const MCO_FOLDER = "mco";
if (!fs.existsSync(path.join(BASE_DIR, MCO_FOLDER))) {
    appLogger.debug(`Creating ${MCO_FOLDER} folder inside ${BASE_DIR}`);
    fs.mkdirSync(path.join(BASE_DIR, MCO_FOLDER));
}

const TURTLE_FOLDER = "turtle";
if (!fs.existsSync(path.join(BASE_DIR, TURTLE_FOLDER))) {
    appLogger.debug(`Creating '${TURTLE_FOLDER}' folder inside ${BASE_DIR}`);
    fs.mkdirSync(path.join(BASE_DIR, TURTLE_FOLDER));
}

const ws = require("ws");
const wsServer = new ws.Server({ noServer: true });

// Web socket connections
const connections = {};

const APP_VERSION = "0.1.0";

const { generate } = require("./generation.js");

app.get("/health", (req, res) => {
    res.json({
        version: APP_VERSION,
        healthy: true,
    });
});

app.post("/generate-contract", (req, res) => {
    appLogger.debug(`Contract generation request ...`);
    const data = req.body;

    const options = data.options;
    if (!options || (!data.turtle?.value && !data.mediaContractualObjects) || !options.requestId) {
        res.sendStatus(400);
        return;
    }

    const requestId = options.requestId;
    const contractTemplate = options.contractTemplate ?? "default";

    const progressConnection = connections[requestId];
    setImmediate(async () => await generate(data, requestId, contractTemplate, progressConnection));

    res.sendStatus(202);
});

wsServer.on("connection", (ws, req) => {
    appLogger.debug("New connection:", req.url);

    const pathElements = req.url.split("/");
    const requestId = pathElements[pathElements.length - 1];

    if (!requestId) {
        ws.close();
        appLogger.error("No request Id has been supplied. WS closed");
        return;
    } 
    
    appLogger.debug("Request Id", requestId, "added to connections");

    connections[requestId] = ws;

    const closeFunction = (e) => {
      appLogger.debug("Connection closed for", requestId);
      connections[requestId] = undefined;
    };

    ws.onclose = closeFunction;
});

const httpServer = app.listen(GENERATION_SERVICE_PORT ?? 3000, () => {
    appLogger.debug(`IPR Contract Generator app listening on port ${GENERATION_SERVICE_PORT ?? 3000}`);
});

httpServer.on("upgrade", (req, socket, head) => {
    wsServer.handleUpgrade(req, socket, head, (ws) => {
        appLogger.debug("Websocket connection", req.url);

        if (req.url.startsWith("/progress/")) {
            wsServer.emit("connection", ws, req);
        } else {
            appLogger.error(`Websocket connection not allowed to '${req.url}'`);
            socket.destroy();
        }
    });
});

appLogger.debug(`Web socket connection has been set up`);

process.on("uncaughtException", (e) => {
    appLogger.error(`Process error: ${e}`);
});
