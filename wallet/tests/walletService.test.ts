import { WalletService } from "../lib/walletService";


// This test must have a running external instance of wallet service on localhost:8080
test('should find the account for given did', async () => {
	const did = "did:key:z2dmzD81cofDbrjLsXScDFqT6iCfQHgtRVeAGhFH5fwZcg6pzEnScLdCQNDDDAnpCLDWTEAnxoMDXA7tPHyRTYB8uKjuxAKh3zPjPk3EVKSQkSkebSUQhYu4pxFZEVBYkw9AAnK77FHEvN5emSQcNrftLSmybALA2gWxJmsMhnoek5HLgU";
	const walletService = new WalletService();

	const account = await walletService.getEvmAccountByDid(did);

	expect(account).toHaveLength(42)
});



test('should find attributes for given did', async () => {
	const did = "did:key:z2dmzD81cofDbrjLsXScDFqT6iCfQHgtRVeAGhFH5fwZcg6pzEnScLdCQNDDDAnpCLDWTEAnxoMDXA7tPHyRTYB8uKjuxAKh3zPjPk3EVKSQkSkebSUQhYu4pxFZEVBYkw9AAnK77FHEvN5emSQcNrftLSmybALA2gWxJmsMhnoek5HLgU";
	const walletService = new WalletService();

	const attributes = await walletService.getAttributesByDid(did);
	console.log(attributes)

	expect(attributes).toHaveLength(1)
	expect(attributes[0].attributeId.length).toBeGreaterThan(0)
	expect(attributes[0].attributeValue.length).toBeGreaterThan(0)
	expect(attributes[0].validUntil).toBeGreaterThan(0)
})
