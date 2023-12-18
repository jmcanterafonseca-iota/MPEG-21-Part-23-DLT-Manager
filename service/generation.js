const fs = require("fs");
const { spawn } = require("child_process");

const logger = require("tslog");
const appLogger = new logger.Logger({
    minLevel: process.env.GENERATION_SERVICE_LOG_LEVEL ?? 1,
});

const { getContractFromMCO } = require("mco-parser");

async function generate(data, requestId, contractTemplate, progressConnection) {
    if (data.mediaContractualObjects) {
        return generateContract(data, requestId, contractTemplate, progressConnection);
    } else if (data.turtle?.value) {
        await generateFromTurtle(data.turtle.value, requestId, contractTemplate, progressConnection);
    } else {
        throw new Error("Turtle nor MCO found on the data payload");
    }
}

// generates and creates and contract from turtle specification
async function generateFromTurtle(turtleSpec, requestId, contractTemplate, progressConnection) {
    appLogger.debug("Generation from Turtle file");
    appLogger.debug(`Contract template to use: '${contractTemplate}'`);
    appLogger.debug(`Request Id: '${requestId}'`);

    const baseFile = `${requestId}-${Date.now()}`;

    // First of all we need to take the Turtle and transform to MCO
    const path = `.contracts/turtle/${baseFile}.ttl`;
    fs.writeFileSync(path, turtleSpec);

    const outputDir = `service/.contracts/mco`;
    const mcoFileName = `${baseFile}-mco.json`;

    const ttl = fs.readFileSync(path, "utf-8");
    appLogger.debug("Generating MCO from turtle");

    if (progressConnection) {
        progressConnection.send("Generating MCO ...");
    }

    try {
        const mco = await getContractFromMCO(ttl);

        fs.writeFileSync(path.join(outputDir, mcoFileName), JSON.stringify(mco));
    } catch (e) {
        appLogger.error("There was an error generating the MCO objects", e);

        progressConnection.send("<error>");
        progressConnection.send(e);
        progressConnection.send("</error>");

        return -1;
    }

    if (progressConnection) {
        progressConnection.send("MCO generated");
    }

    appLogger.debug("MCO JSON generated and written to file");

    appLogger.debug("Now generating the contract and writing it to the Ledger");
    generateFromMcoFile(mcoFileName, requestId, contractTemplate, progressConnection);
}

// Generates a contract from the MCO JSON Object
function generateContract(mco, requestId, contractTemplate, progressConnection) {
    appLogger.debug(`Contract to be generated: '${mco.mediaContractualObjects.contracts[0].class}'`);
    appLogger.debug(`Contract template to use: '${contractTemplate}'`);
    appLogger.debug(`Request Id: '${requestId}'`);

    const fileName = `${requestId}-${Date.now()}.json`;
    const path = `.contracts/mco/${fileName}`;

    fs.writeFileSync(path, JSON.stringify(mco));

    generateFromMcoFile(fileName, requestId, contractTemplate, progressConnection);
}

// Function that generates and writes the contract from MCO already written file
function generateFromMcoFile(fileName, requestId, contractTemplate, progressConnection) {
    const path = `.contracts/mco/${fileName}`;

    const generatorCommand = `MCO_JSON_FILE="service/${path}" CONTRACT_TEMPLATE=${contractTemplate} PRIVATE_KEYS_FILE="./private-keys.json" npx ts-node ./test/deploy-contract-koreny`;

    appLogger.debug("Contract gen command", generatorCommand);

    const ps = spawn("sh", ["-c", generatorCommand], { cwd: ".." });

    ps.stdout.on("data", (data) => {
        if (progressConnection) {
            progressConnection.send(`${data}`);
        }
        console.log(`stdout: ${data}`);
    });

    ps.stderr.on("data", (data) => {
        if (progressConnection) {
            progressConnection.send("<error>");
            progressConnection.send(`${data}`);
            progressConnection.send("</error>");
        }
        console.error(`stderr: ${data}`);
    });

    ps.on("close", (code) => {
        appLogger.debug(`Contract creation process exited with code ${code}`);
        if (progressConnection) {
            if (code === 0) {
                progressConnection.send("<success/>");
            }
        }
    });
}

module.exports.generate = generate;
