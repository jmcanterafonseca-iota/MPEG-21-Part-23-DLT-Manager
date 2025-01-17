const {
  generateSmartContractSpecification,
  obtainSmartContractSpecification,
} = require('../lib/generator');
const { MockStorage } = require('../lib/storage/mockStorage');
const { EthereumDeployer } = require('../lib/eth/deployer');
const { EthereumParser } = require('../lib/eth/parser');
const { WalletService } = require("../wallet/lib/walletService");

module.exports = {
  generateSmartContractSpecification,
  obtainSmartContractSpecification,
  MockStorage,
  EthereumDeployer,
  EthereumParser,
  WalletService,
};
