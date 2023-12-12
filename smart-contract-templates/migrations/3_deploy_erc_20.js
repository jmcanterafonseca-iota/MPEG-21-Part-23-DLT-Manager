const erc20 = artifacts.require('ERC20Token.sol');

module.exports = function (deployer) {
 return deployer.deploy(erc20, 'iprToken', 'IPR', new web3.utils.BN('900000000000000000000'));
};
