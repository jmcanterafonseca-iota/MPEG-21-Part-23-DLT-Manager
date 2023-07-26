const {
  generateSmartContractSpecification,
  MockStorage,
  EthereumDeployer,
  EthereumParser,
} = require('..');
const HDWalletProvider = require('@truffle/hdwallet-provider');

// Create a `.env` file containing these informations:
//IOTA_WASP_MNEMONIC="angle ...... meadow cereal"
//IOTA_WASP_CHAIN="tst1pq6hayf.....6pw6mcvre74jzhu4qde"

require('dotenv').config();

const phrase = process.env.IOTA_WASP_MNEMONIC;
const chain = process.env.IOTA_WASP_CHAIN;
const providerOrUrl = `http://localhost/wasp/api/v1/chains/${chain}/evm`;
const networkId = '1074';
const mco = require('./example.json');
const bindings = require('./bindings.json');

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
  const deployer = new EthereumDeployer(
    provider,
    ipfs,
    smartContractSpecification,
    bindings,
    networkId
  );

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
    networkId
  );
  let res = await pars.parseSmartContract();
  provider.engine.stop();
  return res;
};

const main = async () => {
  const ipfs = new MockStorage();
  const smartContractSpecification = generate();
  let address = await deploy(smartContractSpecification, ipfs);
  //const address = '0x732f33Cb168d8A3da77Dc2811676c0b99fDB25a1';
  //await sleep(2000);
  //console.log('Parse');
  console.log(ipfs.storage);
  res = await parse(address, ipfs);
  console.log(res);
};

const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));

main();
