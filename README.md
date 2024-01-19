# Hyperlane CLI

A cross-chain messaging CLI using the [Hyperlane Interchain Protocol](https://www.hyperlane.xyz/)

## Install Instructions
To install, first clone the repo. Then, ``yarn install`` and ``yarn build``
```
git clone https://github.com/yoyobojo/hyperlane-cli.git;
cd hyperlane-cli;
yarn install && yarn build;
yarn hyperlane
```

Now that it's installed, go ahead and rename the `.env.example` to `.env`:
```
mv .env.example .env
```

Lastly, add your values to the environment variables in `.env` then make it known to your machine with:
```
source .env
```

And you're ready to go!

## API

#### Table of Contents

1. [Send Message](https://github.com/yoyobojo/hyperlane-cli?tab=readme-ov-file#send)
2. [Search for Message](https://github.com/yoyobojo/hyperlane-cli?tab=readme-ov-file#search)

### Send 

To ``Send`` via the ``dispatch()`` function, use the following syntax. You can use this handy one here:
```
yarn hyperlane send -sr $AVAX_FUJI_RPC -d 0x4fC0Ac163eFFEb7890937cB89275B2C231880F22 -dr $ETH_GOERLI_RPC -msg "Whats good, Hyperlane Homies?" -p $PRIVATE_KEY
```

The cli tool will then send your message and check until the message has been delivered on your desired chain. Sweet!

### Search
Now let's search for the message we just sent. First, for easy access, export the corresponding address for the private key used to send:
```
export ADDRESS=address-goes-here
```

To ``Search`` via ``eth_Logs``, use the following syntax: 

```
yarn hyperlane search -sr $AVAX_FUJI_RPC -m '[{"senderAddress": "$ADDRESS" }]'
```

A quick note is that the ``-m`` flag takes in a MatchingList as an argument in JSON format. If you wanted to search for multiple logs and get all matches, you can add more queries like so: 
```
-m '[{"senderAddress": "$ADDRESS", "originDomain": 5, "destinationDomain": 5, "recipientAddress": "$ADDRESS2"}]'
```

or, if you don't feel like exporting another variable, just copy and paste this one and check out these awesome testing messages I used setting this up:
```
yarn hyperlane search -sr $AVAX_FUJI_RPC -m '[{"senderAddress": "0x4CF908f6f1EAF51d143823Ce3A5Dd0Eb8373f23c" }]'
```

That's all for now.
