import React, { useState, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useHoneycomb } from '../hooks/useHoneycomb';
import { Dashboard } from './Dashboard';
import { Game } from './Game';
import { KEY_BADGE_INDEX } from '../constants';
import { honeycombClient } from '../services/honeycomb';

// Helper to map SDK Profile to our App's HCB_Profile type
const mapSDKProfileToAppProfile = (sdkProfile: any) => {
    return {
        address: sdkProfile.address,
        name: sdkProfile.info?.name || '',
        bio: sdkProfile.info?.bio || '',
        pfp: sdkProfile.info?.pfp || '',
        project: sdkProfile.project,
        xp: (sdkProfile.platformData as any)?.xp || 0,
        achievements: (sdkProfile.platformData as any)?.achievements || [],
        badges: (sdkProfile.platformData as any)?.badges || [],
        customData: (sdkProfile.customData as any) || [],
    };
};

export const GameView: React.FC = () => {
  const { connected, publicKey } = useWallet();
  const {
    project,
    profile,
    isLoading,
    error,
    txSignature,
    createBadge,
    createProfile,
    claimKeyBadge,
  } = useHoneycomb();

  // Function to handle profile refetch
  const handleProfileRefetch = useCallback(async () => {
    if (project && publicKey) {
      try {
        const { profile: profiles } = await honeycombClient.findProfiles({
          projects: [project.address],
          addresses: [publicKey.toBase58()],
        });
        
        if (profiles && profiles.length > 0) {
          const mappedProfile = mapSDKProfileToAppProfile(profiles[0]);
          window.location.reload(); // Reload to reset the game state with the profile
        }
      } catch (e) {
        console.error('Profile refetch failed:', e);
      }
    }
  }, [project, publicKey]);

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

  // Debug logging
  console.log('GameView Debug:', {
    connected,
    hasProject: !!project,
    hasProfile: !!profile,
    isLoading,
    profileData: profile
  });

  const renderContent = () => {
    // FIRST PRIORITY: If we have a profile, show the game immediately
    if (profile) {
      console.log('Showing game because profile exists:', profile);
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
              message="Welcome, Player! Use WASD or Arrow Keys to move and jump. Collect the key to unlock the door!"
          />
        </div>
      );
    }

    // If wallet not connected
    if (!connected) {
      console.log('Showing wallet connection screen');
      return (
        <div className="flex flex-col items-center justify-center bg-brand-surface p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4">Welcome to the Duck Game!</h2>
          <p className="text-brand-text-muted mb-6 text-center">Connect your Solana wallet to begin your on-chain adventure.</p>
          <WalletMultiButton style={{ backgroundColor: '#e94560', color: 'white' }} />
        </div>
      );
    }

    // If connected but currently loading (creating profile)
    if (connected && isLoading) {
      console.log('Showing loading screen');
      return (
        <div className="flex flex-col items-center justify-center bg-brand-surface p-8 rounded-lg shadow-lg">
          <div className="animate-spin h-8 w-8 border-4 border-brand-secondary border-t-transparent rounded-full mb-4"></div>
          <p className="text-brand-text-muted">Processing... Please wait</p>
          {error && <p className="text-red-400 text-sm mt-2">Error: {error}</p>}
        </div>
      );
    }

    // If connected, not loading, check profile state
    if (connected && !profile) {
      console.log('Checking profile state');
      
      // If there's an error about existing profile, show the game interface
      if (error && error.includes("User already exists with profile")) {
        console.log('User has existing profile, refetching...');
        
        // Trigger the profile refetch
        handleProfileRefetch();
        
        return (
          <div className="flex flex-col items-center justify-center bg-brand-surface p-8 rounded-lg shadow-lg">
            <div className="animate-spin h-8 w-8 border-4 border-brand-secondary border-t-transparent rounded-full mb-4"></div>
            <p className="text-brand-text-muted">Loading your profile...</p>
          </div>
        );
      }

      console.log('Showing profile creation screen');
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

    // Fallback - shouldn't reach here
    console.log('Fallback screen');
    return (
      <div className="flex flex-col items-center justify-center bg-brand-surface p-8 rounded-lg shadow-lg">
        <p className="text-brand-text-muted">Something went wrong. Please refresh the page.</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 bg-brand-secondary text-white px-4 py-2 rounded hover:bg-opacity-90"
        >
          Refresh Page
        </button>
      </div>
    );
  };

  return <div className="w-full">{renderContent()}</div>;
};