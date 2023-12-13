const mco = require("../../test/example.json");
const Contract = artifacts.require("Contract.sol");
const Contract2 = artifacts.require("Contract2.sol");
const NFToken = artifacts.require("NFToken.sol");
const ERC20Token = artifacts.require("ERC20Token.sol");

contract("Contract", (accounts) => {
    var owner = accounts[0];
    var alice = accounts[1];

    it("should create a new contract and mint a new obligation to alice", async () => {
        const mcoCont = mco;
        const partiesAcc = accounts.slice(2, 2 + mcoCont.parties.length);

        const erc20Token = await ERC20Token.deployed();

        const token = await NFToken.deployed();
        const resTok = await token.newToken(alice, mcoCont.deontics[Object.keys(mcoCont.deontics)[0]]);

        const dlist = [resTok.logs[0].args.tokenId];
        const olist = [new web3.utils.BN(2)];
        const relatContList = [accounts[0]];
        const relationsList = [new web3.utils.BN(1)]; //enums
        const incomeBeneficiariesList = [accounts[2], accounts[4], accounts[5], accounts[3], accounts[6]];
        const incomePercentagesList = [
            new web3.utils.BN(2),
            new web3.utils.BN(100),
            new web3.utils.BN(5000),
            new web3.utils.BN(1),
            new web3.utils.BN(2000),
        ];
        const contentUri = mco;
        const contentHash = web3.utils.asciiToHex(contentUri);

        const cont = await Contract.new(
            web3.utils.asciiToHex("identifier"),
            partiesAcc,
            token.address,
            dlist,
            olist,
            relatContList,
            relationsList,
            incomeBeneficiariesList,
            incomePercentagesList,
            contentUri,
            contentHash,
            {
                from: owner,
                gas: "6000000",
            }
        );

        const res0 = await erc20Token.approve(cont.address, 10000, {
            from: owner,
        });
        console.log(res0);
        
        await cont.setERC20Token(erc20Token.address);

        //const a = await cont.getDeonticExpressions();
        const b = await cont.getIncomePercentagesBy(accounts[3]);
        console.log(b);

        console.log("Account to be paid", accounts[3].toString());

        await cont.payTo(owner, accounts[3].toString(), new web3.utils.BN("1000"));

        const contract2 = await Contract2.new(
            web3.utils.asciiToHex("identifier"),
            partiesAcc,
            token.address,
            dlist,
            olist,
            contentUri,
            contentHash,
            {
                from: owner,
                gas: "6000000",
            }
        );

        await contract2.payTo(cont.address, owner, accounts[3].toString(), new web3.utils.BN("1000"));
    });
});
