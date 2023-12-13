const { generateSmartContractSpecification, EthereumDeployer, EthereumParser, WalletService } = require("../src");
const { OffChainStorage } = require("mco-parser");

const HDWalletProvider = require("@truffle/hdwallet-provider");
const fs = require("fs");
const Web3 = require("web3");

// Create a `.env` file containing these informations:
//IOTA_WASP_MNEMONIC="angle ...... meadow cereal"
//IOTA_EVM_ENDPOINT_URL="http://localhost"
require("dotenv").config();

const phrase = process.env.IOTA_WASP_MNEMONIC;

const providerUrl = process.env.IOTA_EVM_ENDPOINT_URL;

const chainId = process.env.IOTA_WASP_CHAIN_ID;
const ipfsGatewayUrl = process.env.IPFS_GATEWAY_URL;

if (process.argv.length < 3) {
    console.error(
        "Parameters: 1. contract's MCO representation (.json).(Mandatory). 2. Private keys (.json).(optional) 3. Test Address (0x..) to pay.(optional)"
    );
    process.exit(-1);
}

const mco = JSON.parse(fs.readFileSync(process.argv[2]));

const generate = () => {
    return generateSmartContractSpecification(mco.mediaContractualObjects.contracts[0]);
};

const walletService = new WalletService(process.env.WALLET_SERVICE_URL, process.env.WALLET_SERVICE_TOKEN);

let privateKeys = [];
let optionalAddrPresentIndex = -1;

if (process.argv[3]) {
    try {
        const content = fs.readFileSync(process.argv[3]);
        privateKeys = JSON.parse(content);
        optionalAddrPresentIndex = 4;
    } catch {
        console.warn("No private keys supplied. Using mnemonic phrase");
        optionalAddrPresentIndex = 3;
    }
}

let provider;

if (privateKeys.length === 0) {
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
    const deployer = new EthereumDeployer(provider, ipfs, chainId);

    deployer.setMediaSC(smartContractSpecification);

    deployer.setWalletService(walletService);

    await deployer.setMainAddressIndex(0);

    await deployer.fetchEvmAccountForParties();

    const res = await deployer.deploySmartContracts();

    const mainAddress = provider.getAddresses()[0];
    // on behalf of the main address the Smart Contract can send tokens
    await deployer.approveToSendTokens(mainAddress, 10000);

    if (optionalAddrPresentIndex !== -1) {
        const addressToPay = process.argv[optionalAddrPresentIndex];
        if (addressToPay) {
            const web3Provider = new Web3(providerUrl);
            if (web3Provider.utils.isAddress(addressToPay)) {
                // sender, destination, amount
                const amount = 1000;
                console.log("Sending %d to %s", amount, addressToPay);
                await deployer.payTo(mainAddress, addressToPay, 1000);
            }
        }
    }

    provider.engine.stop();
    return res.options.address;
};

const parse = async (address, ipfs) => {
    const pars = new EthereumParser(provider, ipfs, address, chainId);
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
};

main();
