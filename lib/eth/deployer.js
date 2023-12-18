const Web3 = require("web3");
const wallet = require("../../wallet");
//const Web3 = require('./../../dist/web3.min.js');
const devContractArtifact = require("../../smart-contract-templates/build/contracts/Contract.json");
const devTokenArtifact = require("../../smart-contract-templates/build/contracts/NFToken.json");
const devErc20Artifact = require("../../smart-contract-templates/build/contracts/ERC20Token.json");

const devNetworkId = "5777";

class EthereumDeployer {
    // smartContractTemplate indicates which Smart Contract template shall be used "Contract" or "Contract2"
    constructor(provider, offChainStorage, networkId, smartContractTemplate, tokenArtifact, erc20Artifact) {
        this.provider = provider;
        this.web3 = new Web3(provider);
        this.gas = 6000000;
        this.offChainStorage = offChainStorage;

        if (networkId === undefined) networkId = devNetworkId;
        this.networkId = networkId;

        if (tokenArtifact === undefined) tokenArtifact = devTokenArtifact;
        this.tokenArtifact = tokenArtifact;

        if (smartContractTemplate === undefined) smartContractTemplate = devContractArtifact;
        this.smartContractTemplate = smartContractTemplate;

        this.token = new this.web3.eth.Contract(tokenArtifact.abi, tokenArtifact.networks[networkId].address);
        this.token.setProvider(this.provider);

        if (erc20Artifact === undefined) erc20Artifact = devErc20Artifact;
        this.erc20Artifact = erc20Artifact;

        this.erc20Token = new this.web3.eth.Contract(erc20Artifact.abi, erc20Artifact.networks[networkId].address);
        this.erc20Token.setProvider(this.provider);
    }

    setWalletService(walletService) {
        this.walletService = walletService;
    }

    // returns a list of evm addresses ([]string) for the parties in the mediaSC
    async getEvmAddressesFromWallet(scmObjects) {
        const addressList = [];
        for (const partyDid of Object.keys(scmObjects.parties)) {
            try {
                const account = await this.walletService.getEvmAccountByDid(partyDid);
                addressList.push(account);
            } catch (err) {
                console.error(`Party ${partyDid} not found in wallet`);
            }
        }
        return addressList;
    }

    setNFTokenContractAddress(address) {
        this.tokenArtifact["networks"][this.networkId]["address"] = address;
        this.token = new this.web3.eth.Contract(
            this.tokenArtifact.abi,
            this.tokenArtifact.networks[this.networkId].address
        );
    }

    setERC20TokenContractAddress(address) {
        this.erc20Artifact["networks"][this.networkId]["address"] = address;
        this.erc20Token = new this.web3.eth.Contract(
            this.erc20Artifact.abi,
            this.erc20Artifact.networks[this.networkId].address
        );
    }

    setMediaSC(mediaSC) {
        this.mediaSC = mediaSC === undefined ? {} : mediaSC;
    }

    setPartiesBindings(bindings) {
        console.debug("setting bindings", JSON.stringify(bindings));

        if (bindings !== undefined) {
            if (this.mediaSC.parties === undefined) this.mediaSC.parties = {};
            Object.keys(bindings).forEach((p) => {
                this.mediaSC.parties[p] = bindings[p];
            });
        }
    }

    async fetchEvmAccountForParties() {
        for (const partyDid of Object.keys(this.mediaSC.parties)) {
            let account = await this.walletService.getEvmAccountByDid(partyDid);

            if (!account) {
                // An account is generated on the fly
                account = this.web3.eth.accounts.create().address;
            }
            this.mediaSC.parties[partyDid] = account;
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
        const res = await this.token.methods.newToken(receiver, uri).send({ from: this.mainAddress, gas: this.gas });
        const tokenId = res.events["Transfer"].returnValues["tokenId"];
        console.log(`Token id:${tokenId} deployed`);

        return tokenId;
    }

    getNFTAddress() {
        return this.tokenArtifact.networks[this.networkId].address;
    }

    async reserveTokens(num) {
        console.log(`Reserving tokens...`);
        const res = await this.token.methods.reserveIds(num).send({ from: this.mainAddress, gas: this.gas });
        const tokenId = res.events["Reserved"].returnValues["start"];
        const tokenId2 = res.events["Reserved"].returnValues["end"];
        console.log(`Token id from ${tokenId} to ${tokenId2} reserved`);

        return tokenId;
    }

    async newTokenFromReserved(receiver, uri, reserved) {
        console.log(`Minting token...`);
        console.info(`Minting token with URI ${uri} and reserved ${reserved} and receiver ${receiver}`);
        try {
            console.info(reserved);
            const tokenCreateResponse = await this.token.methods
                .newTokenFromReserved(receiver, uri, reserved)
                .send({ from: this.mainAddress, gas: this.gas });

            const tokenId = tokenCreateResponse.events["Transfer"].returnValues["tokenId"];
            console.log(`Token id:${tokenId} deployed`);

            return tokenId;
        } catch (err) {
            console.error(err);
            // TODO In the case of an error we return the reserved ID.
            // TODO Fix the problem with invalid id's provided for minting.
            return reserved;
        }
    }
    async finalDeploy(deonticsIds, objectsIds) {
        const incomeBeneficiariesList = [];
        const incomePercentagesList = [];
        const actors = Object.keys(this.mediaSC.incomePercentage);
        for (let i = 0; i < actors.length; i++) {
            incomeBeneficiariesList.push(this.mediaSC.parties[actors[i]]);
            const beneficiaries = Object.keys(this.mediaSC.incomePercentage[actors[i]]);
            incomePercentagesList.push(beneficiaries.length);
            for (let j = 0; j < beneficiaries.length; j++) {
                incomeBeneficiariesList.push(this.mediaSC.parties[beneficiaries[j]]);
                incomePercentagesList.push(this.mediaSC.incomePercentage[actors[i]][beneficiaries[j]]);
            }
        }
        this.mediaSC.contentURI = await this.offChainStorage.publish(JSON.parse(this.mediaSC.contentURI));

        this.contract = new this.web3.eth.Contract(this.smartContractTemplate.abi);
        this.contract.setProvider(this.provider);

        console.log("Income percentage list", incomePercentagesList);

        let finalIncomePercentageList = [];

        // The income percentages list contains as first element the number of beneficiaries
        // then the percentages and then the next number of beneficiaries
        // and so on so forth
        if (incomePercentagesList.length > 0) {
            finalIncomePercentageList = [incomePercentagesList[0]];
            let currentNumberOfBeneficiaries = incomePercentagesList[0];

            for (let i = 1; i < incomePercentagesList.length; ) {
                for (let j = 0; j < currentNumberOfBeneficiaries; j++) {
                    finalIncomePercentageList.push(
                        new this.web3.utils.BN(Math.floor(incomePercentagesList[i++] * 100))
                    );
                }
                currentNumberOfBeneficiaries = incomePercentagesList[i++];
            }
        }

        // Default arguments for default Contract template
        let argumentsSc = [
            this.web3.utils.asciiToHex("identifier"),
            Object.values(this.mediaSC.parties),
            this.token.options.address,
            deonticsIds,
            objectsIds,
            [], //TODO contract relations
            [], //TODO contract relations
            incomeBeneficiariesList,
            finalIncomePercentageList,
            this.mediaSC.contentURI,
            this.web3.utils.asciiToHex(this.mediaSC.hash),
        ];

        // Different number of arguments for Contract2
        if (this.smartContractTemplate.contractName === "Contract2") {
            argumentsSc = [
                this.web3.utils.asciiToHex("identifier"),
                Object.values(this.mediaSC.parties),
                this.token.options.address,
                deonticsIds,
                objectsIds,
                this.mediaSC.contentURI,
                this.web3.utils.asciiToHex(this.mediaSC.hash),
            ];
        }

        const contractCreationResult = await this.contract
            .deploy({
                data: this.smartContractTemplate.bytecode,
                arguments: argumentsSc,
            })
            .send({
                from: this.mainAddress,
                gas: this.gas,
            });

        if (this.smartContractTemplate.contractName === "Contract") {
            await contractCreationResult.methods
                .setERC20Token(this.erc20Artifact["networks"][this.networkId]["address"])
                .send({
                    from: this.mainAddress,
                    gas: this.gas,
                });
        }

        return contractCreationResult;
    }

    // Approve the Smart Contract to send tokens on behalf of the address passed as parameter
    // up to the amount
    async approveToSendTokens(address, amount) {
        return await this.erc20Token.methods.approve(this.finalContract.options.address, amount).send({
            from: address,
            gas: this.gas,
        });
    }

    async payTo(sender, receiver, amount) {
        return await this.finalContract.methods.payTo(sender, receiver, amount).send({
            from: sender,
            gas: this.gas,
        });
    }

    // Executes the payment through a cascade that involves a previous Smart Contract
    async cascadePayTo(previousContractAddr, sender, receiver, amount) {
        return await this.finalContract.methods.payTo(previousContractAddr, sender, receiver, amount).send({
            from: sender,
            gas: this.gas,
        });
    }

    async deploySmartContractsReserved() {
        const deonticsIds = [];
        for (const deonticKey of Object.keys(this.mediaSC.deontics)) {
            const deonticValue = this.mediaSC.deontics[deonticKey];
            const uri = await this.offChainStorage.publish(JSON.parse(deonticValue.uri));
            const tokenId = deonticKey.split("_").slice(-1)[0];

            console.debug(
                `Creating NFT for deontic expression: Receiver:  ${
                    this.mediaSC.parties[deonticValue.receiver]
                }, URI: ${uri}, IPFS published content: ${deonticValue.uri}`
            );
            deonticsIds.push(
                await this.newTokenFromReserved(this.mediaSC.parties[deonticValue.receiver], uri, parseInt(tokenId))
            );
        }

        const objectsIds = [];
        if (this.mediaSC.objects !== undefined) {
            for (const objectKey of Object.keys(this.mediaSC.objects)) {
                const objectValue = this.mediaSC.objects[objectKey];
                const uri = await this.offChainStorage.publish(JSON.parse(objectValue.uri));
                const tokenId = objectKey.split("_").slice(-1)[0];

                console.debug(
                    `Creating NFT for IPEntity: Receiver:  ${
                        this.mediaSC.parties[objectValue.receiver]
                    }, URI: ${uri}, IPFS published content: ${objectValue.uri}`
                );
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
            const uri = await this.offChainStorage.publish(JSON.parse(deonticValue.uri));
            deonticsIds.push(await this.newToken(this.mediaSC.parties[deonticValue.receiver], uri));
        }
        const objectsIds = [];
        if (this.mediaSC.objects !== undefined) {
            for (const objectValue of Object.values(this.mediaSC.objects)) {
                const uri = await this.offChainStorage.publish(JSON.parse(objectValue.uri));
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

        this.finalContract = await this.finalDeploy(deonticsIds, objectsIds);

        return this.finalContract;
    }
}

module.exports = { EthereumDeployer };
