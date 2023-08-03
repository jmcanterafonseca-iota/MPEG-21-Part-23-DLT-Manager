const {
  generateSmartContractSpecification,
  obtainSmartContractSpecification,
} = require('../lib/generator');
const { OffChainStorage } = require('../lib/storage/offChainStorage');
const { MockStorage } = require('../lib/storage/mockStorage');
const { EthereumDeployer } = require('../lib/eth/deployer');
const { EthereumParser } = require('../lib/eth/parser');

module.exports = {
  generateSmartContractSpecification,
  obtainSmartContractSpecification,
  MockStorage,
  OffChainStorage,
  EthereumDeployer,
  EthereumParser,
};
