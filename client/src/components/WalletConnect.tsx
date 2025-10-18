import { useWallet } from '../hooks/useWallet';
import { Loader2 } from 'lucide-react';

export const WalletConnect = () => {
  const { address, balance, hasAccess, isConnecting, error, connectWallet, requiredBalance } = useWallet();

  if (hasAccess && address) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-40 px-4">
      <div className="bg-gray-900 rounded-lg p-8 max-w-md w-full border border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-6">Connect Wallet</h2>
        
        {!address ? (
          <>
            <p className="text-gray-300 mb-6">
              Connect your wallet to access exclusive content. You need {requiredBalance.toLocaleString()} VOLTc tokens.
            </p>
            <button
              onClick={connectWallet}
              disabled={isConnecting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Connecting...
                </>
              ) : (
                'Connect Wallet'
              )}
            </button>
          </>
        ) : (
          <>
            <p className="text-gray-300 mb-4">
              Connected: {address.slice(0, 6)}...{address.slice(-4)}
            </p>
		<p className="text-gray-300 mb-6 flex items-center justify-center gap-2">
  <img src="/voltc-icon.png" alt="VOLTc" className="w-6 h-6" />
  VOLTc Balance: <span className="font-bold">{balance.toLocaleString()}</span>
</p>
            
            {!hasAccess && (
              <div className="bg-red-900/30 border border-red-700 rounded-lg p-4">
                <p className="text-red-300 text-sm mb-3">
                  You need at least {requiredBalance.toLocaleString()} VOLTc tokens to access this content.
                </p>
                <button
                  onClick={() => window.open('https://app.uniswap.org/explore/tokens/base/0xA896E71a882A30caA1DADfeC95716E3586DcF14A?inputCurrency=NATIVE', '_blank')}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded font-semibold"
                >
                  Get VOLTc Tokens
                </button>
              </div>
            )}
          </>
        )}

        {error && (
          <p className="mt-4 text-red-400 text-sm">{error}</p>
        )}
      </div>
    </div>
  );
};
