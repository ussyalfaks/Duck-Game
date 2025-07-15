
import React, { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { HONEYCOMB_RPC_URL } from './constants';
import { GameView } from './components/GameView';

function App() {
  const endpoint = useMemo(() => HONEYCOMB_RPC_URL, []);

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <div className="min-h-screen bg-brand-bg flex flex-col items-center p-4 sm:p-8">
            <header className="w-full max-w-7xl flex justify-between items-center mb-8">
              <h1 className="text-2xl sm:text-4xl font-bold text-white tracking-wider">
                Honeycomb <span className="text-brand-secondary">Duck Game</span>
              </h1>
            </header>
            <main className="w-full max-w-7xl">
              <GameView />
            </main>
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default App;
