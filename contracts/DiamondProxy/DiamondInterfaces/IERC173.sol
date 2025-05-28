// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

interface IERC173 {
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    
    function owner() external view returns (address);
    function transferOwnership(address _newOwner) external;
}