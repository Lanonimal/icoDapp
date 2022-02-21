import { BigNumber, Contract, providers, utils } from "ethers";
import Head from "next/head";
import React, { useEffect, useRef, useState } from "react";
import Web3Modal from "web3modal";
import {
  NFT_CONTRACT_ABI,
  NFT_CONTRACT_ADDRESS,
  TOKEN_CONTRACT_ABI,
  TOKEN_CONTRACT_ADDRESS,
} from "../constants";
import styles from "../styles/Home.module.css";

export default function Home(){
  const zero = BigNumber.from(0); //a BigNumber '0'
  const [walletConnected, setWalletConnected] = useState(false); //keep track if user is connected or not
  const [loading, setLoading] = useState(false); // true when we wait for a tx to get mined
  const [tokensToBeClaimed, setTokensToBeClaimed] = useState(zero); //keep track of number of tokens that can be claimed based on how many nft's they hold and for which they havent claimed yet
  const [balanceOfTokens, setBalanceOfTokens] = useState(zero); // amount of tokens user holds
  const [tokenAmount, setTokenAmount] = useState(zero); //amount of tokens user wants to mint
  const [tokensMinted, setTokensMinted] = useState(zero); //amount of tokens minted out of max supply
  const web3ModalRef = useRef(); // reference to web3 modal which persists as long as page is open

  //function that checks how many tokens user can claim
  const getTokensToBeClaimed = async () =>{ 
    try {
      const provider = await getProviderOrSigner(); // read tx so only need provider
      const nftContract = new Contract( // instance of NFT contract
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        provider
      );
      const tokenContract = new Contract( // instance of Token contract
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider
      );
      
      const signer = await getProviderOrSigner(true); // need signer to get user's address
      const address = await signer.getAddress(); // get user's address
      const balance = await nftContract.balanceOf(address); // call balanceOf() from nftContract to get amount of nft's user holds
      if (balance === zero){ //balance is a BigNumber so compare to zero and not 0
        setTokensToBeClaimed(zero); // no nft's so user cant claim any tokens
      } else {
        var amount = 0; //keeps track of number of unclaimed tokens
        for (var i = 0; i < balance; i++) { // check for every nft if tokens have already been claimed
          const tokenId = await nftContract.tokenOfOwnerByIndex(address, i);
          const claimed = await tokenContract.tokenIdsClaimed(tokenId); // if this is 0/false, we'll increase the amount they can claim
          if (!claimed){
            amount++;
          }
        }
      }
      setTokensToBeClaimed(BigNumber.from(amount)); // set amount that user can claim, BigNumber bc tokensToBeClaimed is BigNumber.
    } catch (err) {
      console.error(err);
      setTokensToBeClaimed(zero); //set to zero if there's an error
    }
  };

  // function that checks amount of tokens held by an address
  const getBalanceOfTokens = async () =>{
    try {
      const provider = await getProviderOrSigner(); // only reading so provider is good
      const tokenContract = new Contract( //instance of token contract
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider
      );
      const signer = await getProviderOrSigner(true); // get signer so we can read their address
      const address = await signer.getAddress(); // get address
      const balance = await tokenContract.balanceOf(address); // get amount of tokens they hold
      setBalanceOfTokens(balance); // set balance, is already a BigNumber so no need to convert. 
    } catch (err) {
      console.error(err);
      setBalanceOfTokens(zero); // zero if error
    }
  };

  //function that mints 'amount' of tokens to a given address
  const mintToken = async(amount) => {
    try{
      const signer = await getProviderOrSigner(true); // need signer bc write tx
      const tokenContract = new Contract( // new instance of token contract
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        signer
      );
      const value = 0.001 * amount; // amount of eth user needs to send
      const tx = await tokenContract.mint(amount, {value: utils.parseEther(value.toString()),}); //value = price of 1 token, parsing value string to ether using utils library from ethers.js
      setLoading(true);
      await tx.wait(); // wait for tx to get minted
      setLoading(false);
      window.alert("Sucessfully minted Profit Unity Tokens");
      await getBalanceOfTokens();
      await getTotalTokensMinted();
      await getTokensToBeClaimed();
    } catch (err) {
      console.error(err);
    }
  };

  //function that lets user claim tokens
  const claimTokens = async() => {
    try{
      const signer = await getProviderOrSigner(true);
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        signer
      );
      const tx = await tokenContract.claim();
      setLoading(true);
      await tx.wait(); // wait for tx to get minted
      setLoading(false);
      window.alert("Sucessfully minted Profit Unity Tokens");
      await getBalanceOfTokens();
      await getTotalTokensMinted();
      await getTokensToBeClaimed();
    } catch (err) {
      console.error(err);
    }
  };

  //function that gets total amount of tokens minted
  const getTotalTokensMinted = async () => {
    try{
      const provider = await getProviderOrSigner();
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider
      );
      const _tokensMinted = await tokenContract.totalSupply(); // get amount of tokens minted, thats what totalSupply() does
      setTokensMinted(_tokensMinted);
    } catch(err){
      console.error(err)
    }
  };

  // function that we've been using to get signer or provider, if needSigner = false, it'll return a provider, if true a signer. 
  const getProviderOrSigner = async (needSigner = false) => {
    const provider = await web3ModalRef.current.connect(); // connect to metamask
    const web3Provider = new providers.Web3Provider(provider); // access current value of web3modal, bc it is a reference, to get underlying object

    const { chainId } = await web3Provider.getNetwork(); // if not connected to correct network, let user know and throw error
    if (chainId !== 4) {
      window.alert("Change the network to Rinkeby");
      throw new Error("Change the network to Rinkeby");
    }

    if (needSigner) { //logic to get a signer, if needSigner = true
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  };

  const connectWallet = async () => {
    try {
      await getProviderOrSigner(); // get provider from web3Modal, metamask in this case. When used for first time, user'll be asked to connect their wallet.
      setWalletConnected(true);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { //reacts to changes in state of website. array at end represents what changes will trigger it. whenever 'walletConected' changes, effect triggers.
    if (!walletConnected) { //create new instance of Web3Modal if wallet isnt connected
      web3ModalRef.current = new Web3Modal({ // assign Web3Modal class to reference object by setting current value. this value is persisted as long as the page is open.
        network: "rinkeby",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      connectWallet();
      getTotalTokensMinted();
      getBalanceOfTokens();
      getTokensToBeClaimed();
    }
  }, [walletConnected]);
  
  //function that renders a button based on the stat of the dapp
  const renderButton = () => {
    if (loading) { // if loading = true, return a button that displays loading
      return <button className={styles.button}>Loading...</button>; 
    } 

    if (tokensToBeClaimed > 0){ // user has tokens to claim so return a claim button
      return(
        <div>
          <div className={styles.description}>
            {tokensToBeClaimed * 10} Tokens can be claimed!
          </div>
          <button className={styles.button} onClick={claimTokens}>
            Claim Your Tokens
          </button>
        </div>
      );
    } 
    return ( //user doesnt have tokens to claim so return a mint button
      <div style={{display: "flex-col"}}>
        <div>
          <input type="number" placeholder="Amount of Tokens" className={styles.input} //Bignumber.from converts e.target.value to a BigNumber
            onChange={(e) => setTokenAmount(BigNumber.from(e.target.value))}>
          </input> 
        </div>
        <button className={styles.button} disabled={!(tokenAmount > 0)} //disable button if user can claim tokens 
          onClick={() => mintCryptoDevToken(tokenAmount)}>
            Mint Tokens 
          </button>
      </div>
    );
  };

  return ( //user interface
    <div>
      <Head>
        <title>Profit Unity</title>
        <meta name="description" content="ICO-Dapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to the Profit Unity Token ICO</h1>
          <div className={styles.description}>
            You can claim or mint Profit Unity Tokens here!
          </div>
          {walletConnected ? ( // ? : ternary operator, takes three operands: condition, ?(code to execute if condition is true), : (code to execute if condition is false)
            <div>
              <div className={styles.description}>
                You have minted {utils.formatEther(balanceOfTokens)} Profit Unity Tokens. {/*formatEther helps convert BigNumbers to string  */}
              </div>
              <div className={styles.description}>
                Overall {utils.formatEther(tokensMinted)}/10000 have been minted!
              </div>
              {renderButton()}
            </div>
          ) : (<button onClick={connectWallet} className={styles.button}>
            Connect your wallet
          </button>)
        }
        </div>
        <div>
          <img className={styles.image} src="./0.svg"/>
        </div>
      </div>
      <footer className={styles.footer}>
        Made with &#10084; by Zizou (Beloved Profit Unity member)
      </footer>
    </div>
  );
}