import React, { useMemo, useState, useEffect } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { HONEYCOMB_RPC_URL } from '../constants';
import { GameView } from './GameView';
import { honeycombClient } from '../services/honeycomb';
import { HCB_Profile } from '../types';
import { ProfileUpdate } from './ProfileUpdate';

// Navbar Component
export const Navbar: React.FC = () => {
  const { connected, publicKey, disconnect } = useWallet();
  const [profile, setProfile] = useState<HCB_Profile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showProfileUpdate, setShowProfileUpdate] = useState(false);

  // Helper to map SDK Profile to our App's HCB_Profile type
  const mapSDKProfileToAppProfile = (sdkProfile: any): HCB_Profile => {
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

  // Fetch profile when wallet connects
  useEffect(() => {
    const fetchProfile = async () => {
      if (!connected || !publicKey) {
        setProfile(null);
        return;
      }

      setIsLoading(true);
      try {
        const PROJECT_ADDRESS = "FmgCdasgnQHdvpsRji8eNYer5fJAczdDcDvN3SteAXqa";
        
        // Try to find user's profile
        const { user: users } = await honeycombClient.findUsers({
          wallets: [publicKey.toBase58()]
        });

        if (users && users.length > 0) {
          const user = users[0];
          if (user.profiles && user.profiles.length > 0) {
            const projectProfile = user.profiles.find(p => p.project === PROJECT_ADDRESS);
            if (projectProfile) {
              const mappedProfile = mapSDKProfileToAppProfile(projectProfile);
              setProfile(mappedProfile);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch profile for navbar:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [connected, publicKey]);

  const handleDisconnect = async () => {
    try {
      await disconnect();
      setProfile(null);
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  };

  return (
    <>
      <nav className="w-full bg-brand-surface border-b border-brand-primary shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wider font-['Blockblueprint']">
                🦆 <span className="text-brand-secondary">Duck Game</span>
              </h1>
            </div>

            {/* User Info / Connect Button */}
            <div className="flex items-center space-x-4">
              {connected && publicKey ? (
                <div className="flex items-center space-x-3">
                  {/* Player Info */}
                  {profile ? (
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setShowProfileUpdate(true)}
                        className="flex items-center space-x-3 hover:bg-brand-primary rounded-lg p-2 transition-colors"
                        title="Edit Profile"
                      >
                        <img 
                          src={profile.pfp} 
                          alt="Player Avatar" 
                          className="w-8 h-8 rounded-full border-2 border-brand-secondary"
                        />
                        <div className="hidden sm:block">
                          <p className="text-white font-medium text-sm">{profile.name}</p>
                          <p className="text-brand-text-muted text-xs">XP: {profile.xp}</p>
                        </div>
                        <svg className="w-4 h-4 text-brand-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </div>
                  ) : isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full bg-brand-primary animate-pulse"></div>
                      <div className="hidden sm:block">
                        <div className="w-20 h-4 bg-brand-primary animate-pulse rounded mb-1"></div>
                        <div className="w-12 h-3 bg-brand-primary animate-pulse rounded"></div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center">
                        <span className="text-white text-xs">👤</span>
                      </div>
                      <div className="hidden sm:block">
                        <p className="text-white font-medium text-sm">
                          {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}
                        </p>
                        <p className="text-brand-text-muted text-xs">No Profile</p>
                      </div>
                    </div>
                  )}

                  {/* Disconnect Button */}
                  <button
                    onClick={handleDisconnect}
                    className="p-2 text-brand-text-muted hover:text-white hover:bg-brand-primary rounded-lg transition-colors duration-200"
                    title="Disconnect Wallet"
                  >
                    <svg 
                      className="w-5 h-5" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
                      />
                    </svg>
                  </button>
                </div>
              ) : (
                // Show nothing when not connected - let GameView handle wallet connection
                <div className="text-brand-text-muted text-sm">
                  Ready to connect...
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Profile Update Modal */}
      {showProfileUpdate && profile && (
        <ProfileUpdate
          profile={profile}
          onProfileUpdated={(updatedProfile) => {
            setProfile(updatedProfile);
            setShowProfileUpdate(false);
          }}
          onClose={() => setShowProfileUpdate(false)}
        />
      )}
    </>
  );
};
