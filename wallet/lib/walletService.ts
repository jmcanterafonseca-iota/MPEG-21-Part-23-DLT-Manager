// so we need the http client to make a request to the wallet service
// additionally the wallet service probably is protected by the JWT token so this needs to be passed as well


export const DefaultWalletServiceBaseURL = "http://localhost:8081"

export interface WalletUser {
	// decentralized identifier
	did: string
	// wallet username
	username: string
	// evm L2 account
	account: string
}

// IdentityAttribute is a single property of identity determined by claims and associated
// credentials with the identity. For example, a claim of "name" with a value of "John Doe"
export interface IdentityAttribute {
	attributeId: string
	attributeValue: string
	validUntil: number
}

export class WalletService {
	walletServiceBaseURL: string

	constructor(walletServiceURL?: string) {
		this.walletServiceBaseURL = walletServiceURL || DefaultWalletServiceBaseURL
	}

	async getEvmAccountByDid(did: string): Promise<string> {
		const response: Response = await fetch(this.walletServiceBaseURL + "/identities/" + did);
		const userOverview: WalletUser = await response.json();

		console.log(userOverview);

		return userOverview.account;
	}


	async getAttributesByDid(did: string): Promise<IdentityAttribute[]> {
		const response: Response = await fetch(this.walletServiceBaseURL + "/identities/" + did + "/attributes");
		const attributes: IdentityAttribute[] = await response.json();
		return attributes
	}

}




