const {
  generateSmartContractSpecification,
  obtainSmartContractSpecification,
  EthereumDeployer,
  EthereumParser,
} = require('../src');
const { OffChainStorage } = require('mco-parser');

const HDWalletProvider = require('@truffle/hdwallet-provider');
const fs = require('fs');

// Create a `.env` file containing these informations:
//IOTA_WASP_MNEMONIC="angle ...... meadow cereal"
//IOTA_WASP_CHAIN="tst1pq6hayf.....6pw6mcvre74jzhu4qde"
//IOTA_WASP_CHAIN_ID="1075"
//IOTA_WASP_URL="http://localhost"
require('dotenv').config();

const phrase = process.env.IOTA_WASP_MNEMONIC;
const url = process.env.IOTA_WASP_URL;
const chain = process.env.IOTA_WASP_CHAIN;
const chainId = process.env.IOTA_WASP_CHAIN_ID;
const providerOrUrl = `${url}/wasp/api/v1/chains/${chain}/evm`;
const mco = require('./example.json');
const bindings = require('./bindings.json');
const bindings2 = require('./bindings2.json');
const ttlPath = './mechanical-license.ttl';

const generate = () => {
  return generateSmartContractSpecification(mco);
};

const deploy = async (smartContractSpecification, ipfs) => {
  const provider = new HDWalletProvider({
    mnemonic: {
      phrase,
    },
    providerOrUrl,
  });
  const deployer = new EthereumDeployer(provider, ipfs, chainId);

  deployer.setMediaSC(smartContractSpecification);
  deployer.setPartiesBindings(bindings);

  await deployer.setMainAddressIndex(0);
  const res = await deployer.deploySmartContracts();
  provider.engine.stop();
  return res.options.address;
};

const parse = async (address, ipfs) => {
  const provider = new HDWalletProvider({
    mnemonic: {
      phrase,
    },
    providerOrUrl,
  });
  const pars = new EthereumParser(
    provider,
    // 'http://127.0.0.1:8545'
    ipfs,
    address,
    chainId
  );
  let res = await pars.parseSmartContract();
  provider.engine.stop();
  return res;
};

const main = async () => {
  const smartContractSpecification = generate();
  const ipfs = new OffChainStorage();
  await ipfs.start();
  let address = await deploy(smartContractSpecification, ipfs);
  res = await parse(address, ipfs);
  await ipfs.stop();
  console.log(res);
};

const obtain = async (ttl, ipfs) => {
  const provider = new HDWalletProvider({
    mnemonic: {
      phrase,
    },
    providerOrUrl,
  });
  const deployer = new EthereumDeployer(provider, ipfs, chainId);
  await deployer.setMainAddressIndex(0);

  const spec = await obtainSmartContractSpecification(ttl, ipfs, deployer);

  deployer.setMediaSC(spec.specification);
  deployer.setPartiesBindings(bindings2);

  const res = await deployer.deploySmartContractsReserved();
  provider.engine.stop();
  return res.options.address;
};

const main2 = async () => {
  const ttl = fs.readFileSync(ttlPath, 'utf-8');

  const ipfs = new OffChainStorage();
  await ipfs.start();
  let res = await obtain(ttl, ipfs);
  console.log(res);
  await ipfs.stop();
};

const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));

main2();
