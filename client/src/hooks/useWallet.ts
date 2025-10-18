import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const ZORA_CHAIN_ID = import.meta.env.VITE_ZORA_CHAIN_ID || '7777777';
const TOKEN_ADDRESS = import.meta.env.VITE_VOLTC_TOKEN_ADDRESS;
const REQUIRED_BALANCE = Number(import.meta.env.VITE_REQUIRED_BALANCE) || 10000;

// ERC20 ABI for balanceOf
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)'
];

export const useWallet = () => {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const switchToZora = async (provider: ethers.BrowserProvider) => {
    try {
      await provider.send('wallet_switchEthereumChain', [
        { chainId: `0x${parseInt(ZORA_CHAIN_ID).toString(16)}` }
      ]);
    } catch (switchError: any) {
      // Chain not added, add it
      if (switchError.code === 4902) {
        await provider.send('wallet_addEthereumChain', [{
  chainId: `0x${parseInt(ZORA_CHAIN_ID).toString(16)}`,
  chainName: 'Base',
  nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
  rpcUrls: ['https://mainnet.base.org'],
  blockExplorerUrls: ['https://basescan.org']
}]);
      } else {
        throw switchError;
      }
    }
  };

  const checkBalance = async (provider: ethers.BrowserProvider, userAddress: string) => {
    try {
      const contract = new ethers.Contract(TOKEN_ADDRESS, ERC20_ABI, provider);
      const decimals = await contract.decimals();
      const balanceRaw = await contract.balanceOf(userAddress);
      const balanceFormatted = Number(ethers.formatUnits(balanceRaw, decimals));
      
      setBalance(balanceFormatted);
      setHasAccess(balanceFormatted >= REQUIRED_BALANCE);
      
      return balanceFormatted;
    } catch (err) {
      console.error('Error checking balance:', err);
      setError('Failed to check token balance');
      return 0;
    }
  };

  const connectWallet = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      if (!window.ethereum) {
        throw new Error('Please install MetaMask or Coinbase Wallet');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // Request account access
      const accounts = await provider.send('eth_requestAccounts', []);
      const userAddress = accounts[0];
      setAddress(userAddress);

      // Switch to Zora network
      await switchToZora(provider);

      // Check token balance
      await checkBalance(provider, userAddress);

    } catch (err: any) {
      console.error('Connection error:', err);
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAddress(null);
    setBalance(0);
    setHasAccess(false);
  };

  // Check if already connected
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' }).then((accounts: string[]) => {
        if (accounts.length > 0) {
          setAddress(accounts[0]);
          const provider = new ethers.BrowserProvider(window.ethereum);
          checkBalance(provider, accounts[0]);
        }
      });
    }
  }, []);

  return {
    address,
    balance,
    hasAccess,
    isConnecting,
    error,
    connectWallet,
    disconnectWallet,
    requiredBalance: REQUIRED_BALANCE
  };
};
