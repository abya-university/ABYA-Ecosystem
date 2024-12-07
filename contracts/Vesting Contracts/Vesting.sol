//SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import { LMSToken } from "./LMS Token.sol";
import "@openzeppelin/contracts/finance/VestingWallet.sol";
import "@openzeppelin/contracts/finance/VestingWalletCliff.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract Vesting is LMSToken, AccessControl,VestingWallet{
    LMSToken private immutable token;

    bytes32 public constant TEAM_ROLE = keccak256("TEAM_ROLE");
    bytes32 public constant INVESTOR_ROLE = keccak256("INVESTOR_ROLE");
    bytes32 public constant ADVISOR_ROLE = keccak256("ADVISOR_ROLE");

    event AddressAdded(address indexed beneficiary, string role);
    event AddressRemoved(address indexed beneficiary, string role);
    event TokensLocked(address indexed beneficiary, uint256 amount, uint64 unlockTime);
    event TokensReleased(address indexed beneficiary, uint256 amount);

    address[] public investors;
    address[] public team;
    address[] public advisors;

    mapping (address => bool) public isInInvestor;
    mapping(address => bool) public isInTeam;
    mapping(address=> bool) public isInAdvisors;

    constructor(
        LMSToken _token,
        address admin
    )
        VestingWallet(admin, uint64(block.timestamp)){
            require(address(_token) != address(0), "Invalid Token Address");
            require(admin != address(0), "Invalid Admin Address");

            token = _token;
            _setupRole(DEFAULT_ADMIN_ROLE, admin);
        }
    

    struct Lock{
        uint256 amount;
        uint64 unlockTime;
    }
    mapping(address => Lock) public tokenLocks;


    //function to add beneficiary to Investors Array
    function addToInvestors(address beneficiary) external onlyRole(DEFAULT_ADMIN_ROLE){
        require(!isInInvestor[beneficiary], "Already added to Investors");
        investors.push(beneficiary);
        isInInvestor[beneficiary] = true;
        _grantRole(INVESTOR_ROLE, beneficiary);

        emit AddressAdded(beneficiary, "Investor");
    }

    //function to add beneficiary to Team Array
    function addTeamMember(address beneficiary) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(!isInTeam[beneficiary], "Already added to Team");
        team.push(beneficiary);
        isInTeam[beneficiary] = true;
        _grantRole(TEAM_ROLE, beneficiary);

        emit AddressAdded(beneficiary, "Team");
    }

    //function to add beneficiarys to Advisors Array
    function addToAdvisors(address beneficiary) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(!isInAdvisors[beneficiary], "Already added to Advisors");
        advisors.push(beneficiary);
        isInAdvisors[beneficiary] = true;
        _grantRole(ADVISOR_ROLE, beneficiary);

        emit AddressAdded(beneficiary, "Advisors");
    }

 
    //function to add beneficiary to Investors Array
    function removeFromInvestors(address beneficiary) external onlyRole(DEFAULT_ADMIN_ROLE){
        require(isInInvestor[beneficiary], "Address not in Investors");
        investors.pop(beneficiary);
        isInInvestor[beneficiary] = false;
        _revokeRole(INVESTOR_ROLE, beneficiary);

        emit AddressRemoved(beneficiary, "Investor");
    }

    //function to add beneficiary to Team Array
    function removeFromTeam(address beneficiary) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(isInTeam[beneficiary], "Address not in Team");
        team.pop(beneficiary);
        isInTeam[beneficiary] = false;
        _revokeRole(TEAM_ROLE, beneficiary);

        emit AddressRemoved(beneficiary, "Team");
    }

    //function to add beneficiarys to Advisors Array
    function removeFromAdvisors(address beneficiary) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(isInAdvisors[beneficiary], "Address not in Advisors");
        advisors.pop(beneficiary);
        isInAdvisors[beneficiary] = false;
        _revokedRole(ADVISOR_ROLE, beneficiary);

        emit AddressRemoved(beneficiary, "Advisors");
    }


    //function to lock tokens for a specified duration
    function lockTokens(address beneficiary, uint256 tokenAmount, uint64 unlockTime) internal onlyRole(DEFAULT_ADMIN_ROLE)
    {
        require(beneficiary != address(0), "Invalid beneficiary address");
        require(tokenAmount > 0, "Invalid token amount it must be greater than 0");
        require(unlockTime > block.timestamp, "Unlock time must be in the future");

        //ensuring there are enough tokens in the contract to lock
        require(balanceOf(address(this)) >= tokenAmount, "Not enough tokens in contract");

        //check to ensure participant already has locked tokens to prevent overallocation
        require(tokenLocks[beneficiary].amount == 0, "Tokens already locked for this beneficiary");

        tokenLocks[beneficiary] = Lock({
                amount: tokenAmount,
                unlockTime: unlockTime});

        // Emit event for locking tokens
        emit lockTokens(beneficiary, tokenAmount, unlockTime);

    }
    //This function releases vested tokens allowing beneficiarys claim unclaimed tokens
}