'use client';
import React, { useState, useEffect } from 'react';
import {
  custom,
  formatEther,
  encodeFunctionData,
  getFunctionSelector,
  Address,
  CustomTransport,
  Hex,
  encodeAbiParameters,
} from '@flashbots/suave-viem';
import {
  getSuaveWallet,
  getSuaveProvider,
  SuaveWallet,
  SuaveProvider,
  TransactionRequestSuave,
  TransactionReceiptSuave,
  TransactionSuave,
} from '@flashbots/suave-viem/chains/utils';

import { deployedAddress } from '@/constants/addresses';
import SealedBidAuction from '../../forge/out/SealedBidAuction.sol/SealedBidAuction.json';
import Header from '@/components/Header';
import Links from '@/components/Links';

export default function Home() {
  const [suaveWallet, setSuaveWallet] =
    useState<SuaveWallet<CustomTransport>>();
  const [balance, setBalance] = useState<string>();
  const [provider, setProvider] = useState<SuaveProvider<CustomTransport>>();
  const [hash, setHash] = useState<Hex>();
  const [latestSlotNumber, setLatestSlotNumber] = useState('');
  const [pendingReceipt, setPendingReceipt] =
    useState<Promise<TransactionReceiptSuave>>();
  const [receivedReceipt, setReceivedReceipt] =
    useState<TransactionReceiptSuave>();
  const [txResult, setTxResult] = useState<TransactionSuave>();

  useEffect(() => {
    if (provider) {
      fetchBalance();
      // fetchState();
    }
    if (pendingReceipt) {
      pendingReceipt.then((receipt) => {
        console.log('txReceipt received:', receipt);
        setReceivedReceipt(receipt);
        setPendingReceipt(undefined);
        if (!provider) {
          console.warn('no provider detected...');
          return;
        }
        provider
          .getTransaction({ hash: receipt.transactionHash })
          .then((tx) => {
            console.log('txResult received:', tx);
            setTxResult(tx as TransactionSuave);
          });
      });
    }
  }, [suaveWallet, hash, pendingReceipt, provider]);

  const connectWallet = async () => {
    const ethereum = window.ethereum;
    if (ethereum) {
      try {
        const [account] = await ethereum.request({
          method: 'eth_requestAccounts',
        });
        setSuaveWallet(
          getSuaveWallet({
            jsonRpcAccount: account as Address,
            transport: custom(ethereum),
          })
        );
        const suaveProvider = getSuaveProvider(custom(ethereum));
        setProvider(suaveProvider);
      } catch (error) {
        console.error('Error connecting to wallet:', error);
      }
    } else {
      console.log('Please install a browser wallet');
    }
  };

  const fetchBalance = async () => {
    if (!provider || !suaveWallet) {
      console.warn(`provider=${provider}\nsuaveWallet=${suaveWallet}`);
      return;
    }
    const balanceFetched = await provider.getBalance({
      address: suaveWallet.account.address,
    });
    setBalance(formatEther(balanceFetched));
  };

  const getFunds = async () => {
    // default funded key in local SUAVE devenv
    const privateKey =
      '0x91ab9a7e53c220e6210460b65a7a3bb2ca181412a8a7b43ff336b3df1737ce12';
    const fundingWallet = getSuaveWallet({
      privateKey: privateKey,
      transport: custom(window.ethereum),
    });
    const fundTx = {
      to: suaveWallet?.account.address,
      value: 1000000000000000000n,
      type: '0x0' as '0x0',
      gas: 21000n,
      gasPrice: 1000000000n,
    } as TransactionRequestSuave;
    const sendRes = await fundingWallet.sendTransaction(fundTx);
    setHash(sendRes);
  };

  // const sendExample = async () => {
  //   if (!provider || !suaveWallet) {
  //     console.warn(`provider=${provider}\nsuaveWallet=${suaveWallet}`);
  //     return;
  //   }
  //   const nonce = await provider.getTransactionCount({
  //     address: suaveWallet.account.address,
  //   });
  //   const ccr: TransactionRequestSuave = {
  //     confidentialInputs: '0x',
  //     kettleAddress: '0xB5fEAfbDD752ad52Afb7e1bD2E40432A485bBB7F', // Use 0x03493869959C866713C33669cA118E774A30A0E5 on Rigil.
  //     to: deployedAddress,
  //     gasPrice: 2000000000n,
  //     gas: 100000n,
  //     type: '0x43',
  //     chainId: 16813125, // chain id of local SUAVE devnet and Rigil
  //     data: encodeFunctionData({
  //       abi: OnChainState.abi,
  //       functionName: 'example',
  //     }),
  //     nonce,
  //   };
  //   const hash = await suaveWallet.sendTransaction(ccr);
  //   console.log(`Transaction hash: ${hash}`);
  //   setPendingReceipt(provider.waitForTransactionReceipt({ hash }));
  // };

  const sendDataRecord = async () => {
    if (!provider || !suaveWallet) {
      console.warn(`provider=${provider}\nsuaveWallet=${suaveWallet}`);
      return;
    }

    // create sample transaction; won't land onchain, but will pass payload validation
    const encodedBid = encodeAbiParameters(
      [
        {
          components: [
            { type: 'bytes32', name: 'id' },
            { type: 'address', name: 'bidder' },
            { type: 'uint256', name: 'bidAmount' },
          ],
          type: 'tuple',
        },
      ],
      [
        {
          id: '0x0',
          bidder: suaveWallet?.account.address,
          bidAmount: 1000000000000000000n,
        },
      ]
    );

    const nonce = await provider.getTransactionCount({
      address: suaveWallet.account.address,
    });

    const ccr: TransactionRequestSuave = {
      confidentialInputs: encodedBid,
      kettleAddress: '0xB5fEAfbDD752ad52Afb7e1bD2E40432A485bBB7F', // Use 0x03493869959C866713C33669cA118E774A30A0E5 on Rigil.
      to: deployedAddress,
      gasPrice: 2000000000n,
      gas: 100000n,
      type: '0x43',
      chainId: 16813125, // chain id of local SUAVE devnet and Rigil
      data: encodeFunctionData({
        abi: SealedBidAuction.abi,
        functionName: 'sendBid',
      }),
      nonce,
    };

    const hash = await suaveWallet.sendTransaction(ccr);
    console.log(`Transaction hash: ${hash}`);
    setPendingReceipt(provider.waitForTransactionReceipt({ hash }));

    // const ccr: TransactionRequestSuave = {
    //   type: '0x43',
    //   chainId: 5,
    //   nonce: 0,
    //   gasPrice: 2000000000n,
    //   gas: 100000n,
    //   to: '0x0000000000000000000000000000000000000000' as Address,
    //   value: 1000000000000000000n,
    //   data: '0xf00ba7' as Hex,
    //   kettleAddress: '0xB5fEAfbDD752ad52Afb7e1bD2E40432A485bBB7F',
    //   confidentialInputs: encodedBid,
    //   nonce
    // };
  };

  // const sendNilExample = async () => {
  //   alert(
  //     'A confidential request fails if it tries to modify the state directly.'
  //   );
  // };

  const getLatestSlotNumber = async () => {
    if (!provider || !suaveWallet) {
      console.warn(`provider=${provider}\nsuaveWallet=${suaveWallet}`);
      return;
    }
    const data = await provider.readContract({
      address: deployedAddress,
      abi: SealedBidAuction.abi,
      functionName: 'getLatestSlot',
    });
    const toDisplay = (data as any).toString();
    setLatestSlotNumber(toDisplay);
  };

  // const fetchState = async () => {
  //   if (!provider || !suaveWallet) {
  //     console.warn(`provider=${provider}\nsuaveWallet=${suaveWallet}`);
  //     return;
  //   }
  //   const data = await provider.readContract({
  //     address: deployedAddress,
  //     abi: OnChainState.abi,
  //     functionName: 'state',
  //   });
  //   const toDisplay = (data as any).toString();
  //   setContractState(toDisplay);
  // };

  const account = suaveWallet?.account.address;

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-10 lg:p-24">
      <Header />
      <div className="flex flex-col gap-4 lg:flex-row w-full lg:w-[1024px] mt-8">
        <div className="flex-auto border border-gray-300 bg-gradient-to-b from-zinc-200 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 rounded-xl p-10">
          <p className="text-2xl font-bold mt-4 mb-8">Account Actions</p>
          <div className="relative flex my-8">
            {account ? (
              <div>
                <p>
                  <b>Connected Account:</b>
                </p>
                <code>
                  {suaveWallet.account.address
                    ? `${account.slice(0, 6)}...${account.slice(-4)}`
                    : 'Not connected'}
                </code>
              </div>
            ) : (
              <button
                className="border border-black rounded-lg bg-black text-white p-2 md:p-4 dark:bg-transparent dark:text-black"
                onClick={connectWallet}
              >
                Connect Wallet
              </button>
            )}
          </div>
          <div className="relative flex my-8">
            <p>
              <b>Your balance:</b> {balance}
            </p>
          </div>
          {account && (
            <div className="relative flex my-8">
              <button
                className="border border-black rounded-lg bg-black text-white p-2 md:p-4 dark:bg-transparent dark:text-black"
                onClick={getFunds}
              >
                Get Funds
              </button>
            </div>
          )}
        </div>

        <div className="flex-auto border border-gray-300 bg-gradient-to-b from-zinc-200 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 rounded-xl p-10">
          <p className="text-2xl font-bold mt-4 mb-8">Contract Actions</p>
          <p>
            Your contract is deployed locally at{' '}
            <code>
              <b>
                {deployedAddress.slice(0, 6)}...{deployedAddress.slice(-4)}
              </b>
            </code>
          </p>

          {account && (
            <div>
              <div className="flex flex-col col-2 md:flex-row">
                <div className="border border-gray-300 rounded-xl mx-2 my-4 p-4 w-full">
                  <p className="text-l font-bold">Use callback</p>
                  <button
                    className="border border-black rounded-lg bg-black text-white p-2 md:p-4 my-4 dark:bg-transparent dark:text-black"
                    onClick={sendDataRecord}
                  >
                    example()
                  </button>
                </div>
                <div className="border border-gray-300 rounded-xl mx-2 my-4 p-4 w-full">
                  <p className="text-l font-bold">Change directly</p>
                  <button
                    className="border border-black rounded-lg bg-black text-white p-2 md:p-4 my-4 dark:bg-transparent dark:text-black"
                    onClick={getLatestSlotNumber}
                  >
                    getLatestSlotNumber()
                  </button>
                </div>
              </div>
              <div>
                <p className="mt-4 border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl static w-auto rounded-xl border bg-gray-200 p-4 dark:text-black">
                  latestSlotNumber: {latestSlotNumber}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="row">
        {hash && (
          <div className="my-4 border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl static w-auto rounded-xl border bg-gray-200 p-4 w-full">
            <p>
              Funded wallet! Tx hash:{' '}
              <code>
                {hash.slice(0, 6)}...{hash.slice(-4)}
              </code>
            </p>
          </div>
        )}

        {pendingReceipt && (
          <div>
            <p>Fund transaction pending...</p>
          </div>
        )}

        {receivedReceipt && (
          <div>
            <p>
              Confidential Compute Request{' '}
              <code>
                {receivedReceipt.transactionHash.slice(0, 6)}...
                {receivedReceipt.transactionHash.slice(-4)}
              </code>
              {}{' '}
              <span
                style={{
                  color: receivedReceipt.status === 'success' ? '#0f0' : '#f00',
                }}
              >
                {receivedReceipt.status}
              </span>
            </p>
          </div>
        )}
      </div>

      {txResult && (
        <div>
          <p>
            Confidential Compute Result{' '}
            <code
              style={{
                color:
                  txResult.confidentialComputeResult ===
                  getFunctionSelector('exampleCallback()')
                    ? '#0f0'
                    : '#f00',
              }}
            >
              {txResult.confidentialComputeResult}
            </code>
          </p>
        </div>
      )}

      <Links />
    </main>
  );
}
