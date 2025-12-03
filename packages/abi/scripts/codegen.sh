#!/bin/sh

squid-evm-typegen \
    src/abi \
    custom/*.json \
    custom/extensions/*.json \
    node_modules/@erc725/smart-contracts/artifacts/*.json \
    node_modules/@lukso/lsp0-contracts/artifacts/*.json \
    node_modules/@lukso/lsp6-contracts/artifacts/*.json \
    node_modules/@lukso/lsp7-contracts/artifacts/*.json \
    node_modules/@lukso/lsp8-contracts/artifacts/*.json \
    node_modules/@lukso/lsp14-contracts/artifacts/*.json \
    node_modules/@lukso/lsp23-contracts/artifacts/*.json \
    node_modules/@lukso/lsp26-contracts/artifacts/*.json

output="src/index.ts"
echo "" > $output
for filePath in src/abi/*
do
    # remove the longest string from left to right that ends in /
    fileNameWithExtension=${filePath##*/}
    # remove the longest string from right to left that starts with .
    fileName=${fileNameWithExtension%%.*}
    # add one more export to $output 
    echo "export * as $fileName from \"./abi/$fileName\"" >> $output
done
