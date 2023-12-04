"use client";
import React, { useEffect, useState } from 'react';
import { createWalletClient, http } from 'viem';
import { suaveRigil } from 'viem/chains';
import { TransactionRequestSuave, SuaveTxTypes } from '../node_modules/viem/chains/suave/types'
import { deployedAddress } from '@/constants/addresses';
import { abi } from '@/constants/abi';
import Header from '@/components/Header';
import Links from '@/components/Links';

export default function Home() {
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState('');
  const [contractState, setContractState] = useState('');
  const suaveUrl = 'http://localhost:8545';
  const provider = suaveRigil.newPublicClient(http(suaveUrl));

  const connectWallet = async () => {
      if (typeof window.ethereum !== 'undefined') {
          try {
              const [account] = await window.ethereum.request({ method: 'eth_requestAccounts' });
              setAccount(account);
              const balanceFetched = await provider.getBalance({ address: account });
              setBalance(balanceFetched.toString());
          } catch (error) {
              console.error("Error connecting to wallet:", error);
          }
      } else {
          console.log('Please install MetaMask!');
      }
  };

  const getFunds = async () => {
    // default funded key in local SUAVE devenv
    const privateKey = '0x91ab9a7e53c220e6210460b65a7a3bb2ca181412a8a7b43ff336b3df1737ce12';
    const fundingWallet = suaveRigil.newWallet(privateKey, http(suaveUrl));
    const fundTx = {
        to: account,
        value: 1n,
        type: '0x0',
        gas: 21000n,
        gasPrice: 1000000000n,
    } as TransactionRequestSuave;
    const sendRes = await fundingWallet.sendTransaction(fundTx);
    console.log(`Transaction hash: ${sendRes}`);
  }

  const sendChangeState = async () => {
    const CCR: TransactionRequestSuave = {
      confidentialInputs: '0x',
      kettleAddress: '0xB5fEAfbDD752ad52Afb7e1bD2E40432A485bBB7F', // Address of your local Kettle. Use 0x03493869959C866713C33669cA118E774A30A0E5 if on Rigil.
      to: deployedAddress,
      gasPrice: 10000000000n, 
      gas: 420000n,
      type: SuaveTxTypes.ConfidentialRequest, 
      chainId: 16813125, // chain id of local SUAVE devnet
      data: '0x6fd43e7c00000000000000000000000000000000000000000000000000000000', // calling example()
    };
    if (account) {
      const wallet = createWalletClient({ 
        account, 
        chain: suaveRigil,
        transport: http(suaveUrl)
      });
      const sendRes = await wallet.sendTransaction(CCR);
      console.log(`Transaction hash: ${sendRes}`);
    }
  }

  const sendNotChangeState = async () => {
    const CCR: TransactionRequestSuave = {
      confidentialInputs: '0x',
      kettleAddress: '0xB5fEAfbDD752ad52Afb7e1bD2E40432A485bBB7F', // Address of your local Kettle. Use 0x03493869959C866713C33669cA118E774A30A0E5 if on Rigil.
      to: deployedAddress,
      gasPrice: 10000000000n, 
      gas: 420000n,
      type: SuaveTxTypes.ConfidentialRequest, 
      chainId: 16813125, // chain id of local SUAVE devnet
      data: '0xc0473c8100000000000000000000000000000000000000000000000000000000', // calling nilExample()
    };
    if (account) {
      const wallet = createWalletClient({ 
        account, 
        chain: suaveRigil,
        transport: http(suaveUrl)
      });
      const sendRes = await wallet.sendTransaction(CCR);
      console.log(`Transaction hash: ${sendRes}`);
    }
  }

  useEffect(() => {
    const fetchState = async () => {
      const data = await provider.readContract({
        address: deployedAddress,
        abi,
        functionName: 'getState',
      });
      const toDisplay = (data as any).toString();
      setContractState(toDisplay);
    };

    fetchState();
  }, [contractState]);

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
          {balance === '0'&& (
            <div className="relative flex my-8">
                <button 
                  className='border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30'
                  onClick={() => getFunds()}
                  >
                    Get Funds
                </button>
            </div>
          )}
          {account && (
            <div className="relative flex my-8">
                <button 
                  className='border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30'
                  onClick={() => getFunds()}
                  >
                    Get More Funds
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
                  <p className='text-l font-bold'>Change state</p>
                  <button 
                    className='mt-4 border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30'
                    onClick={() => sendChangeState()}
                    >
                      Send
                  </button>
                </div>
                <div className='border border-gray-300 rounded-xl mx-2 my-4 p-4 w-full'>
                <p className='text-l font-bold'>Same state</p>
                  <button 
                  className='mt-4 border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30'
                  onClick={() => sendNotChangeState()}
                  >
                    Send
                  </button>
                </div>
              </div>
              <div>
                <p>Contract state: <b>{contractState}</b></p>
              </div>
            </div>
          )}
        </div>
      </div>

      <Links />

    </main>
  )
}
