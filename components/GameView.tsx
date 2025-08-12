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

  const resetGame = () => {
      console.log('Resetting game...');
      setSeasonComplete(false);
      setHasKey(false);
      // For this demo, reloading is the easiest way to reset the Matter.js state
      window.location.reload();
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
              Collect the key to unlock the door in each level!
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
            <div className="bg-brand-primary/20 p-4 rounded-lg mb-4">
              <h4 className="font-bold mb-2">🎮 Season 1 Rules:</h4>
              <ul className="text-sm space-y-1 text-brand-text-muted">
                <li>• Complete 5 levels in 30 seconds</li>
                <li>• Collect key → unlock door → next level</li>
                <li>• Avoid spikes (instant death)</li>
                <li>• Run out of time = Game Over</li>
              </ul>
            </div>
          </div>

          <div>
            {/* Admin controls - only show if current wallet matches ADMIN_ADDRESS */}
            {isAdmin && (
              <div className="mt-6 pt-6 border-t border-brand-primary">
                <h3 className="font-bold text-lg mb-2">Admin Controls</h3>
                <p className="text-xs text-brand-text-muted mb-3">Authenticated as Admin</p>
                <button
                  onClick={createBadge}
                  disabled={isLoading}
                  className="w-full bg-brand-primary text-white font-bold py-2 px-4 rounded hover:bg-opacity-90 disabled:bg-opacity-50 transition-colors"
                >
                  Create 'Level 1 Key' Badge (Disabled)
                </button>
              </div>
            )}
            
            {/* Status */}
            <div className="min-h-[100px] mt-4">
              {isLoading && <div className="flex items-center gap-2"><div className="animate-spin h-5 w-5 border-2 border-brand-secondary border-t-transparent rounded-full"></div><p>Processing transaction...</p></div>}
              {error && <p className="text-red-400 text-sm break-words">Error: {error}</p>}
              {txSignature && (
                <div className="text-green-400 text-sm break-all">
                  <p>Success! Tx:</p>
                  <a
                    href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-green-300"
                  >
                    {txSignature}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Landing page - centered layout with proper flow
  return (
    <div className="min-h-[600px] flex flex-col items-center justify-center">
      <div className=" p-8 max-w-md w-full mx-4 text-center">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-brand-secondary mb-4">🦆 Duck Game</h1>
          <p className="text-brand-text-muted mb-6">
            Season 1: Complete 5 challenging levels in 30 seconds! Your progress is stored on the Solana blockchain using Honeycomb Protocol.
          </p>
        </div>

        {/* Step 1: Connect Wallet */}
        {!connected && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Step 1: Connect Your Wallet</h2>
            <p className="text-sm text-brand-text-muted mb-6">
              Connect your Solana wallet to begin your on-chain adventure.
            </p>
            <div className="flex justify-center">
              <WalletMultiButton 
                style={{ 
                  backgroundColor: '#e94560', 
                  color: 'white',
                  height: '48px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  borderRadius: '8px'
                }} 
              />
            </div>
          </div>
        )}

        {/* Step 2: Create Profile (if connected but no profile) */}
        {connected && !profile && !isLoading && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Step 2: Create Profile</h2>
              <WalletMultiButton style={{ backgroundColor: '#0f3460', height: '32px', fontSize: '12px' }} />
            </div>
            <p className="text-sm text-brand-text-muted mb-6">
              Create your on-chain player profile to store your progress and achievements on the blockchain.
            </p>
            <button
              onClick={handleCreateProfile}
              disabled={isLoading}
              className="w-full bg-brand-secondary text-white font-bold py-3 px-6 rounded-lg hover:bg-opacity-90 disabled:bg-opacity-50 transition-colors text-lg"
            >
              Create Player Profile
            </button>

            {/* Manual reload for existing profiles */}
            {error && error.includes("Profile already exists") && (
              <div className="mt-4 p-4 bg-brand-primary/20 rounded-lg">
                <p className="text-sm text-brand-text-muted mb-3">
                  Your profile exists but couldn't be loaded automatically.
                </p>
                <button
                  onClick={handleReloadProfile}
                  disabled={isLoading}
                  className="w-full bg-brand-primary text-white px-4 py-2 rounded hover:bg-opacity-90 disabled:bg-opacity-50"
                >
                  {isLoading ? 'Loading...' : 'Load Existing Profile'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Loading State */}
        {connected && isLoading && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Loading...</h2>
              <WalletMultiButton style={{ backgroundColor: '#0f3460', height: '32px', fontSize: '12px' }} />
            </div>
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-brand-secondary border-t-transparent rounded-full mb-4"></div>
              <p className="text-brand-text-muted text-center">
                {txSignature ? 'Transaction successful! Loading your profile...' : 'Processing... Please wait'}
              </p>
            </div>

            {txSignature && (
              <div className="mt-4 p-3 bg-green-900/20 border border-green-500 rounded text-green-400 text-sm break-all text-center">
                <p className="mb-2">Transaction successful!</p>
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
        )}

        {/* Step 3: Play Game (if profile exists) */}
        {connected && profile && !isLoading && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Ready to Play Season 1!</h2>
              <WalletMultiButton style={{ backgroundColor: '#0f3460', height: '32px', fontSize: '12px' }} />
            </div>

            {/* Player info */}
            <div className="bg-brand-primary/20 p-4 rounded-lg mb-6">
              <div className="flex items-center gap-3 mb-3">
                <img src={profile.pfp} alt="Player PFP" className="w-12 h-12 rounded-full bg-brand-primary" />
                <div className="text-left">
                  <h3 className="font-bold">{profile.name}</h3>
                  <p className="text-xs text-brand-text-muted">XP: {profile.xp}</p>
                </div>
              </div>
            </div>

            {/* Season 1 Challenge Info */}
            <div className="bg-yellow-500/20 border border-yellow-500 p-4 rounded-lg mb-6">
              <h3 className="font-bold text-yellow-300 mb-2">⚡ Season 1 Challenge</h3>
              <ul className="text-sm space-y-1 text-left">
                <li>🎯 Complete 5 unique levels</li>
                <li>⏰ 30 seconds total time limit</li>
                <li>🔑 Collect keys to unlock doors</li>
                <li>💀 Avoid deadly spikes</li>
                <li>🏆 Reach the end to win!</li>
              </ul>
            </div>

            <button
              onClick={handleStartGame}
              className="w-full bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 transition-colors text-lg"
            >
              🚀 Start Season 1
            </button>
          </div>
        )}

        {/* Error Display */}
        {error && !isLoading && (
          <div className="mt-4 p-3 bg-red-900/20 border border-red-500 rounded text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {/* Debug Information Toggle */}
        <div className="mt-6 pt-4 border-t border-brand-primary/30">
          <button 
            onClick={() => setShowDebug(!showDebug)}
            className="text-xs text-brand-text-muted hover:text-white transition-colors"
          >
            {showDebug ? 'Hide' : 'Show'} Debug Info
          </button>
          
          {showDebug && (
            <div className="mt-2 text-xs text-brand-text-muted space-y-1 text-left bg-black/20 p-3 rounded">
              <p><strong>Wallet:</strong> {publicKey?.toBase58().substring(0, 20)}...</p>
              <p><strong>Connected:</strong> {connected.toString()}</p>
              <p><strong>Loading:</strong> {isLoading.toString()}</p>
              <p><strong>Has Project:</strong> {(!!project).toString()}</p>
              <p><strong>Has Profile:</strong> {(!!profile).toString()}</p>
              <p><strong>Game Started:</strong> {gameStarted.toString()}</p>
              <p><strong>Season Complete:</strong> {seasonComplete.toString()}</p>
              <p><strong>Is Admin:</strong> {isAdmin.toString()}</p>
              {/* <p><strong>Admin Address:</strong> {ADMIN_ADDRESS?.substring(0, 20)}...</p> */}
              <p><strong>Error:</strong> {error || 'None'}</p>
              <p><strong>TX:</strong> {txSignature ? `${txSignature.substring(0, 20)}...` : 'None'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};