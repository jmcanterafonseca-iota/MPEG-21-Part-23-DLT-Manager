const {
  generateSmartContractSpecification,
  MockStorage,
  EthereumDeployer,
  EthereumParser,
} = require('..');


const networkId = '1074';
const address = "0x3Bb7BDb47aF628cAD372e81a3984ED208035668f";
const privateKeys = ["38e8a09e1d159ab1ea57aae819ad216588bbb917bf0352d2752a746a97f7f807"]
const rpcUrl = 'http://localhost/wasp/api/v1/chains/tst1prxtl08jxpk6mzjlz89xgudeqdxsd35ru7vd2jksqc2vpajvuyl4v9lqghd/evm'

const HDWalletProvider = require('@truffle/hdwallet-provider');
const mco = require('./example.json');
const bindings = require('./bindings.json');

const generate = () => {
  return generateSmartContractSpecification(mco);
};


const deploy = async (smartContractSpecification, ipfs) => {
  const provider = new HDWalletProvider(privateKeys, rpcUrl);

  const deployer = new EthereumDeployer(
    provider,
    ipfs,
    smartContractSpecification,
    bindings,
    networkId
  );

  await deployer.setMainAddress(address);
  const res = await deployer.deploySmartContracts();
  return res.options.address;
};

const parse = async (address, ipfs) => {
  const provider = new HDWalletProvider(privateKeys, rpcUrl);
  const pars = new EthereumParser(
    provider,
    // 'http://127.0.0.1:8545'
    ipfs, address);
  return await pars.parseSmartContract();
};

const main = async () => {
  const ipfs = new MockStorage();
  const smartContractSpecification = generate();
  let res = await deploy(smartContractSpecification, ipfs);
  //const address = '0x9e0B0f5E7DF524cbe3BfbfAB3E733F1a7232ccB9';
  //await sleep(2000);
  //console.log('Parse');
  //res = await parse(address, ipfs);
  console.log(res);
};

const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));

main();
