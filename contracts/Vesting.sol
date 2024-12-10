//SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import { LMSToken } from "./LMS Token.sol";
import "@openzeppelin/contracts/finance/VestingWallet.sol";
import "@openzeppelin/contracts/finance/VestingWalletCliff.sol";

contract Vesting is LMSToken{
    LMSToken private immutable token;

    bytes32 public constant TEAM_ROLE = keccak256("TEAM_ROLE");
    bytes32 public constant INVESTOR_ROLE = keccak256("INVESTOR_ROLE");
    bytes32 public constant ADVISOR_ROLE = keccak256("ADVISOR_ROLE");

    uint256 public constant VESTING_POOL = (MAX_SUPPLY * 45) / 100;
    
    event AddressAdded(address indexed beneficiary, string role);
    event AddressRemoved(address indexed beneficiary, string role);
    event TokensLocked(address indexed beneficiary, uint256 amount);
    event TokensReleased(address indexed beneficiary, uint256 amount);

    address[] public investors;
    address[] public team;
    address[] public advisors;

    mapping (address => bool) public isInInvestor;
    mapping(address => bool) public isInTeam;
    mapping(address=> bool) public isInAdvisors;

    struct VestingSchedule {
        uint64 startTime;
        uint64 cliffTime;
        uint64 duration;
        uint64 interval; // New: Periodic release interval in seconds
    }
    mapping(address => VestingSchedule) public vestingSchedules;

    // Modifier to check unlock period conditions
    modifier validateLockParams(address beneficiary, uint256 tokenAmount) {
        require(beneficiary != address(0), "Invalid beneficiary address");
        require(tokenAmount > 0, "Token amount must be greater than 0");
        _;
    }

    
    struct Lock{
        uint256 amount;
        uint256 claimedAmount;
    }
    mapping(address => Lock) public tokenLocks;

    constructor(
        LMSToken _token,
        address admin
    ){
            require(address(_token) != address(0), "Invalid Token Address");
            require(admin != address(0), "Invalid Admin Address");

            token = _token;
            _grantRole(DEFAULT_ADMIN_ROLE, admin);
        }

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

    // Internal helper function to remove an address from an array
    function _removeFromArray(address[] storage array, address target) internal {
        uint256 length = array.length;
        for (uint256 i = 0; i < length; i++) {
            if (array[i] == target) {
                array[i] = array[length - 1];
                array.pop();
                break;
            }
        }
    }
 
    //function to add beneficiary to Investors Array
    function removeFromInvestors(address beneficiary) external onlyRole(DEFAULT_ADMIN_ROLE){
        require(isInInvestor[beneficiary], "Address not in Investors");
        _removeFromArray(investors, beneficiary);
        isInInvestor[beneficiary] = false;
        _revokeRole(INVESTOR_ROLE, beneficiary);

        emit AddressRemoved(beneficiary, "Investor");
    }

    //function to add beneficiary to Team Array
    function removeFromTeam(address beneficiary) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(isInTeam[beneficiary], "Address not in Team");
        _removeFromArray(team, beneficiary);
        isInTeam[beneficiary] = false;
        _revokeRole(TEAM_ROLE, beneficiary);

        emit AddressRemoved(beneficiary, "Team");
    }

    //function to add beneficiarys to Advisors Array
    function removeFromAdvisors(address beneficiary) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(isInAdvisors[beneficiary], "Address not in Advisors");
        _removeFromArray(advisors, beneficiary);
        isInAdvisors[beneficiary] = false;
        _revokeRole(ADVISOR_ROLE, beneficiary);

        emit AddressRemoved(beneficiary, "Advisors");
    }

    function setVestingSchedule(address beneficiary,uint64 startTime,uint64 cliffTime,uint64 duration,uint64 interval)
    external onlyRole(DEFAULT_ADMIN_ROLE)
        {
        require(vestingSchedules[beneficiary].startTime == 0, "Vesting schedule already set");
        require(duration > cliffTime, "Duration must be greater than cliff time.");
        require(interval > 0, "Interval must be greater than 0");
        vestingSchedules[beneficiary] = VestingSchedule({
            startTime: startTime,
            cliffTime:cliffTime,
            duration: duration,
            interval: interval
        });
        }
    //function to lock tokens for a specified duration
    function lockTokens(address beneficiary,uint256 tokenAmount, uint256 claimedAmount) 
    internal onlyRole(DEFAULT_ADMIN_ROLE) validateLockParams(beneficiary, tokenAmount)
    {
        //ensuring there are enough tokens in the contract to lock
        require(token.balanceOf(address(this)) >= tokenAmount, "Not enough tokens in contract");
        //check to ensure participant already has locked tokens to prevent overallocation
        require(tokenLocks[beneficiary].amount == 0, "Tokens already locked for this beneficiary");

        tokenLocks[beneficiary] = Lock({
                amount: tokenAmount,
                claimedAmount: claimedAmount});

        // Emit event for locking tokens
        emit TokensLocked(beneficiary, tokenAmount);

    }
    //This function releases vested tokens allowing beneficiarys claim unclaimed tokens
    function releaseVestedTokens() external {
        VestingSchedule storage schedule = vestingSchedules[msg.sender];
        Lock storage lockData = tokenLocks[msg.sender];

        require(schedule.startTime > 0, "No vesting schedule");
        require(block.timestamp >= schedule.startTime, "Vesting not started");

        uint256 totalAmount = lockData.amount;
        require(totalAmount > 0, "No tokens to release");

        uint64 elapsedTime = uint64(block.timestamp) - schedule.startTime;
        require(elapsedTime >= schedule.cliffTime, "Cliff period not reached");

        uint64 elapsedIntervals = elapsedTime / schedule.interval;
        uint64 totalIntervals = schedule.duration / schedule.interval;

        uint256 vestedAmount = (elapsedIntervals >= totalIntervals)
            ? totalAmount
            : (totalAmount * elapsedIntervals) / totalIntervals;

        uint256 claimableAmount = vestedAmount - lockData.claimedAmount;
        require(claimableAmount > 0, "No tokens available to claim");

        uint256 amount = lockData.amount;

        lockData.claimedAmount += claimableAmount;
        token.transfer(msg.sender, claimableAmount);

        emit TokensReleased(msg.sender, claimableAmount);
    }
    
    //added a function to get all vesting details 
    function getVestingDetails(address beneficiary)
        external
        view
        returns (
            uint256 lockedAmount,
            uint256 claimedAmount,
            uint256 claimableAmount,
            uint64 cliffTime,
            uint64 duration,
            uint64 interval
        )
    {
        VestingSchedule memory schedule = vestingSchedules[beneficiary];
        Lock memory lockData = tokenLocks[beneficiary];

        uint256 vestedAmount = (block.timestamp >= schedule.startTime + schedule.duration)
            ? lockData.amount
            : (lockData.amount * ((block.timestamp - schedule.startTime) / schedule.interval)) / (schedule.duration / schedule.interval);

        uint256 claimable = vestedAmount - lockData.claimedAmount;

        return (
            lockData.amount,
            lockData.claimedAmount,
            claimable,
            schedule.cliffTime,
            schedule.duration,
            schedule.interval
        );
    }

}