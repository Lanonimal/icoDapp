// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

interface IProfitUnity {
    function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256 tokenId); //returns tokenId owner by 'owner' at a given index of its toxen list. use with {balanceOf} to enumerat all of owner's tokens.
    function balanceOf(address owner) external view returns (uint256 balance); //returns number of tokens in owner's account. 
}