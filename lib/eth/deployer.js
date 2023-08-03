const Web3 = require('web3');
//const Web3 = require('./../../dist/web3.min.js');
const devContractArtifact = require('../../smart-contract-templates/build/contracts/Contract.json');
const devTokenArtifact = require('../../smart-contract-templates/build/contracts/NFToken.json');
const devNetworkId = '5777';

class EthereumDeployer {
  constructor(provider, offChainStorage, networkId, tokenArtifact) {
    this.provider = provider;
    this.web3 = new Web3(provider);
    this.gas = 6000000;
    this.offChainStorage = offChainStorage;

    if (networkId === undefined) networkId = devNetworkId;
    this.networkId = networkId;
    if (tokenArtifact === undefined) tokenArtifact = devTokenArtifact;
    this.tokenArtifact = tokenArtifact;

    this.token = new this.web3.eth.Contract(
      tokenArtifact.abi,
      tokenArtifact.networks[networkId].address
    );
    this.token.setProvider(this.provider);
  }

  setMediaSC(mediaSC) {
    this.mediaSC = mediaSC === undefined ? {} : mediaSC;
  }

  setPartiesBindings(bindings) {
    if (bindings !== undefined) {
      if (this.mediaSC.parties === undefined) this.mediaSC.parties = {};
      Object.keys(bindings).forEach((p) => {
        this.mediaSC.parties[p] = bindings[p];
      });
    }
  }

  async setMainAddressIndex(addressIndex) {
    const accounts = await this.web3.eth.getAccounts();
    this.mainAddress = accounts[addressIndex];
  }

  async setMainAddress(address) {
    this.mainAddress = address;
  }

  async newToken(receiver, uri) {
    const res = await this.token.methods
      .newToken(receiver, uri)
      .send({ from: this.mainAddress, gas: this.gas });
    const tokenId = res.events['Transfer'].returnValues['tokenId'];
    console.log(`Token id:${tokenId} deployed`);

    return tokenId;
  }

  getNFTAddress() {
    return this.tokenArtifact.networks[this.networkId].address;
  }

  async reserveToken() {
    const res = await this.token.methods
      .reserveId()
      .send({ from: this.mainAddress, gas: this.gas });
    const tokenId = res.events['Reserved'].returnValues['tokenId'];
    console.log(`Token id:${tokenId} reserved`);

    return tokenId;
  }

  async newTokenFromReserved(receiver, uri, reserved) {
    const res = await this.token.methods
      .newTokenFromReserved(receiver, uri, reserved)
      .send({ from: this.mainAddress, gas: this.gas });
    const tokenId = res.events['Transfer'].returnValues['tokenId'];
    console.log(`Token id:${tokenId} deployed`);

    return tokenId;
  }
  async finalDeploy(deonticsIds, objectsIds) {
    const incomeBeneficiariesList = [];
    const incomePercentagesList = [];
    const actors = Object.keys(this.mediaSC.incomePercentage);
    for (let i = 0; i < actors.length; i++) {
      incomeBeneficiariesList.push(this.mediaSC.parties[actors[i]]);
      const beneficiaries = Object.keys(
        this.mediaSC.incomePercentage[actors[i]]
      );
      incomePercentagesList.push(beneficiaries.length);
      for (let j = 0; j < beneficiaries.length; j++) {
        incomeBeneficiariesList.push(this.mediaSC.parties[beneficiaries[j]]);
        incomePercentagesList.push(
          this.mediaSC.incomePercentage[actors[i]][beneficiaries[j]]
        );
      }
    }
    this.mediaSC.contentURI = await this.offChainStorage.publish(
      JSON.parse(this.mediaSC.contentURI)
    );

    this.contract = new this.web3.eth.Contract(devContractArtifact.abi);
    this.contract.setProvider(this.provider);

    return await this.contract
      .deploy({
        data: devContractArtifact.bytecode,
        arguments: [
          this.web3.utils.asciiToHex('identifier'),
          Object.values(this.mediaSC.parties),
          this.token.options.address,
          deonticsIds,
          objectsIds,
          [], //TODO contract relations
          [], //TODO contract relations
          incomeBeneficiariesList,
          incomePercentagesList,
          this.mediaSC.contentURI,
          this.web3.utils.asciiToHex(this.mediaSC.hash),
        ],
      })
      .send({
        from: this.mainAddress,
        gas: this.gas,
      });
  }

  async deploySmartContractsReserved() {
    const deonticsIds = [];
    for (const deonticKey of Object.keys(this.mediaSC.deontics)) {
      const deonticValue = this.mediaSC.deontics[deonticKey];
      const uri = await this.offChainStorage.publish(
        JSON.parse(deonticValue.uri)
      );
      const tokenId = deonticKey.split('_').slice(-1)[0];
      deonticsIds.push(
        await this.newTokenFromReserved(
          this.mediaSC.parties[deonticValue.receiver],
          uri,
          parseInt(tokenId)
        )
      );
    }
    const objectsIds = [];
    if (this.mediaSC.objects !== undefined) {
      for (const objectKey of Object.keys(this.mediaSC.objects)) {
        const objectValue = this.mediaSC.objects[objectKey];
        const uri = await this.offChainStorage.publish(
          JSON.parse(objectValue.uri)
        );
        const tokenId = objectKey.split('_').slice(-1)[0];
        objectsIds.push(
          await this.newTokenFromReserved(
            objectValue.receiver !== undefined
              ? this.mediaSC.parties[objectValue.receiver]
              : this.mainAddress,
            uri,
            parseInt(tokenId)
          )
        );
      }
    }

    return await this.finalDeploy(deonticsIds, objectsIds);
  }

  async deploySmartContracts() {
    const deonticsIds = [];
    for (const deonticValue of Object.values(this.mediaSC.deontics)) {
      const uri = await this.offChainStorage.publish(
        JSON.parse(deonticValue.uri)
      );
      deonticsIds.push(
        await this.newToken(this.mediaSC.parties[deonticValue.receiver], uri)
      );
    }
    const objectsIds = [];
    if (this.mediaSC.objects !== undefined) {
      for (const objectValue of Object.values(this.mediaSC.objects)) {
        const uri = await this.offChainStorage.publish(
          JSON.parse(objectValue.uri)
        );
        objectsIds.push(
          await this.newToken(
            objectValue.receiver !== undefined
              ? this.mediaSC.parties[objectValue.receiver]
              : this.mainAddress,
            uri
          )
        );
      }
    }

    return await this.finalDeploy(deonticsIds, objectsIds);
  }
}

module.exports = { EthereumDeployer };
