const Web3 = require('web3');
const wallet = require('../../wallet');
//const Web3 = require('./../../dist/web3.min.js');
const devContractArtifact = require('../../smart-contract-templates/build/contracts/Contract.json');
const devTokenArtifact = require('../../smart-contract-templates/build/contracts/NFToken.json');
const devNetworkId = '5777';

class EthereumDeployer {
  constructor(provider, offChainStorage, networkId, tokenArtifact, walletService) {
    this.mediaSC = undefined
    this.provider = provider;
    this.web3 = new Web3(provider);
    this.gas = 6000000;
    this.offChainStorage = offChainStorage;

    if (walletService === undefined) {
      this.walletService = new wallet.WalletService();
    }
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


  setNFTokenContractAddress(address) {
    this.tokenArtifact['networks'][this.networkId]['address'] = address;
    this.token = new this.web3.eth.Contract(
      this.tokenArtifact.abi,
      this.tokenArtifact.networks[this.networkId].address
    );
  }


  setMediaSC(mediaSC) {
    this.mediaSC = mediaSC === undefined ? {} : mediaSC;
  }

  setPartiesBindings(bindings) {
    console.debug("setting bindings", JSON.stringify(bindings))

    if (bindings !== undefined) {
      if (this.mediaSC.parties === undefined) this.mediaSC.parties = {};
      Object.keys(bindings).forEach((p) => {
        this.mediaSC.parties[p] = bindings[p];
      });
    }
  }

  async fetchEvmAccountForParties() {
    for (const partyDid of Object.keys(this.mediaSC.parties)) {
      const account = await this.walletService.getEvmAccountByDid(partyDid);
      this.mediaSC.parties[partyDid] = account;
    };

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

  async reserveTokens(num) {
    console.log(`Reserving tokens...`);
    const res = await this.token.methods
      .reserveIds(num)
      .send({ from: this.mainAddress, gas: this.gas });
    const tokenId = res.events['Reserved'].returnValues['start'];
    const tokenId2 = res.events['Reserved'].returnValues['end'];
    console.log(`Token id from ${tokenId} to ${tokenId2} reserved`);

    return tokenId;
  }

  async newTokenFromReserved(receiver, uri, reserved) {
    console.log(`Minting token...`);
    console.info(`Minting token with URI ${uri} and reserved ${reserved} and receiver ${receiver}`);
    try {
      console.info(reserved)
      const tokenCreateResponse = await this.token.methods
        .newTokenFromReserved(receiver, uri, reserved)
        .send({ from: this.mainAddress, gas: this.gas });

      const tokenId = tokenCreateResponse.events['Transfer'].returnValues['tokenId'];
      console.log(`Token id:${tokenId} deployed`);

      return tokenId;

    } catch (err) {
      console.error(err);
      // TODO In the case of an error we return the reserved ID.
      // TODO Fix the problem with invalid id's provided for minting.
      return reserved
    }

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

      console.debug(`Creating NFT for deontic expression: Receiver:  ${this.mediaSC.parties[deonticValue.receiver]}, URI: ${uri}, IPFS published content: ${deonticValue.uri}`)
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

        console.debug(`Creating NFT for IPEntity: Receiver:  ${this.mediaSC.parties[objectValue.receiver]}, URI: ${uri}, IPFS published content: ${objectValue.uri}`)
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
