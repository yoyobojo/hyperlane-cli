#!/usr/bin/env node
import chalk from "chalk";
import figlet from 'figlet'; 
import gradient from "gradient-string"; 
import { program } from "commander";
import { sendMessage } from "./utils/dispatch.js";
import { matchArgs } from "./utils/search.js";


//commander
program
	.name("hyperlane-cli")
	.description(
		chalk.cyan(
			"A simple cli tool to send and search for messages via Hyperlane"
		)
	)
	.version("0.0.1");

program
	.command("send")
	.requiredOption(
		"-sr, --srpc-url <srpc-url>",
		"RPC Url of origin chain to send from"
	)
	.requiredOption(
		"-d, --destination <destination-address>",
		"Address to send to on destination chain"
	)
	.requiredOption(
		"-dr --drpc-url <drpc-url>",
		"RPC Url of chain to receive message on"
	)
	.requiredOption("-msg, --message <message>", "Message to send")
	.requiredOption(
		"-p, --private-key <private-key>",
		"Your wallet's private key to sign transactions"
	)
	.description(chalk.blue("Send an interchain message via the Hyperlane!"))
	.action(async (options) => {
		await sendMessage(
			options.srpcUrl,
			options.destination,
			options.drpcUrl,
			options.message,
			options.privateKey
		);
	});

program
	.command("search")
	.requiredOption(
		"-sr, --srpc-url <srpc-url>",
		"RPC Url of origin chain to search"
	)
	.requiredOption(
		"-m, --matching-list <matching-list>",
		'Matching List in JSON format \'[{"senderAddress": "0x..."}]\''
	)
	.description(chalk.green("Search the Hyperlane for a message!"))
	.action(async (options) => {
		matchArgs(options.srpcUrl, JSON.parse(options.matchingList));
	});

program.parse(process.argv);
