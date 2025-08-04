import React, { useState, useCallback, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useHoneycomb } from '../hooks/useHoneycomb';
import { honeycombClient } from '../services/honeycomb';
import { Dashboard } from './Dashboard';
import { Game } from './Game';
import { KEY_BADGE_INDEX } from '../constants';

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
    canPlay,
    setProfile,
  } = useHoneycomb();

  const [hasKey, setHasKey] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  // Debug effect to track state changes
  useEffect(() => {
    console.log('GameView State Update:', {
      connected,
      hasPublicKey: !!publicKey,
      hasProject: !!project,
      hasProfile: !!profile,
      isLoading,
      error,
      profileData: profile ? {
        name: profile.name,
        address: profile.address,
        badges: profile.badges
      } : null
    });
  }, [connected, publicKey, project, profile, isLoading, error]);

  const handleKeyCollect = async () => {
    try {
        console.log('Attempting to claim key badge...');
        await claimKeyBadge();
        setHasKey(true);
        console.log('Key badge claimed successfully');
    } catch(e) {
        console.error("Key collection failed in GameView", e);
        // Do not set key if transaction fails
    }
  };

  const hasOnChainKey = profile?.badges?.includes(KEY_BADGE_INDEX) || false;

  const resetGame = () => {
      console.log('Resetting game...');
      // For this demo, reloading is the easiest way to reset the Matter.js state
      window.location.reload();
  }

  const handleCreateProfile = async () => {
    console.log('Create profile button clicked');
    await createProfile();
  };

  const handleReloadProfile = async () => {
    if (!publicKey || !project) return;
    
    setIsLoading(true);
    try {
      console.log('Manual profile reload requested');
      const { profile: profiles } = await honeycombClient.findProfiles({
        projects: [project.address],
        addresses: [publicKey.toBase58()],
      });

      if (profiles && profiles.length > 0) {
        const mappedProfile = mapSDKProfileToAppProfile(profiles[0]);
        console.log('Profile found on manual reload:', mappedProfile);
        setProfile(mappedProfile);
        setCanPlay(true);
        window.location.reload(); // Refresh to ensure clean state
      } else {
        // Try finding by user
        const { user: users } = await honeycombClient.findUsers({
          wallets: [publicKey.toBase58()]
        });

        if (users && users.length > 0 && users[0].profiles) {
          const projectProfile = users[0].profiles.find(p => p.project === project.address);
          if (projectProfile) {
            const mappedProfile = mapSDKProfileToAppProfile(projectProfile);
            console.log('Profile found via user search:', mappedProfile);
            setProfile(mappedProfile);
            setCanPlay(true);
            window.location.reload();
            return;
          }
        }
        
        setError('Profile still not found. It may take a few moments to appear on-chain.');
      }
    } catch (e) {
      console.error('Manual profile reload failed:', e);
      setError('Failed to reload profile');
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = () => {
    // FIRST PRIORITY: If we have a profile, show the game immediately
    if (profile) {
      console.log('Rendering game - profile exists:', {
        name: profile.name,
        badges: profile.badges,
        hasOnChainKey
      });
      
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
      console.log('Rendering wallet connection screen');
      return (
        <div className="flex flex-col items-center justify-center bg-brand-surface p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4">Welcome to the Duck Game!</h2>
          <p className="text-brand-text-muted mb-6 text-center">Connect your Solana wallet to begin your on-chain adventure.</p>
          <WalletMultiButton style={{ backgroundColor: '#e94560', color: 'white' }} />
        </div>
      );
    }

    // If connected but currently loading
    if (connected && isLoading) {
      console.log('Rendering loading screen');
      return (
        <div className="flex flex-col items-center justify-center bg-brand-surface p-8 rounded-lg shadow-lg">
          <div className="animate-spin h-8 w-8 border-4 border-brand-secondary border-t-transparent rounded-full mb-4"></div>
          <p className="text-brand-text-muted">
            {txSignature ? 'Transaction successful! Loading your profile...' : 'Processing... Please wait'}
          </p>
          {error && (
            <div className="mt-4 p-3 bg-red-900/20 border border-red-500 rounded text-red-400 text-sm max-w-md text-center">
              {error}
            </div>
          )}
          {txSignature && (
            <div className="mt-4 p-3 bg-green-900/20 border border-green-500 rounded text-green-400 text-sm max-w-md break-all text-center">
              <p>Transaction: {txSignature.substring(0, 20)}...</p>
              <a
                href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-green-300"
              >
                View in Explorer
              </a>
            </div>
          )}
        </div>
      );
    }

    // If connected, not loading, and no profile - show profile creation
    if (connected && !profile && !isLoading) {
      console.log('Rendering profile creation screen');
      
      return (
        <div className="w-full">
          <Dashboard 
              isLoading={isLoading} 
              error={error}
              txSignature={txSignature}
              isAdminView={false}
              onPlayerAction={handleCreateProfile}
              playerActionText="Create Player Profile"
              message="Create your on-chain player profile to enter the game. This will store your progress and achievements on the blockchain."
          />
          
          {/* Manual reload button for existing profiles */}
          {error && error.includes("Profile already exists") && (
            <div className="mt-4 bg-brand-surface p-4 rounded-lg text-center">
              <p className="text-brand-text-muted mb-3">
                Your profile exists but couldn't be loaded automatically.
              </p>
              <button
                onClick={handleReloadProfile}
                disabled={isLoading}
                className="bg-brand-primary text-white px-4 py-2 rounded hover:bg-opacity-90 disabled:bg-opacity-50"
              >
                {isLoading ? 'Loading...' : 'Load Existing Profile'}
              </button>
            </div>
          )}
          
          {/* Debug Information */}
          <div className="mt-8 bg-brand-surface p-4 rounded-lg">
            <button 
              onClick={() => setShowDebug(!showDebug)}
              className="text-sm text-brand-text-muted hover:text-white mb-2"
            >
              {showDebug ? 'Hide' : 'Show'} Debug Info
            </button>
            
            {showDebug && (
              <div className="text-xs text-brand-text-muted space-y-1">
                <p>Wallet: {publicKey?.toBase58()}</p>
                <p>Connected: {connected.toString()}</p>
                <p>Loading: {isLoading.toString()}</p>
                <p>Has Project: {(!!project).toString()}</p>
                <p>Has Profile: {(!!profile).toString()}</p>
                <p>Error: {error || 'None'}</p>
                <p>TX Signature: {txSignature || 'None'}</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Fallback - shouldn't reach here normally
    console.log('Rendering fallback screen');
    return (
      <div className="flex flex-col items-center justify-center bg-brand-surface p-8 rounded-lg shadow-lg">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold mb-2">Something's not right...</h3>
          <p className="text-brand-text-muted mb-4">
            Connected: {connected.toString()}<br/>
            Loading: {isLoading.toString()}<br/>
            Has Profile: {(!!profile).toString()}
          </p>
        </div>
        
        <div className="flex gap-4">
          <button 
            onClick={() => window.location.reload()} 
            className="bg-brand-secondary text-white px-4 py-2 rounded hover:bg-opacity-90"
          >
            Refresh Page
          </button>
          
          <button 
            onClick={handleCreateProfile}
            disabled={isLoading || !connected}
            className="bg-brand-primary text-white px-4 py-2 rounded hover:bg-opacity-90 disabled:bg-opacity-50"
          >
            Try Create Profile
          </button>
        </div>
        
        {error && (
          <div className="mt-4 p-3 bg-red-900/20 border border-red-500 rounded text-red-400 text-sm max-w-md text-center">
            {error}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full">
      {renderContent()}
    </div>
  );
};