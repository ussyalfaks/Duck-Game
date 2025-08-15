import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { HCB_Profile } from '../types';
import { ADMIN_ADDRESS } from '../constants';
import { Loader } from './ui/Loader';
import { ProfileUpdate } from './ProfileUpdate';
import { useGameResources } from '../hooks/useGameResources';

interface DashboardProps {
  isLoading: boolean;
  error: string | null;
  txSignature: string | null;
  profile?: HCB_Profile | null;
  onAdminAction?: () => void;
  adminActionText?: string;
  onProfileUpdated?: (updatedProfile: HCB_Profile) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  isLoading,
  error,
  txSignature,
  profile,
  onAdminAction,
  adminActionText,
  onProfileUpdated,
}) => {
    const { publicKey } = useWallet();
    const [showProfileUpdate, setShowProfileUpdate] = useState(false);
    
    // Check if current wallet is the admin address
    const isAdmin = publicKey && publicKey.toBase58() === ADMIN_ADDRESS;

    // Use the game resources hook for real blockchain data
    const {
        isAwarding,
        awardXP,
        checkBadges,
    } = useGameResources();

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


  return (
    <>
      {isAdmin && (
        <div className="mt-6 pt-6 border-t border-brand-primary">
          <h3 className="font-bold text-lg mb-2">🔧 Admin Controls</h3>
          <p className="text-xs text-brand-text-muted mb-3">Authenticated as Admin</p>
          {onAdminAction && (
            <button
              onClick={onAdminAction}
              disabled={isLoading}
              className="w-full bg-brand-primary text-white font-bold py-2 px-4 rounded hover:bg-opacity-90 disabled:bg-opacity-50 transition-colors mb-2"
            >
              {adminActionText}
            </button>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => awardXP(100, 'Admin bonus')}
              disabled={isAwarding}
              className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600 disabled:opacity-50"
            >
              +100 XP
            </button>
            <button
              onClick={checkBadges}
              disabled={isAwarding}
              className="bg-purple-500 text-white px-2 py-1 rounded text-xs hover:bg-purple-600 disabled:opacity-50"
            >
              Check Badges
            </button>
          </div>
        </div>
      )}
      {renderStatus()}

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