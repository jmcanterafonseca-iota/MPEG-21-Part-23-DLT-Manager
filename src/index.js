const {
  generateSmartContractSpecification,
  obtainSmartContractSpecification,
} = require('../lib/generator');
const { MockStorage } = require('../lib/storage/mockStorage');
const { EthereumDeployer } = require('../lib/eth/deployer');
const { EthereumParser } = require('../lib/eth/parser');

module.exports = {
  generateSmartContractSpecification,
  obtainSmartContractSpecification,
  MockStorage,
  EthereumDeployer,
  EthereumParser,
};
