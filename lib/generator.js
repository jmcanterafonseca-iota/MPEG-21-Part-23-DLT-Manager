const Web3 = require('web3');
const parser = require('mco-parser');
//const Web3 = require('./../dist/web3.min.js');

const generateSmartContractSpecification = (contractObj) => {
  const mediaSC = {};

  // Identifier
  mediaSC.identifier = contractObj.identifier;

  // Parties
  mediaSC.parties = {};
  Object.keys(contractObj.parties).forEach((p) => {
    mediaSC.parties[p] = '';
  });

  //Deontic Expression
  mediaSC.deontics = {};
  Object.keys(contractObj.deontics).forEach((deonticId) => {
    const tmpDeontic = JSON.parse(
      JSON.stringify(contractObj.deontics[deonticId])
    );
    // Fill the deontic with actions
    tmpDeontic.act = JSON.parse(
      JSON.stringify(contractObj.actions[tmpDeontic.act])
    );
    if (tmpDeontic.act.impliesAlso !== undefined) {
      for (let i = 0; i < tmpDeontic.act.impliesAlso.length; i++) {
        tmpDeontic.act.impliesAlso[i] = JSON.parse(
          JSON.stringify(contractObj.actions[tmpDeontic.act.impliesAlso[i]])
        );
      }
    }
    // Fill the deontic with constraints
    if (tmpDeontic.constraints !== undefined) {
      for (let i = 0; i < tmpDeontic.constraints.length; i++) {
        tmpDeontic.constraints[i] = JSON.parse(
          JSON.stringify(contractObj.facts[tmpDeontic.constraints[i]])
        );
      }
    }
    mediaSC.deontics[deonticId] = {
      uri: JSON.stringify(tmpDeontic),
      receiver: contractObj.deontics[deonticId].actedBySubject,
    };
  });

  //Objects
  if (contractObj.objects !== undefined) {
    mediaSC.objects = {};
    Object.keys(contractObj.objects).forEach((objectId) => {
      mediaSC.objects[objectId] = {
        uri: JSON.stringify(contractObj.objects[objectId]),
        receiver:
          contractObj.objects[objectId].rightsOwners !== undefined
            ? contractObj.objects[objectId].rightsOwners[0]
            : undefined,
      };
    });
  }

  //Contracts relations
  if (contractObj.contractRelations !== undefined) {
    //TODO
  }

  // Income percentage
  mediaSC.incomePercentage = {};
  Object.keys(contractObj.actions).forEach((actId) => {
    const act = contractObj.actions[actId];
    if (act.type === 'Payment') {
      const actor = act.actedBy;
      const beneficiary = act.beneficiaries[0];

      /*if (act.amount !== undefined) {
        if (payTo[actor] === undefined) payTo[actor] = {};
        payTo[actor][beneficiary] = act.amount;
      } else*/
      if (act.incomePercentage !== undefined) {
        if (mediaSC.incomePercentage[actor] === undefined)
          mediaSC.incomePercentage[actor] = {};
        mediaSC.incomePercentage[actor][beneficiary] = act.incomePercentage;
      }
    }
  });

  // Content URI
  mediaSC.contentURI = JSON.stringify(contractObj);
  // Content hash
  mediaSC.hash = Web3.utils.sha3(mediaSC.contentURI);

  return mediaSC;
};

const intoNFTDID = (chainId, contractAddress, tokenId) => {
  return (
    'did:nft:eip155:' + chainId + '_erc721_' + contractAddress + '_' + tokenId
  );
};

const fromNFTDID = (did) => {
  const res = did.split(':').slice(-1)[0].split('_');
  return {
    contractAddress: res[0],
    tokenId: res[1],
  };
};

const obtainSmartContractSpecification = async (
  mcoContract,
  ipfs,
  deployer
) => {
  const { mediaContractualObjects, traversedIds } =
    await parser.getContractFromMCO(mcoContract);

  let jsonLDGraph = parser.getJsonLDGraph(mcoContract);

  /*const ipfs = new OffChainStorage();
    const provider = new HDWalletProvider({
      mnemonic: phrase,
      providerOrUrl,
    });
    const deployer = new EthereumDeployer(provider, ipfs, chainId);
    await deployer.setMainAddressIndex(0);

    await ipfs.start();
    */

  let reserved = await deployer.reserveTokens(traversedIds.deontics.length);

  for (let i = traversedIds.ids.length - 1; i >= 0; i--) {
    if (!traversedIds.parties.includes(traversedIds.ids[i])) {
      let textThatReplaces;
      if (
        traversedIds.deontics.includes(traversedIds.ids[i]) ||
        traversedIds.objects.includes(traversedIds.ids[i])
      ) {
        textThatReplaces = intoNFTDID(
          deployer.networkId,
          deployer.getNFTAddress(),
          reserved++
        );
      } else {
        const content = jsonLDGraph[traversedIds.ids[i]];
        textThatReplaces = await ipfs.publish(content);
      }
      mcoContract = mcoContract.replaceAll(
        traversedIds.ids[i],
        textThatReplaces
      );
      jsonLDGraph = parser.getJsonLDGraph(mcoContract);
    }
  }
  //ipfs.stop();
  //provider.engine.stop();

  const result2 = await parser.getContractFromMCO(mcoContract);
  //await saveContracts(result2.mediaContractualObjects.contracts);

  const mediaSC = generateSmartContractSpecification(
    result2.mediaContractualObjects.contracts[0]
  );

  return {
    specification: mediaSC,
    mediaContractualObjects: result2.mediaContractualObjects,
    traversed: result2.traversedIds,
  };
};

module.exports = {
  generateSmartContractSpecification,
  obtainSmartContractSpecification,
};
