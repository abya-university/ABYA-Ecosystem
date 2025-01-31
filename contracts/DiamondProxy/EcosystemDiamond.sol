// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import { LMSToken } from "../LMS Token.sol";
import { LibDiamond } from "./DiamondLibrary/LibDiamond.sol";
import { IDiamondCut } from "./DiamondInterfaces/IDiamondCut.sol";
import { IDiamondLoupe } from "./DiamondInterfaces/IDiamondLoupe.sol";
import { IERC165 } from "./DiamondInterfaces/IERC165.sol";
import { IERC173 } from "./DiamondInterfaces/IERC173.sol";

contract EcosystemDiamond is LMSToken {
    constructor(address[] memory _reviewers, address _owner) LMSToken(_reviewers) {
        LibDiamond.setContractOwner(_owner);

        // Add ERC165 data
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        ds.supportedInterfaces[type(IERC165).interfaceId] = true;
        ds.supportedInterfaces[type(IDiamondCut).interfaceId] = true;
        ds.supportedInterfaces[type(IDiamondLoupe).interfaceId] = true;
        ds.supportedInterfaces[type(IERC173).interfaceId] = true;
    }

    // Find facet for function that is called and execute the
    // function if a facet is found and return any value
    fallback() external payable {
        LibDiamond.DiamondStorage storage ds;
        bytes32 position = LibDiamond.DIAMOND_STORAGE_POSITION;
        assembly {
            ds.slot := position
        }
        address facet = ds.selectorToFacetAndPosition[msg.sig].facetAddress;
        require(facet != address(0), "Diamond: Function does not exist");
        assembly {
            calldatacopy(0, 0, calldatasize())
            let result := delegatecall(gas(), facet, 0, calldatasize(), 0, 0)
            returndatacopy(0, 0, returndatasize())
            switch result
            case 0 {
                revert(0, returndatasize())
            }
            default {
                return(0, returndatasize())
            }
        }
    }

    receive() external payable {}
}