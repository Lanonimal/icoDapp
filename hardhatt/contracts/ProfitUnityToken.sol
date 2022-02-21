 // SPDX-License-Identifier: MIT
  pragma solidity ^0.8.10;

  import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
  import "@openzeppelin/contracts/access/Ownable.sol";
  import "./IProfitUnity.sol";

  contract ProfitUnityToken is ERC20, Ownable {
      uint256 public constant tokenPrice = 0.001 ether; //the price per token. constant bc value wont change
      uint256 public constant tokensPerNft = 10 * 10**18; //user receives 10 tokens per nft. 10 * 10**18 because thats the smallest denomination possible for the token. Owning 1 token = 10^18.
      uint256 public constant maxTotalSupply = 10000 * 10**18; //max total supply for token
      IProfitUnity ProfitUnity; // ProfitUnity.sol contract instance 
      mapping(uint256 => bool) public tokenIdsClaimed; // keeps track of which tokenIds have been claimed
      constructor(address _profitUnityContract) ERC20("Profit Unity Token", "PU") {
          ProfitUnity = IProfitUnity(_profitUnityContract);
      }

      //function to mint tokens  
      function mint(uint256 amount) public payable{
          uint256 _requiredAmount = tokenPrice * amount; //value of eth that user sends must be greater than or equal to the required amount.
          require(msg.value >= _requiredAmount, "Eth sent is incorrect");
          uint256 amountWithDecimals = amount * 10**18;
          require( //amount that user wants to mint cant be bigger than the max supply.
              (totalSupply() + amountWithDecimals) <= maxTotalSupply, "Amount exceeds maximum supply" //totalsupply() gives amount of tokens already minted. 
          );
          _mint(msg.sender, amountWithDecimals); // call internal function from Openzeppeling ERC20 contract
      }

      // function that mints tokens based on amout of nft's user holds and lets them claim the minted tokens  
      function claim() public {
          address sender = msg.sender;
          uint256 balance = ProfitUnity.balanceOf(sender); // get amount of nft's sender holds
          require(balance > 0, "You dont own any Profit Unity NFT's"); // revert tx if they dont hold any
          uint256 amount = 0; // keeps track of amount of unclaimed tokenIds
          for (uint256 i = 0; i < balance; i++){ // loop through user's balance and get token ID owned by sender at given index of its token list
            uint256 tokenId = ProfitUnity.tokenOfOwnerByIndex(sender, i);
            if (!tokenIdsClaimed[tokenId]){ // increase amount if tokenId hasnt been claimed. not sure whats going on here.
                amount += 1;
                tokenIdsClaimed[tokenId] = true;
            }
          }
          require(amount > 0, "You have already claimed all the tokens"); // revert tx if all tokenIds have been claimed
          _mint(msg.sender, amount * tokensPerNft); //mint amount * 10 tokens for each nft
      }

      receive() external payable {} // receive eth if msg.data is empty
      fallback() external payable {} //receive eth if msg.data isnt empty
  }