
import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useHoneycomb } from '../hooks/useHoneycomb';
import { Dashboard } from './Dashboard';
import { Game } from './Game';
import { KEY_BADGE_INDEX } from '../constants';

export const GameView: React.FC = () => {
  const { connected } = useWallet();
  const {
    project,
    profile,
    isLoading,
    error,
    txSignature,
    createProject,
    createBadge,
    createProfile,
    claimKeyBadge,
  } = useHoneycomb();

  const [hasKey, setHasKey] = useState(false);

  const handleKeyCollect = async () => {
    try {
        await claimKeyBadge();
        setHasKey(true);
    } catch(e) {
        console.error("Key collection failed in GameView", e);
        // Do not set key if transaction fails
    }
  };

  const hasOnChainKey = profile?.badges?.includes(KEY_BADGE_INDEX) || false;

  const resetGame = () => {
      // For this demo, reloading is the easiest way to reset the Matter.js state
      window.location.reload();
  }

  const renderContent = () => {
    if (!connected) {
      return (
        <div className="flex flex-col items-center justify-center bg-brand-surface p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4">Welcome to the Duck Game!</h2>
          <p className="text-brand-text-muted mb-6 text-center">Connect your Solana wallet to begin your on-chain adventure.</p>
          <WalletMultiButton style={{ backgroundColor: '#e94560', color: 'white' }} />
        </div>
      );
    }

    if (!project) {
        return (
            <Dashboard 
                isLoading={isLoading} 
                error={error}
                txSignature={txSignature}
                isAdminView={true}
                onAdminAction={createProject}
                adminActionText="Create Game Project"
                message="No game project found. As the admin, create one to start."
            />
        );
    }

    if (!profile) {
        return (
            <Dashboard 
                isLoading={isLoading} 
                error={error}
                txSignature={txSignature}
                isAdminView={false}
                onPlayerAction={createProfile}
                playerActionText="Create Player Profile"
                message="Create your on-chain player profile to enter the game."
            />
        );
    }

    return (
      <div className="flex flex-col lg:flex-row gap-8 w-full">
        <Game
          onKeyCollect={handleKeyCollect}
          isKeyCollected={hasKey || hasOnChainKey}
          onPlayerDeath={resetGame}
        />
        <Dashboard
            isLoading={isLoading}
            error={error}
            txSignature={txSignature}
            isAdminView={true}
            project={project}
            profile={profile}
            onAdminAction={createBadge}
            adminActionText="Create 'Level 1 Key' Badge"
            message="Welcome, Player! Your on-chain stats are below."
        />
      </div>
    );
  };

  return <div className="w-full">{renderContent()}</div>;
};
