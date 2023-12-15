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

function usage() {
    console.error(
        "Usage: MCO_JSON_FILE='<mco_def_file.json>' PRIVATE_KEYS_FILE='<private_keys_file.json>' TEST_ADDR='<0x1234...>' CONTRACT_TEMPLATE='cascade|default' deploy-contract-koreny"
    );

    process.exit(-1);
}

let provider;
let mco;
let contractTemplate = devContractArtifact;
let walletService;
let ipfsGatewayUrl;
let chainId;

const {
    IOTA_WASP_MNEMONIC,
    IOTA_EVM_ENDPOINT_URL,
    IOTA_WASP_CHAIN_ID,
    IPFS_GATEWAY_URL,
    NFT_SMART_CONTRACT_ADDR,
    ERC20_TOKEN_SMART_CONTRACT_ADDR,
} = process.env;

const { MCO_JSON_FILE, PRIVATE_KEYS_FILE, TEST_ADDR, CONTRACT_TEMPLATE } = process.env;

function prepare() {
    const phrase = IOTA_WASP_MNEMONIC;
    const providerUrl = IOTA_EVM_ENDPOINT_URL;
    chainId = IOTA_WASP_CHAIN_ID;
    ipfsGatewayUrl = IPFS_GATEWAY_URL;

    if (!MCO_JSON_FILE) {
        usage();
    }
    mco = JSON.parse(fs.readFileSync(MCO_JSON_FILE));

    if (CONTRACT_TEMPLATE) {
        if (CONTRACT_TEMPLATE !== "cascade" && CONTRACT_TEMPLATE !== "default") {
            usage();
        }

        if (CONTRACT_TEMPLATE === "cascade") {
            contractTemplate = devContractArtifact2;
        }
    }

    walletService = new WalletService(process.env.WALLET_SERVICE_URL, process.env.WALLET_SERVICE_TOKEN);

    let privateKeys = [];

    if (PRIVATE_KEYS_FILE) {
        try {
            const content = fs.readFileSync(PRIVATE_KEYS_FILE);
            privateKeys = JSON.parse(content);
        } catch {
            console.warn("No private keys supplied. Using mnemonic phrase");
        }
    }

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
}

const generate = (mco) => {
    return generateSmartContractSpecification(mco.mediaContractualObjects.contracts[0]);
};

const deploy = async (smartContractSpecification, ipfs) => {
    const deployer = new EthereumDeployer(provider, ipfs, chainId, contractTemplate);

    deployer.setMediaSC(smartContractSpecification);

    deployer.setWalletService(walletService);

    await deployer.setMainAddressIndex(0);

    await deployer.fetchEvmAccountForParties();

    if (NFT_SMART_CONTRACT_ADDR) {
        deployer.setNFTokenContractAddress(NFT_SMART_CONTRACT_ADDR);
    }
    if (ERC20_TOKEN_SMART_CONTRACT_ADDR) {
        deployer.setERC20TokenContractAddress(ERC20_TOKEN_SMART_CONTRACT_ADDR);
    }

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
    prepare();

    const smartContractSpecification = generate(mco);
    const ipfs = new OffChainStorage(ipfsGatewayUrl);
    await ipfs.start();
    let address = await deploy(smartContractSpecification, ipfs);
    res = await parse(address, ipfs);
    await ipfs.stop();
    console.log(res);

    console.log("Smart Contract address: ", address);
};

main();
