import { ethers, Filter, Log, LogDescription } from "ethers";
import { MatchingList, MatchingListElement, Message } from "../types/types.js";
import { contracts } from "../utils/constants.js";
import { abi } from "../abi/mailbox.js";
import chalk from "chalk";

let MAX_QUERY_SIZE = 1_000_000;
const CHUNK_SIZE = 10_000;

let searchArgs = {
	originDomain: [],
	senderAddress: [],
	destinationDomain: [],
	recipientAddress: [],
};

let srcProvider: ethers.Provider;
let messages: Message[] = [];

export async function matchArgs(srcRpc: string, matchingList: MatchingList) {
	srcProvider = new ethers.JsonRpcProvider(srcRpc);

	//check the length, get the args
	const listLength = matchingList.length;
	if (listLength != 0) {
		for (let matchingListElement of matchingList) {
			if (matchingListElement.originDomain) {
				searchArgs.originDomain.push(matchingListElement.originDomain);
			}

			if (matchingListElement.senderAddress) {
				searchArgs.senderAddress.push(
					matchingListElement.senderAddress
				);
			}

			if (matchingListElement.destinationDomain) {
				const bn = BigInt(
					Number(matchingListElement.destinationDomain)
				);
				searchArgs.destinationDomain.push(bn);
			}

			if (matchingListElement.recipientAddress) {
				const str = ethers.stripZerosLeft(
					String(matchingListElement.recipientAddress)
				);
				searchArgs.recipientAddress.push(str);
			}
		}
	}

	console.log(
		chalk.cyan("Searching for any messages that match the following:")
	);
	console.log(searchArgs);
	await getLogs();
}


export async function getLogs(): Promise<void> {
	//create filter based on matching list
	const { chainId } = await srcProvider.getNetwork();

	const currentBlock: number = await srcProvider.getBlockNumber();

	let filter: ethers.Filter = {
		address: contracts[chainId.toString()],
		fromBlock: currentBlock - 10_000,
		toBlock: currentBlock,
		topics: [ethers.id("Dispatch(address,uint32,bytes32,bytes)")],
	};

	const contractInterface = new ethers.Interface(abi);

	console.log(chalk.magenta("Checking the chain, brb..."));

	for (let index = 0; index < MAX_QUERY_SIZE / CHUNK_SIZE; index++) {
		filter.fromBlock = currentBlock - MAX_QUERY_SIZE + index * CHUNK_SIZE;
		filter.toBlock = filter.fromBlock + CHUNK_SIZE;

		let logs = await srcProvider.getLogs(filter);
		let timestampFromBlock = await srcProvider.getBlock(filter.fromBlock);
		let timestampToBlock = await srcProvider.getBlock(filter.toBlock);

		let event = logs.map((log: any) => {
			const decodedEvent = contractInterface.parseLog(log);

			const decoder = new TextDecoder("utf-8", { fatal: false });
			const message = decodedEvent.args.message;
			const offset = 77;
			const bodyHex = message.startsWith("0x")
				? message.slice(2 + offset * 2)
				: message.slice(offset * 2);
			const bodyBuffer = Buffer.from(bodyHex, "hex");
			const msg = decoder.decode(bodyBuffer);

			const messageObject = {
				sender: decodedEvent.args.sender,
				destination: decodedEvent.args.destination,
				recipient: ethers.stripZerosLeft(decodedEvent.args.recipient),
				message: msg,
				blockNumber: log.blockNumber,
				txHash: log.transactionHash,
			};

			messages.push(messageObject);
		});
	}
	await searchLogs();
}

async function searchLogs() {
	//if we match any of the desired search terms we return the event to the user
	const result = messages.filter((message) => {
		return (
			searchArgs.destinationDomain.includes(message.destination) ||
			searchArgs.recipientAddress.includes(message.recipient) ||
			searchArgs.senderAddress.includes(message.sender)
		);
	});
	console.log(result);
	console.log(chalk.green("Success!"));
}
