// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract LMSToken is ERC20, AccessControl {
    uint256 public constant MAX_SUPPLY = 10000000000 * 10 ** 18;
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    event MintSuccess(address indexed _to, uint256 indexed _amount);
    event BurnSuccess(address indexed _account, uint256 _amount);

    constructor(address[] memory _admins) ERC20("ABYA TOKEN", "ABYTKN") {
        require(_admins.length >= 2, "At least 2 admins are required");

        // Assign the deployer the default admin role
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);

        // Grant each admin the ADMIN_ROLE
        for (uint256 i = 0; i < _admins.length; i++) {
            _grantRole(ADMIN_ROLE, _admins[i]);
        }
    }

    // Mint function
    function mintToken(address to, uint256 amount) internal virtual returns(bool) {
        require(amount + totalSupply() <= MAX_SUPPLY, "Limit Exceeded!");
        _mint(to, amount);
        emit MintSuccess(to, amount);
        return true;
    }

    // Burn function
    function burn(address account, uint256 amount) internal virtual {
        require(balanceOf(account) >= amount, "Insufficient balance");
        _burn(account, amount);
        emit BurnSuccess(account, amount);
    }

    // Add a new admin
    function addAdmin(address newAdmin) external onlyRole(ADMIN_ROLE) {
        _grantRole(ADMIN_ROLE, newAdmin);
    }

    // Remove an admin (restricted to DEFAULT_ADMIN_ROLE)
    function removeAdmin(address admin) external onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(ADMIN_ROLE, admin);
    }

    // Check if an address has admin privileges
    function isAdmin(address account) public view returns (bool) {
        return hasRole(ADMIN_ROLE, account);
    }
}
