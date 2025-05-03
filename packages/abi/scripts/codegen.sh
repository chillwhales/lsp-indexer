squid-evm-typegen \
    src/abi \
    node_modules/@chillwhales/chill-shop-contracts/artifacts/* \
    node_modules/@erc725/smart-contracts/artifacts/* \
    node_modules/@lukso/lsp0-contracts/artifacts/* \
    node_modules/@lukso/lsp7-contracts/artifacts/* \
    node_modules/@lukso/lsp8-contracts/artifacts/*

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
