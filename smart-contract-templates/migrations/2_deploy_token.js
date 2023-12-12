const NFToken = artifacts.require('NFToken.sol');

module.exports = function (deployer) {
  deployer.deploy(NFToken, 'NFToken', 'NFT');
};
