module.exports = [
    [
        {
            facetAddress: "0x5Cc5711E6128F852d174770fB52cA3086C0055A7", // DiamondCutFacet address
            action: 0,
            functionSelectors: [
                "0x1f931c1c" // diamondCut function selector
            ]
        },
        {
            facetAddress: "0x5a3AD4F06b1c2F22b5C7767183572BCe8A12a4fe", // DiamondLoupeFacet address
            action: 0,
            functionSelectors: [
                "0xcdffacc6", // facetAddress function selector
                "0x52ef6b2c", // facetAddresses function selector
                "0xadfca15e", // facetFunctionSelectors function selector
                "0x7a0ed627", // facets function selector
                "0x01ffc9a7"  // supportsInterface function selector
            ]
        },
        {
            facetAddress: "0xc262DCb46F4dC083eE2213435dbEBf8563E4c6E1", // OwnershipFacet address
            action: 0,
            functionSelectors: [
                "0x8da5cb5b", // owner function selector
                "0xf2fde38b"  // transferOwnership function selector
            ]
        }
    ],
    {
        owner: "0x74c5d6cd0325205b86e2a30B07f1be350367B40D", // Deployer address
        init: "0x4f18Bf37aCB5268E0D826aFD21a81F9Cc84Bc368", // DiamondInit address
        initCalldata: "0x" // Encoded init function call
    },
    [
        "0x62618De1cA80188FbbeEEaaC99b58Ec9B2e9e72C",
        "0xcE59326853B8EfE539882137d16F826fE46BDD5c",
        "0x3fCf08DDE67A9ED9314F79B97197175313A8E327",
        "0x74c5d6cd0325205b86e2a30B07f1be350367B40D"
    ],
    "0x74c5d6cd0325205b86e2a30B07f1be350367B40D" // Deployer address
];