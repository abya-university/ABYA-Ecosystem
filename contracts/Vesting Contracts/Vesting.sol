//SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import { LMSToken } from "./LMS Token.sol";
import "@openzeppelin/contracts/finance/VestingWallet.sol";
import "@openzeppelin/contracts/finance/VestingWalletCliff.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract Vesting is LMSToken, AccessControl,VestingWallet{
    bytes32 public constant TEAM_ROLE = keccak256("TEAM_ROLE");
    bytes32 public constant INVESTOR_ROLE = keccak256("INVESTOR_ROLE");
    bytes32 public constant ADVISOR_ROLE = keccak256("ADVISOR_ROLE");

    event addressAddedSuccess(address participant)
    event removeAddress(address participant)
    event lockTokens()
    event releaseVestedTokens()

    address[] public investors;
    address[] public team;
    address[] public advisors;

    mapping (address => bool) public isInInvestor;
    mapping(address => bool) public isInTeam;
    mapping(address=> bool) public isInAdvisors;

    //function to add address to an array this function will be reimplemented for specific groups
    function addToArray(address participant, address[] _addresses, mapping(address => bool)) external onlyRole(DEFAULT_ADMIN_ROLE){
        require(!isInMapping[participant], "Address already added");
        _addresses.push(participant);
        isInMapping[participant] = True;

        emit addressAddedSuccess(participant);
    }

    //function to add participant to Investors Array
    function addToInvestors(address participant) external onlyRole(DEFAULT_ADMIN_ROLE){
        addToArray(participant, investors, isInInvestor);
    }

    //function to add participant to Team Array
    function addTeamMember(address participant) external onlyRole(DEFAULT_ADMIN_ROLE) {
        addToArray(participant, team, isInTeam);
    }

    //function to add participants to Advisors Array
    function addToAdvisors(address participant) external onlyRole(DEFAULT_ADMIN_ROLE) {
        addToArray(participant, advisors, isInAdvisors)
    }

    //function to remove an address from an array
    function removeFromArray(address participant, address[] _addresses, mapping(address => bool)) external onlyRole(DEFAULT_ADMIN_ROLE){
        require(!isInMapping[participant], "Address exists");
        _addresses.pop(participant);
        isInMapping[participant] = False;

        emit removeAddress(participant);
    }


    //function to lock tokens for a specified duration
    //This function releases vested tokens allowing participants claim unclaimed tokens
}