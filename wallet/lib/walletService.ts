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
	private walletServiceBaseURL: string;
	private walletServiceToken?: string;
	private headers: Headers = new Headers();

	constructor(walletServiceURL?: string, walletServiceToken?: string) {
		this.walletServiceBaseURL = walletServiceURL || DefaultWalletServiceBaseURL;
		this.walletServiceToken = walletServiceToken;
		if (this.walletServiceToken) {
			console.debug("WalletService instantiated with token");
			this.headers.append("Authorization", "Bearer " + walletServiceToken);
		}
	}

	private async get(url: string, headers?: Headers): Promise<Response> {
		const response: Response = await fetch(url, {
			headers: headers || this.headers,
		});
		return response;
	}

	async getEvmAccountByDid(did: string): Promise<string> {
		const url = this.walletServiceBaseURL + "/identities/" + did;
		console.debug("making request to " + url);

		const response = await this.get(url);
		const userOverview: WalletUser = await response.json();
		return userOverview.account;
	}


	async getAttributesByDid(did: string): Promise<IdentityAttribute[]> {
		const url = this.walletServiceBaseURL + "/identities/" + did + "/attributes";
		console.debug("making request to " + url);

		const response = await this.get(url);
		const attributes: IdentityAttribute[] = await response.json();
		return attributes
	}

}




