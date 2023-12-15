const express = require("express");
const app = express();
app.use(express.json());

require("dotenv").config();

const logger = require("tslog");
const appLogger = new logger.Logger({
    minLevel: 1,
});

const fs = require("fs");

const { spawn } = require("child_process");

const { PORT } = process.env;

app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.post("/generate-contract", (req, res) => {
    appLogger.debug(`Contract generation request ...`);
    const data = req.body;

    const options = data.options;
    if (!options || (!data.turtle && !data.mediaContractualObjects)) {
        res.sendStatus(400);
        return;
    }

    const requestId = options.requestId;
    const contractTemplate = options.contractTemplate ?? "default";

    setImmediate(() => generate(data, requestId, contractTemplate));

    res.sendStatus(202);
});

app.listen(PORT, () => {
    appLogger.debug(`Example app listening on port ${PORT}`);
});

function generate(data, requestId, contractTemplate) {
    if (data.mediaContractualObjects) {
        return generateContract(data, requestId, contractTemplate);
    } else if (data.turtle) {
        return generateContractFromTurtle(data.turtle.value, requestId, contractTemplate);
    } else {
        throw new Error("Turtle nor MCO found on the data payload");
    }
}

function generateFromTurtle(turtleSpec, requestId, contractTemplate) {
  app.Logger.debug("Generation from Turtle file");

  // First of all we need to take the Turtle and transform to MCO
  const path = `.contracts/turtle/${requestId}-${Date.now()}.ttl`;
  fs.writeFileSync(path, turtleSpec);

  const mcoGeneratorCommand = `npx `;
}

function generateContract(mco, requestId, contractTemplate) {
    appLogger.debug(`Contract to be generated: '${mco.mediaContractualObjects.contracts[0].class}'`);
    appLogger.debug(`Contract template to use: '${contractTemplate}'`);
    appLogger.debug(`Request Id: '${requestId}'`);

    const path = `.contracts/mco/${requestId}-${Date.now()}.json`;

    fs.writeFileSync(path, JSON.stringify(mco));

    const generatorCommand = `MCO_JSON_FILE="service/${path}" CONTRACT_TEMPLATE=${contractTemplate} PRIVATE_KEYS_FILE="./private-keys.json" npx ts-node ./test/deploy-contract-koreny`;

    appLogger.debug(generatorCommand);

    const ls = spawn("sh", ["-c", generatorCommand], { cwd: ".." });

    ls.stdout.on("data", (data) => {
        console.log(`stdout: ${data}`);
    });

    ls.stderr.on("data", (data) => {
        console.error(`stderr: ${data}`);
    });
}

process.on("uncaughtException", (e) => {
    appLogger.error(`Process error: ${e}`);
});
