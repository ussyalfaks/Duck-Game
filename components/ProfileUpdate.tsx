import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { honeycombClient, signAndSendTransaction } from '../services/honeycomb';
import { authenticateUser } from '../services/auth';
import { HCB_Profile } from '../types';
import { Loader } from './ui/Loader';

interface ProfileUpdateProps {
  profile: HCB_Profile;
  onProfileUpdated: (updatedProfile: HCB_Profile) => void;
  onClose: () => void;
}

export const ProfileUpdate: React.FC<ProfileUpdateProps> = ({
  profile,
  onProfileUpdated,
  onClose
}) => {
  const wallet = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: profile.name || '',
    bio: profile.bio || '',
    pfp: profile.pfp || ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = async () => {
    if (!formData.name.trim()) {
      setError('Name is required');
      return false;
    }
    if (formData.name.length > 50) {
      setError('Name must be 50 characters or less');
      return false;
    }
    if (formData.bio.length > 200) {
      setError('Bio must be 200 characters or less');
      return false;
    }
    
    // Validate profile picture URL
    if (formData.pfp) {
      if (!isValidUrl(formData.pfp)) {
        setError('Profile picture must be a valid URL');
        return false;
      }
      
      // Test if the URL actually loads an image
      const isValidImage = await validateImageUrl(formData.pfp);
      if (!isValidImage) {
        setError('Unable to load image from the provided URL. Please check the URL or try a different image.');
        return false;
      }
    }
    
    return true;
  };

  const isValidUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      // Check if it's a valid HTTP/HTTPS URL
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  };

  const validateImageUrl = async (url: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      // Add crossOrigin to handle CORS issues
      img.crossOrigin = 'anonymous';
      img.src = url;
      
      // Timeout after 5 seconds
      setTimeout(() => resolve(false), 5000);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsLoading(true);
    setError(null);
    
    const isValid = await validateForm();
    if (!isValid) {
      setIsLoading(false);
      return;
    }

    if (!wallet.publicKey) {
      setError('Wallet not connected');
      setIsLoading(false);
      return;
    }

    try {
      // Step 1: Authenticate user to get access token
      console.log('Authenticating user for profile update...');
      const authResult = await authenticateUser(wallet);

      // Step 2: Create update profile transaction
      console.log('Creating update profile transaction...');
      const { createUpdateProfileTransaction: txResponse } = 
        await honeycombClient.createUpdateProfileTransaction({
          payer: wallet.publicKey.toString(),
          profile: profile.address,
          info: {
            name: formData.name.trim(),
            bio: formData.bio.trim(),
            pfp: formData.pfp.trim() || undefined
          }
        }, {
          fetchOptions: {
            headers: {
              authorization: `Bearer ${authResult.accessToken}`,
            },
          }
        });

      // Step 3: Sign and send transaction
      console.log('Signing and sending transaction...');
      const sigs = await signAndSendTransaction(wallet, txResponse);
      const signature = sigs?.[0]?.responses?.[0]?.signature;

      if (signature) {
        console.log('Profile updated successfully:', signature);
        
        // Update the profile object with new data
        const updatedProfile: HCB_Profile = {
          ...profile,
          name: formData.name.trim(),
          bio: formData.bio.trim(),
          pfp: formData.pfp.trim() || profile.pfp
        };

        onProfileUpdated(updatedProfile);
        onClose();
      } else {
        throw new Error('Transaction failed - no signature received');
      }

    } catch (err) {
      console.error('Profile update failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: profile.name || '',
      bio: profile.bio || '',
      pfp: profile.pfp || ''
    });
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-brand-surface rounded-lg shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-brand-secondary">Update Profile</h2>
          <button
            onClick={handleCancel}
            className="text-brand-text-muted hover:text-white transition-colors"
            disabled={isLoading}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-white mb-2">
              Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-brand-primary border border-brand-secondary rounded-md text-white placeholder-brand-text-muted focus:outline-none focus:ring-2 focus:ring-brand-secondary"
              placeholder="Enter your name"
              maxLength={50}
              required
              disabled={isLoading}
            />
            <p className="text-xs text-brand-text-muted mt-1">
              {formData.name.length}/50 characters
            </p>
          </div>

          {/* Bio Field */}
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-white mb-2">
              Bio
            </label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 bg-brand-primary border border-brand-secondary rounded-md text-white placeholder-brand-text-muted focus:outline-none focus:ring-2 focus:ring-brand-secondary resize-none"
              placeholder="Tell us about yourself"
              maxLength={200}
              disabled={isLoading}
            />
            <p className="text-xs text-brand-text-muted mt-1">
              {formData.bio.length}/200 characters
            </p>
          </div>

          {/* Profile Picture URL Field */}
          <div>
            <label htmlFor="pfp" className="block text-sm font-medium text-white mb-2">
              Profile Picture URL
            </label>
            <input
              type="url"
              id="pfp"
              name="pfp"
              value={formData.pfp}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-brand-primary border border-brand-secondary rounded-md text-white placeholder-brand-text-muted focus:outline-none focus:ring-2 focus:ring-brand-secondary"
              placeholder="https://example.com/avatar.jpg"
              disabled={isLoading}
            />
            <p className="text-xs text-brand-text-muted mt-1">
              Paste a direct link to your profile image
            </p>
          </div>

          {/* Profile Preview */}
          <div className="bg-brand-primary p-4 rounded-md">
            <h3 className="text-sm font-medium text-white mb-3">Preview</h3>
            <div className="flex items-center gap-3">
              <img
                src={formData.pfp || profile.pfp || `https://api.dicebear.com/8.x/pixel-art/svg?seed=${wallet.publicKey?.toBase58()}`}
                alt="Profile Preview"
                className="w-12 h-12 rounded-full bg-brand-secondary object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = `https://api.dicebear.com/8.x/pixel-art/svg?seed=${wallet.publicKey?.toBase58()}`;
                }}
              />
              <div>
                <p className="font-medium text-white">{formData.name || 'Your Name'}</p>
                <p className="text-sm text-brand-text-muted">{formData.bio || 'Your bio will appear here'}</p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-900 border border-red-600 text-red-200 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-opacity-80 transition-colors disabled:opacity-50"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-brand-secondary text-white rounded-md hover:bg-opacity-90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader />
                  Updating...
                </>
              ) : (
                'Update Profile'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};