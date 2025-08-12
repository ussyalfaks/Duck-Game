import React, { useState, useCallback, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useHoneycomb } from '../hooks/useHoneycomb';
import { honeycombClient } from '../services/honeycomb';
import { Dashboard } from './Dashboard';
import { Game } from './Game';
import { KEY_BADGE_INDEX, ADMIN_ADDRESS } from '../constants';

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
  const [gameStarted, setGameStarted] = useState(false);
  const [seasonComplete, setSeasonComplete] = useState(false);

  // Check if current wallet is the admin address
  const isAdmin = publicKey && publicKey.toBase58() === ADMIN_ADDRESS;

  // Debug effect to track state changes
  useEffect(() => {
    console.log('GameView State Update:', {
      connected,
      hasPublicKey: !!publicKey,
      hasProject: !!project,
      hasProfile: !!profile,
      isLoading,
      error,
      gameStarted,
      seasonComplete,
      isAdmin,
      adminAddress: ADMIN_ADDRESS,
      currentAddress: publicKey?.toBase58(),
      profileData: profile ? {
        name: profile.name,
        address: profile.address,
        badges: profile.badges
      } : null
    });
  }, [connected, publicKey, project, profile, isLoading, error, gameStarted, seasonComplete, isAdmin]);

  // DISABLED: Badge claiming functionality
  const handleKeyCollect = async () => {
    console.log('Key collected! (Badge claiming disabled)');
    // No longer claims badges - just local state
    setHasKey(true);
  };

  const handleSeasonComplete = () => {
    console.log('Season 1 completed!');
    setSeasonComplete(true);
  };

  const hasOnChainKey = profile?.badges?.includes(KEY_BADGE_INDEX) || false;

  // Handle player death/reset - no longer refreshes the page
  const resetGame = () => {
      console.log('Game reset requested - handled by Game component internally');
      // The Game component now handles resets internally with the hearts system
      // No need to reload the page or reset states here
  }

  const handleCreateProfile = async () => {
    console.log('Create profile button clicked');
    await createProfile();
  };

  const handleStartGame = () => {
    console.log('Starting Season 1...');
    setGameStarted(true);
    setSeasonComplete(false);
  };

  const handleBackToHome = () => {
    console.log('Going back to home...');
    setGameStarted(false);
    setSeasonComplete(false);
    setHasKey(false);
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
        // Don't reload the page anymore - let the hearts system handle game state
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

  // If game is started and profile exists, show the game
  if (gameStarted && profile) {
    console.log('Rendering Season 1 game - profile exists:', {
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
          onSeasonComplete={handleSeasonComplete}
        />
        <div className="w-full lg:w-1/3 bg-brand-surface p-6 rounded-lg shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-brand-secondary">Season 1</h2>
              <button
                onClick={handleBackToHome}
                className="bg-brand-primary text-white px-4 py-2 rounded hover:bg-opacity-90"
              >
                Back to Home
              </button>
            </div>
            <p className="text-brand-text-muted mb-6">
              Complete all 5 levels in 30 seconds! Use WASD or Arrow Keys to move and jump. 
              Collect the key to unlock the door in each level! You have 3 hearts per season.
            </p>
            
            {profile && (
              <div className="mb-6">
                <div className="flex items-center gap-4 mb-4">
                  <img src={profile.pfp} alt="Player PFP" className="w-16 h-16 rounded-full bg-brand-primary" />
                  <div>
                    <h3 className="text-xl font-bold">{profile.name}</h3>
                    <p className="text-sm text-brand-text-muted font-mono break-all">{profile.address}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p><strong>XP:</strong> {profile.xp}</p>
                  <div>
                    <strong>Status:</strong>
                    {seasonComplete ? (
                      <span className="ml-2 inline-block bg-green-500 text-white px-2 py-1 text-xs font-bold rounded">Season 1 Complete!</span>
                    ) : (
                      <span className="ml-2 inline-block bg-blue-500 text-white px-2 py-1 text-xs font-bold rounded">In Progress</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Game Instructions */}
            <div className="bg-brand-primary bg-opacity-10 p-4 rounded-lg mb-6">
              <h4 className="font-bold mb-2">Game Rules:</h4>
              <ul className="space-y-1 text-sm">
                <li>• Use WASD or Arrow Keys to move</li>
                <li>• Jump with W, Up Arrow, or Spacebar</li>
                <li>• Collect the key in each level</li>
                <li>• Reach the door to complete the level</li>
                <li>• Avoid spikes - they cost 1 heart!</li>
                <li>• Complete all 5 levels before time runs out</li>
                <li>• You have 3 hearts per season</li>
              </ul>
            </div>

            {/* Heart System Explanation */}
            <div className="bg-red-100 border border-red-300 p-4 rounded-lg mb-6">
              <h4 className="font-bold text-red-800 mb-2">💖 Heart System:</h4>
              <ul className="space-y-1 text-sm text-red-700">
                <li>• Start each season with 3 hearts</li>
                <li>• Lose 1 heart when touching spikes</li>
                <li>• Losing a heart restarts the current level</li>
                <li>• Get 2 seconds of invincibility after damage</li>
                <li>• Lose all hearts = restart the entire season</li>
              </ul>
            </div>

            {/* Debug Panel (for admin) */}
            {isAdmin && (
              <div className="bg-gray-100 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-bold">Admin Debug Panel</h4>
                  <button 
                    onClick={() => setShowDebug(!showDebug)}
                    className="text-xs bg-gray-300 px-2 py-1 rounded"
                  >
                    {showDebug ? 'Hide' : 'Show'} Debug
                  </button>
                </div>
                
                {showDebug && (
                  <div className="space-y-2 text-xs">
                    <p><strong>Connected:</strong> {connected.toString()}</p>
                    <p><strong>Has Profile:</strong> {!!profile}</p>
                    <p><strong>Can Play:</strong> {canPlay.toString()}</p>
                    <p><strong>Is Loading:</strong> {isLoading.toString()}</p>
                    {error && <p><strong>Error:</strong> {error}</p>}
                    <p><strong>Game Started:</strong> {gameStarted.toString()}</p>
                    <p><strong>Season Complete:</strong> {seasonComplete.toString()}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Transaction Status */}
          {txSignature && (
            <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded-lg">
              <p className="text-sm font-semibold text-green-800">Transaction Confirmed!</p>
              <a
                href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-green-600 underline break-all"
              >
                {txSignature}
              </a>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-brand-secondary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-brand-text-muted">Loading game...</p>
        </div>
      </div>
    );
  }

  // Not connected state
  if (!connected) {
    return (
      <div className="text-center max-w-4xl mx-auto">
        {/* Header with wallet connection */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-brand-secondary">Welcome to Season 1!</h1>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-brand-text-muted mb-1">
                {connected ? 'Wallet Connected' : 'Connect Your Wallet'}
              </p>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-xs font-mono">
                  {connected && publicKey ? 
                    `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}` : 
                    'Not Connected'
                  }
                </span>
              </div>
            </div>
            <WalletMultiButton className="!bg-brand-primary !text-white hover:!bg-opacity-90 !rounded-lg !px-6 !py-3 !font-bold" />
          </div>
        </div>

        <p className="text-xl text-brand-text-muted mb-8">
          Connect your wallet to start your adventure. Navigate through 5 challenging levels, 
          collect keys, avoid spikes, and complete the season before time runs out!
        </p>

        <div className="bg-brand-surface p-6 rounded-lg shadow-lg mb-6">
          <h3 className="text-xl font-bold mb-4">Game Features:</h3>
          <div className="grid md:grid-cols-2 gap-4 text-left">
            <div>
              <h4 className="font-semibold text-brand-secondary">🎮 Platformer Action</h4>
              <p className="text-sm text-brand-text-muted">Jump, run, and navigate through challenging levels</p>
            </div>
            <div>
              <h4 className="font-semibold text-brand-secondary">⏱️ Time Challenge</h4>
              <p className="text-sm text-brand-text-muted">Complete all levels within the time limit</p>
            </div>
            <div>
              <h4 className="font-semibold text-brand-secondary">💖 Heart System</h4>
              <p className="text-sm text-brand-text-muted">3 hearts per season - avoid spikes!</p>
            </div>
            <div>
              <h4 className="font-semibold text-brand-secondary">🔑 Key Collection</h4>
              <p className="text-sm text-brand-text-muted">Find keys to unlock doors and progress</p>
            </div>
          </div>
        </div>

        {/* Wallet Connection Instructions */}
        <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg mb-6">
          <h3 className="text-lg font-bold text-blue-800 mb-3">📝 How to Connect Your Wallet:</h3>
          <div className="text-left space-y-2 text-blue-700">
            <p className="flex items-start gap-2">
              <span className="font-bold">1.</span>
              Click the "Select Wallet" button above
            </p>
            <p className="flex items-start gap-2">
              <span className="font-bold">2.</span>
              Choose your preferred Solana wallet (Phantom, Solflare, etc.)
            </p>
            <p className="flex items-start gap-2">
              <span className="font-bold">3.</span>
              Approve the connection in your wallet
            </p>
            <p className="flex items-start gap-2">
              <span className="font-bold">4.</span>
              Create your player profile and start playing!
            </p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <p className="text-brand-text-muted mb-4">
            Ready to begin your adventure?
          </p>
          {!connected && (
            <div className="animate-pulse">
              <WalletMultiButton className="!bg-brand-secondary !text-white hover:!bg-opacity-90 !rounded-lg !px-8 !py-4 !font-bold !text-lg" />
            </div>
          )}
        </div>
      </div>
    );
  }

  // No profile state
  if (!profile && !isLoading) {
    return (
      <div className="text-center max-w-2xl mx-auto">
        {/* Header with wallet status */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-brand-secondary">Create Your Player Profile</h1>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-brand-text-muted mb-1">Wallet Status</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-xs font-mono">
                  {publicKey ? 
                    `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}` : 
                    'Connected'
                  }
                </span>
              </div>
            </div>
            <WalletMultiButton className="!bg-brand-primary !text-white hover:!bg-opacity-90 !rounded-lg !px-4 !py-2" />
          </div>
        </div>

        <p className="text-xl text-brand-text-muted mb-8">
          You need a player profile to start your adventure. Create one now to begin Season 1!
        </p>
        
        <div className="bg-brand-surface p-6 rounded-lg shadow-lg mb-6">
          <h3 className="text-xl font-bold mb-4">What you'll get:</h3>
          <ul className="text-left space-y-2">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-brand-secondary rounded-full"></span>
              A unique player identity on the blockchain
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-brand-secondary rounded-full"></span>
              XP and achievement tracking
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-brand-secondary rounded-full"></span>
              Badge collection system
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-brand-secondary rounded-full"></span>
              Season completion records
            </li>
          </ul>
        </div>

        <button
          onClick={handleCreateProfile}
          disabled={isLoading}
          className="bg-brand-secondary text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Creating Profile...' : 'Create Player Profile'}
        </button>

        {error && (
          <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded-lg">
            <p className="text-red-800">{error}</p>
            <button
              onClick={handleReloadProfile}
              className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Retry / Reload Profile
            </button>
          </div>
        )}
      </div>
    );
  }

  // Profile exists but game not started
  if (profile && !gameStarted) {
    return (
      <div className="text-center max-w-2xl mx-auto">
        {/* Header with wallet status */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-brand-secondary">Ready for Season 1?</h1>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-brand-text-muted mb-1">Wallet Connected</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-xs font-mono">
                  {publicKey ? 
                    `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}` : 
                    'Connected'
                  }
                </span>
              </div>
            </div>
            <WalletMultiButton className="!bg-brand-primary !text-white hover:!bg-opacity-90 !rounded-lg !px-4 !py-2" />
          </div>
        </div>
        
        <div className="bg-brand-surface p-6 rounded-lg shadow-lg mb-6">
          <div className="flex items-center justify-center gap-4 mb-4">
            <img src={profile.pfp} alt="Player PFP" className="w-16 h-16 rounded-full bg-brand-primary" />
            <div>
              <h3 className="text-xl font-bold">{profile.name}</h3>
              <p className="text-sm text-brand-text-muted">XP: {profile.xp}</p>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 p-6 rounded-lg mb-6">
          <h3 className="text-xl font-bold text-amber-800 mb-4">🏆 Season 1 Challenge</h3>
          <div className="grid md:grid-cols-2 gap-4 text-left">
            <div className="space-y-2">
              <p><strong>🎯 Goal:</strong> Complete all 5 levels</p>
              <p><strong>⏱️ Time Limit:</strong> 30 seconds</p>
              <p><strong>💖 Lives:</strong> 3 hearts</p>
            </div>
            <div className="space-y-2">
              <p><strong>🔑 Mechanics:</strong> Collect keys, unlock doors</p>
              <p><strong>⚠️ Hazards:</strong> Spikes cost 1 heart</p>
              <p><strong>🛡️ Safety:</strong> 2s invincibility after damage</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleStartGame}
          className="bg-brand-primary text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-opacity-90"
        >
          🎮 Start Season 1
        </button>
      </div>
    );
  }

  // Fallback
  return (
    <div className="text-center">
      <p>Preparing game...</p>
    </div>
  );
};