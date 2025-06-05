// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import "./DiamondInterfaces/IDiamondCut.sol";
import "./DiamondLibrary/LibDiamond.sol";

contract DiamondCutFacet is IDiamondCut {
    function diamondCut(
        FacetCut[] calldata _diamondCut,
        address _init,
        bytes calldata _calldata
    ) external override {
        LibDiamond.enforceIsContractOwner();
        LibDiamond.diamondCut(_diamondCut, _init, _calldata);
    }
}