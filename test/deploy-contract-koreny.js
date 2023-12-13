const { generateSmartContractSpecification, EthereumDeployer, EthereumParser, WalletService } = require("../src");
const { OffChainStorage } = require("mco-parser");

const HDWalletProvider = require("@truffle/hdwallet-provider");
const fs = require("fs");
const Web3 = require("web3");

const devContractArtifact = require("../smart-contract-templates/build/contracts/Contract.json");
const devContractArtifact2 = require("../smart-contract-templates/build/contracts/Contract2.json");


// Create a `.env` file containing these informations:
//IOTA_WASP_MNEMONIC="angle ...... meadow cereal"
//IOTA_EVM_ENDPOINT_URL="http://localhost"
require("dotenv").config();

const phrase = process.env.IOTA_WASP_MNEMONIC;

const providerUrl = process.env.IOTA_EVM_ENDPOINT_URL;

const chainId = process.env.IOTA_WASP_CHAIN_ID;
const ipfsGatewayUrl = process.env.IPFS_GATEWAY_URL;

const { MCO_JSON_FILE, PRIVATE_KEYS_FILE, TEST_ADDR, CONTRACT_TEMPLATE } = process.env;

let contractTemplate = devContractArtifact;

if (CONTRACT_TEMPLATE) {
    if (CONTRACT_TEMPLATE === "cascade") {
        contractTemplate = devContractArtifact2;
    }
}

function usage() {
    console.error(
        "Usage: MCO_JSON_FILE='<mco_def_file.json>' PRIVATE_KEYS_FILE='<private_keys_file.json>' TEST_ADDR='<0x1234...>' CONTRACT_TEMPLATE='cascade|default' deploy-contract-koreny"
    );

    process.exit(-1);
}

if (!MCO_JSON_FILE) {
    usage();
}

const mco = JSON.parse(fs.readFileSync(MCO_JSON_FILE));

const generate = () => {
    return generateSmartContractSpecification(mco.mediaContractualObjects.contracts[0]);
};

const walletService = new WalletService(process.env.WALLET_SERVICE_URL, process.env.WALLET_SERVICE_TOKEN);

let privateKeys = [];

if (PRIVATE_KEYS_FILE) {
    try {
        const content = fs.readFileSync(PRIVATE_KEYS_FILE);
        privateKeys = JSON.parse(content);
    } catch {
        console.warn("No private keys supplied. Using mnemonic phrase");
    }
}

let provider;

if (privateKeys.length === 0) {
    if (!phrase) {
        console.error("No private keys not mnemonic has been supplied!!!");
        process.exit(-1);
    }
    provider = new HDWalletProvider({
        mnemonic: {
            phrase,
        },
        providerOrUrl: providerUrl,
    });
} else {
    provider = new HDWalletProvider({
        privateKeys,
        providerOrUrl: providerUrl,
    });

    console.log("Using private key file. Addresses: ", provider.getAddresses());
}

const deploy = async (smartContractSpecification, ipfs) => {
    const deployer = new EthereumDeployer(provider, ipfs, chainId, contractTemplate);

    deployer.setMediaSC(smartContractSpecification);

    deployer.setWalletService(walletService);

    await deployer.setMainAddressIndex(0);

    await deployer.fetchEvmAccountForParties();

    const res = await deployer.deploySmartContracts();

    const mainAddress = provider.getAddresses()[0];
    // on behalf of the main address the Smart Contract can send tokens
    await deployer.approveToSendTokens(mainAddress, new Web3.utils.BN("900000000000000000000"));

    const addressToPay = TEST_ADDR;
    if (addressToPay && CONTRACT_TEMPLATE !== "cascade") {
        const web3Provider = new Web3(providerUrl);
        if (web3Provider.utils.isAddress(addressToPay)) {
            // sender, destination, amount
            const amount = 1000;
            console.log("Sending %d to %s", amount, addressToPay);
            await deployer.payTo(mainAddress, addressToPay, 1000);
        }
    }

    provider.engine.stop();
    return res.options.address;
};

const parse = async (address, ipfs) => {
    const pars = new EthereumParser(provider, ipfs, address, chainId, contractTemplate);
    let res = await pars.parseSmartContract();
    provider.engine.stop();
    return res;
};

const main = async () => {
    const smartContractSpecification = generate();
    const ipfs = new OffChainStorage(ipfsGatewayUrl);
    await ipfs.start();
    let address = await deploy(smartContractSpecification, ipfs);
    res = await parse(address, ipfs);
    await ipfs.stop();
    console.log(res);

    console.log("Smart Contract address: ", address);
};

main();
