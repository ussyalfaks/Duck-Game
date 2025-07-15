
import { useState, useCallback, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { honeycombClient, signAndSendTransaction } from '../services/honeycomb';
import { HCB_Project, HCB_Profile, BadgesCondition } from '../types';
import { KEY_BADGE_INDEX } from '../constants';
import { PublicKey } from '@solana/web3.js';

const DEFAULT_PROJECT: HCB_Project = {
  address: "FmgCdasgnQHdvpsRji8eNYer5fJAczdDcDvN3SteAXqa",
  authority: "4J4rnCy7wWYP1Dgw4EAbTezQvLiCwrCFtfnAZNmQv8u2oni46LdBYiwvHSFR8rPkU1BLUHJCJvEdxAqHmShT1FYc", // your admin public key
  name: "Honeycomb Duck Game", // Optional display name
  id: 0, // Optional
  driver: "" // Optional
};

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

// Helper to refetch and update the profile
const refetchProfile = async (project: HCB_Project, wallet: any, setProfile: any, setError: any, clearState: any, setIsLoading: any) => {
  if (project && wallet.publicKey) {
    setIsLoading(true);
    clearState();
    try {
      const { profile: profiles } = await honeycombClient.findProfiles({
        projects: [project.address],
        addresses: [wallet.publicKey.toBase58()],
      });
      if (profiles && profiles.length > 0) {
        setProfile(mapSDKProfileToAppProfile(profiles[0]));
      } else {
        setProfile(null);
      }
    } catch (e) {
      setError('Failed to fetch user profile.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }
};


export const useHoneycomb = () => {
  const wallet = useWallet();
  const [project] = useState<HCB_Project>(DEFAULT_PROJECT); // Always use the default project
  const [profile, setProfile] = useState<HCB_Profile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  
  const clearState = () => {
      setError(null);
      setTxSignature(null);
  }

  // Remove useEffect that loads from localStorage

  // Fetch user profile when project and wallet are available
  useEffect(() => {
    const fetchProfile = async () => {
      if (project && wallet.publicKey) {
        setIsLoading(true);
        clearState();
        try {
          const { profile: profiles } = await honeycombClient.findProfiles({
            projects: [project.address],
            addresses: [wallet.publicKey.toBase58()],
          });

          if (profiles && profiles.length > 0) {
            setProfile(mapSDKProfileToAppProfile(profiles[0]));
          } else {
            setProfile(null);
          }
        } catch (e) {
          setError('Failed to fetch user profile.');
          console.error(e);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchProfile();
  }, [project, wallet.publicKey]);

  const createProject = useCallback(async () => {
    if (!wallet.publicKey) {
      setError("Wallet not connected.");
      return;
    }
    setIsLoading(true);
    clearState();
    try {
      const { createCreateProjectTransaction: { project: projectAddress, tx: txResponse } } =
        await honeycombClient.createCreateProjectTransaction({
          name: "Duck Game Adventure",
          authority: wallet.publicKey.toBase58(),
          payer: wallet.publicKey.toBase58(),
          profileDataConfig: {
            achievements: ["Level 1 Cleared"],
            customDataFields: [],
          },
        });
      
      const sigs = await signAndSendTransaction(wallet, txResponse);
      setTxSignature(sigs?.[0]?.responses?.[0]?.signature || null);

      const newProject: HCB_Project = {
          address: projectAddress,
          authority: wallet.publicKey.toBase58(),
          name: "Duck Game Adventure",
          id: 0, // placeholder
          driver: '' // placeholder
      };
      // setProject(newProject); // This line is removed as project is now a constant
      // localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(newProject)); // This line is removed

    } catch (e) {
      setError('Failed to create project.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [wallet]);
  
  const createBadge = useCallback(async () => {
    if (!wallet.publicKey || !project) {
        setError("Wallet or project not available.");
        return;
    }
    setIsLoading(true);
    clearState();
    try {
        const { createUpdateBadgeCriteriaTransaction: { transaction } } = 
            await honeycombClient.createUpdateBadgeCriteriaTransaction({
                args: {
                    authority: project.authority,
                    projectAddress: project.address,
                    payer: wallet.publicKey.toBase58(),
                    criteriaIndex: KEY_BADGE_INDEX, // Note: use criteriaIndex, not badgeIndex
                    condition: BadgesCondition.Public,
                }
            });

        const sigs = await signAndSendTransaction(wallet, { tx: { transaction, blockhash: '', lastValidBlockHeight: 0 } });
        setTxSignature(sigs?.[0]?.responses?.[0]?.signature || null);
        alert("Badge 'Level 1 Key' created successfully!");

    } catch(e) {
        setError('Failed to create badge.');
        console.error(e);
    } finally {
        setIsLoading(false);
    }
  }, [wallet, project]);

  const createProfile = useCallback(async () => {
    if (!wallet.publicKey || !project) {
      setError("Wallet or project not available.");
      return;
    }
    setIsLoading(true);
    clearState();
    try {
      const { createNewUserWithProfileTransaction: txResponse } = 
        await honeycombClient.createNewUserWithProfileTransaction({
          project: project.address,
          wallet: wallet.publicKey.toBase58(),
          payer: wallet.publicKey.toBase58(),
          profileIdentity: "main",
          userInfo: {
            name: `DuckPlayer#${Math.floor(Math.random() * 1000)}`,
            bio: "An intrepid duck adventurer.",
            pfp: `https://api.dicebear.com/8.x/pixel-art/svg?seed=${wallet.publicKey.toBase58()}`,
          },
      });

      const sigs = await signAndSendTransaction(wallet, txResponse);
      setTxSignature(sigs?.[0]?.responses?.[0]?.signature || null);
      // Refetch profile after creation
      await refetchProfile(project, wallet, setProfile, setError, clearState, setIsLoading);
    } catch (e) {
      setError('Failed to create profile.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [wallet, project]);

  const claimKeyBadge = useCallback(async () => {
    if (!wallet.publicKey || !project || !profile) {
      setError("Cannot claim badge: Missing wallet, project, or profile.");
      return;
    }
    setIsLoading(true);
    clearState();
    try {
        const { createClaimBadgeCriteriaTransaction: txResponse } =
            await honeycombClient.createClaimBadgeCriteriaTransaction({
                args: {
                    profileAddress: profile.address,
                    projectAddress: project.address,
                    proof: BadgesCondition.Public,
                    payer: wallet.publicKey.toString(),
                    criteriaIndex: KEY_BADGE_INDEX,
                },
            });
        
        const sigs = await signAndSendTransaction(wallet, txResponse);
        setTxSignature(sigs?.[0]?.responses?.[0]?.signature || null);
        // Refetch profile after claiming badge
        await refetchProfile(project, wallet, setProfile, setError, clearState, setIsLoading);
    } catch (e) {
        setError('Failed to claim key badge.');
        console.error(e);
        throw e; // re-throw to be caught by game logic
    } finally {
        setIsLoading(false);
    }
  }, [wallet, project, profile]);


  return {
    project,
    profile,
    isLoading,
    error,
    txSignature,
    createProject,
    createBadge,
    createProfile,
    claimKeyBadge,
  };
};
