"use client";
import React, { useState, useEffect } from 'react';
import { createWalletClient, custom, serializeTransaction, hexToSignature, keccak256, parseGwei, formatEther, encodeFunctionData } from 'viem';
import { suaveRigil, localhost } from 'viem/chains';
import { TransactionRequestSuave, SuaveTxTypes } from '../node_modules/viem/chains/suave/types'
import { CCR } from './ccr';
import { deployedAddress, kettleAddress } from '@/constants/addresses';
import { abi } from '@/constants/abi';
import Header from '@/components/Header';
import Links from '@/components/Links';

export default function Home() {
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState(0);
  const [provider, setProvider] = useState({})
  const [hash, setHash] = useState('')
  const [contractState, setContractState] = useState('');

  // needs to be set manually for CCRs using eth_sign method
  var nonce = 0;

  const connectWallet = async () => {
      if (typeof window.ethereum !== 'undefined') {
          try {
              const [account] = await window.ethereum.request({ method: 'eth_requestAccounts' });
              setAccount(account);
              const suaveProvider = suaveRigil.newPublicClient(custom(ethereum));
              setProvider(suaveProvider);
          } catch (error) {
              console.error("Error connecting to wallet:", error);
          }
      } else {
          console.log('Please install a browser wallet');
      }
  };

  useEffect(() => {
    if (Object.keys(provider).length > 0) {
      const fetchBalance = async () => {
        const balanceFetched = await provider.getBalance({ address: account });
        setBalance(formatEther(balanceFetched));
      };

      fetchBalance();
    }
  }, [account, hash]);

  const getFunds = async () => {
    // default funded key in local SUAVE devenv
    const privateKey = '0x91ab9a7e53c220e6210460b65a7a3bb2ca181412a8a7b43ff336b3df1737ce12';
    const fundingWallet = suaveRigil.newWallet({privateKey: privateKey, transport: custom(ethereum)});
    const fundTx = {
        to: account,
        value: 1000000000000000000n,
        type: '0x0' as '0x0',
        gas: 21000n,
        gasPrice: 1000000000n,
    } as TransactionRequestSuave;
    const sendRes = await fundingWallet.sendTransaction(fundTx);
    setHash(sendRes);
  }

  const sendExample = async () => {
    const CCR: TransactionRequestSuave = {
      confidentialInputs: '0x',
      kettleAddress: '0xB5fEAfbDD752ad52Afb7e1bD2E40432A485bBB7F', // Use 0x03493869959C866713C33669cA118E774A30A0E5 on Rigil.
      to: deployedAddress,
      gasPrice: parseGwei('0.0000000002'), 
      gas: parseGwei('0.0002'),
      type: SuaveTxTypes.ConfidentialRequest, 
      chainId: 16813125, // chain id of local SUAVE devnet and Rigil
      data: encodeFunctionData({
        abi,
        functionName: 'example',
      }),
      nonce
    };
    if (account) {
      const wallet = createWalletClient({ 
        account, 
        transport: custom(ethereum)
      });
      const serialized = serializeTransaction(CCR);
      const serializedHash = keccak256(serialized);
      const hexSignature = await (window as any).ethereum.request({ method: 'eth_sign', params: [account, serializedHash] });
      const signature = hexToSignature(hexSignature);
      const serializedSignedTx = serializeTransaction(CCR, signature);
      const hash = await wallet.sendRawTransaction({
          serializedTransaction: serializedSignedTx as `0x${string}`
      });
      console.log(`Transaction hash: ${hash}`);
      nonce++;
    }
  }

  const sendNilExample = async () => {
    alert("A confidential request fails if it tries to modify the state directly.")
  }

  const fetchState = async () => {
    const data = await provider.readContract({
      address: deployedAddress,
      abi,
      functionName: 'getState',
    });
    const toDisplay = (data as any).toString();
    console.log(toDisplay);
    setContractState(toDisplay);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      
      <Header />

      <div className="flex flex-col gap-4 lg:flex-row w-[1024px]">
        <div className="flex-1 border border-gray-300 bg-gradient-to-b from-zinc-200 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 lg:rounded-xl p-10">
          <p className='text-2xl font-bold mt-4 mb-8'>
            Account Actions
          </p>
          <div className="relative flex my-8">
            {account ? 
            <div>
              <p><b>Connected Account:</b></p>
              <p>{account ? `${account.slice(0, 5)}...${account.slice(-5)}` : 'Not connected'}</p>
            </div> : 
            <button 
              className='border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30'
              onClick={() => connectWallet()}
              >
                Connect Wallet
              </button>}
          </div>
          <div className="relative flex my-8">
              <p><b>Your balance:</b> {balance}</p>
          </div>
          {account && (
            <div className="relative flex my-8">
                <button 
                  className='border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30'
                  onClick={() => getFunds()}
                  >
                    Get Funds
                </button>
            </div>
          )}
        </div>

        <div className="flex-1 border border-gray-300 bg-gradient-to-b from-zinc-200 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 lg:rounded-xl p-10">
          <p className='text-2xl font-bold mt-4 mb-8'>
            Contract Actions
          </p>
          <p>Your contract is deployed locally at:</p>
          <p><b>{deployedAddress.slice(0, 5)}...{deployedAddress.slice(-5)}</b></p>
          {account && (
            <div>
              <div className='flex flex-col col-2 md:flex-row'>
                <div className='border border-gray-300 rounded-xl mx-2 my-4 p-4 w-full'>
                  <p className='text-l font-bold'>Use callback</p>
                  <button 
                    className='mt-4 border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30'
                    onClick={() => sendExample()}
                    >
                      example()
                  </button>
                </div>
                <div className='border border-gray-300 rounded-xl mx-2 my-4 p-4 w-full'>
                <p className='text-l font-bold'>Change directly</p>
                  <button 
                  className='mt-4 border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30'
                  onClick={() => sendNilExample()}
                  >
                    nilExample()
                  </button>
                </div>
              </div>
              <div>
              <button 
                  className='mt-4 border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30'
                  onClick={() => fetchState()}
                  >
                    State: {contractState}
                  </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div>
        <p>{hash}</p>
      </div>

      <Links />

    </main>
  )
}
