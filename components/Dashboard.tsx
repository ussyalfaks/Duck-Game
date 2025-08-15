import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { HCB_Project, HCB_Profile } from '../types';
import { KEY_BADGE_INDEX, ADMIN_ADDRESS } from '../constants';
import { Loader } from './ui/Loader';
import { PlayButton } from './ui/PlayButton';
import { ProfileUpdate } from './ProfileUpdate';

interface DashboardProps {
  isLoading: boolean;
  error: string | null;
  txSignature: string | null;
  message: string;
  profile?: HCB_Profile | null;
  onAdminAction?: () => void;
  adminActionText?: string;
  onPlayerAction?: () => void;
  playerActionText?: string;
  onProfileUpdated?: (updatedProfile: HCB_Profile) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  isLoading,
  error,
  txSignature,
  message,
  profile,
  onAdminAction,
  adminActionText,
  onPlayerAction,
  playerActionText,
  onProfileUpdated,
}) => {
    const { publicKey } = useWallet();
    const [showProfileUpdate, setShowProfileUpdate] = useState(false);
    
    // Check if current wallet is the admin address
    const isAdmin = publicKey && publicKey.toBase58() === ADMIN_ADDRESS;

  const renderStatus = () => (
    <div className="min-h-[100px] mt-4">
      {isLoading && <div className="flex items-center gap-2"><Loader /><p>Processing transaction...</p></div>}
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
  );

  const renderPlayerStats = () => (
    profile && (
    <div>
        <div className="flex items-center gap-4 mb-4">
            <img src={profile.pfp} alt="Player PFP" className="w-16 h-16 rounded-full bg-brand-primary" />
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold">{profile.name}</h3>
                    <button
                        onClick={() => setShowProfileUpdate(true)}
                        className="text-brand-text-muted hover:text-brand-secondary transition-colors"
                        title="Edit Profile"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </button>
                </div>
                <p className="text-sm text-brand-text-muted font-mono break-all">{profile.address}</p>
                {profile.bio && <p className="text-sm text-brand-text-muted mt-1">{profile.bio}</p>}
            </div>
        </div>
        <div className="space-y-2">
            <p><strong>XP:</strong> {profile.xp}</p>
            <div>
                <strong>Badges:</strong>
                {profile.badges.includes(KEY_BADGE_INDEX) ? (
                    <span className="ml-2 inline-block bg-yellow-500 text-gray-900 px-2 py-1 text-xs font-bold rounded">Level 1 Key</span>
                ) : (
                    <span className="ml-2 text-brand-text-muted">None</span>
                )}
            </div>
        </div>
    </div>
    )
  );

  return (
    <>
      <div className="w-full lg:w-1/3 bg-brand-surface p-6 rounded-lg shadow-2xl flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-brand-secondary">Dashboard</h2>
              <WalletMultiButton style={{ backgroundColor: '#0f3460', height: '40px' }} />
          </div>
          <p className="text-brand-text-muted mb-6">{message}</p>
          
          {onPlayerAction && (
               <button
                  onClick={onPlayerAction}
                  disabled={isLoading}
                  className="w-full bg-brand-secondary text-white font-bold py-2 px-4 rounded hover:bg-opacity-90 disabled:bg-opacity-50 transition-colors mb-4"
              >
                  {playerActionText}
              </button>
          )}

          {profile && <PlayButton />}

          {profile && renderPlayerStats()}
        </div>

        <div>
          {/* Admin controls - only show if current wallet matches ADMIN_ADDRESS */}
          {isAdmin && onAdminAction && (
               <div className="mt-6 pt-6 border-t border-brand-primary">
                  <h3 className="font-bold text-lg mb-2">Admin Controls</h3>
                  <p className="text-xs text-brand-text-muted mb-3">Authenticated as Admin</p>
                  <button
                      onClick={onAdminAction}
                      disabled={isLoading}
                      className="w-full bg-brand-primary text-white font-bold py-2 px-4 rounded hover:bg-opacity-90 disabled:bg-opacity-50 transition-colors"
                  >
                      {adminActionText}
                  </button>
              </div>
          )}
          {renderStatus()}
        </div>
      </div>

      {/* Profile Update Modal */}
      {showProfileUpdate && profile && onProfileUpdated && (
        <ProfileUpdate
          profile={profile}
          onProfileUpdated={(updatedProfile) => {
            onProfileUpdated(updatedProfile);
            setShowProfileUpdate(false);
          }}
          onClose={() => setShowProfileUpdate(false)}
        />
      )}
    </>
  );
};