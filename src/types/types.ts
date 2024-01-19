
export type SendMessage = {
	destination: string;
	address: string;
	message: string;
};

export type Message = {
	sender: string,
	destination: bigint,
	recipient: string,
	message: string,
	blockNumber: number,
	txHash: string
}; 

export type MatchingList = MatchingListElement[];

export interface MatchingListElement {
  originDomain?: '*' | number | number[];
  senderAddress?: '*' | string | string[];
  destinationDomain?: '*' | number | number[];
  recipientAddress?: '*' | string | string[];
}; 

