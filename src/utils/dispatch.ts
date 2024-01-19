import chalk from "chalk";
import { program } from "commander";
import inquirer from "inquirer";
import { ethers } from "ethers";
import fs from "fs";
import "dotenv/config";
import { contracts } from "../utils/constants.js";
import { abi } from "../abi/mailbox.js";
import { SendMessage } from "../types/types.js";

export async function sendMessage(
	originRpc: string,
	destinationAddress: string,
	destinationRpc: string,
	message: string,
	privateKey: string
): Promise<void> {
	//todo get gas from contract call
	//get the current chain we're on
	const srcProvider = new ethers.JsonRpcProvider(originRpc);
	const destProvider = new ethers.JsonRpcProvider(destinationRpc);
	const signer = new ethers.Wallet(privateKey).connect(srcProvider);
	const srcChain = await srcProvider.getNetwork();
	const destChain = await destProvider.getNetwork();
	const srcChainId = srcChain.chainId;
	const destChainId = destChain.chainId;

	const hyperlaneContract: any = new ethers.Contract(
		contracts[srcChainId.toString()],
		abi,
		signer
	);

	destinationAddress = ethers.hexlify(
		ethers.zeroPadValue(destinationAddress, 32)
	);
	message = ethers.hexlify(ethers.toUtf8Bytes(message));

	const params = [
		ethers.Typed.uint32(Number(destChainId)),
		ethers.Typed.bytes32(destinationAddress),
		ethers.Typed.bytes(message),
	];

	const fee = await hyperlaneContract.quoteDispatch(...params);
	const [messageId, tx] = await Promise.all([
		hyperlaneContract["dispatch(uint32,bytes32,bytes)"].staticCall(
			...params,
			{ value: fee }
		),
		hyperlaneContract["dispatch(uint32,bytes32,bytes)"](...params, {
			value: fee,
		}),
	]);

	console.log(chalk.cyan("Sending transaction..."));

	const success = await tx.wait();
	console.log(chalk.green("Transaction confirmed!"));

	console.log(chalk.magenta("Waiting for delivery..."));

	checkForDeliveryOnDestChain(messageId, destProvider, String(destChainId));
}

/* @dev polls for delivery on the destination chain
checks every 5 seconds if the message has been delivered, when it has, it returns a success message
if not, we try polling 50 times, and then exit
*/
//this could be updated to show the txn hash, and link a user to the hyperlane website directly
async function checkForDeliveryOnDestChain(
	messageId: string,
	destProvider: ethers.Provider,
	destChainId: string
): Promise<void> {
	const dhyperlaneContract: any = new ethers.Contract(
		contracts[destChainId],
		abi,
		destProvider
	);

	const maxAttempts = 50;
	let attempts = 0;
	const delivered = setInterval(async () => {
		attempts++;
		if (attempts >= maxAttempts) {
			clearInterval(delivered);
			console.log(
				chalk.red(
					"Polling ran out of time, please continue to the Hyperlane Explorer and check for your transaction!"
				)
			);
		}
		try {
			console.log(
				chalk.gray(
					"Checking for delivery on destination chain, please wait..."
				)
			);
			const res = await dhyperlaneContract.delivered(messageId);
			if (res === true) {
				console.log(
					chalk.green(
						`Success! Your message has been delivered on chainId: ${destChainId}`
					)
				);
				clearInterval(delivered);
			}
		} catch (err) {
			console.log(err);
		}
	}, 5000);
}
