import { useState, useCallback, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { honeycombClient, signAndSendTransaction } from '../services/honeycomb';
import { authenticateUser, AuthResult } from '../services/auth';
import { HCB_Project, HCB_Profile, BadgesCondition } from '../types';
import { KEY_BADGE_INDEX } from '../constants';

const DEFAULT_PROJECT: HCB_Project = {
  address: "FmgCdasgnQHdvpsRji8eNYer5fJAczdDcDvN3SteAXqa",
  authority: "4J4rnCy7wWYP1Dgw4EAbTezQvLiCwrCFtfnAZNmQv8u2oni46LdBYiwvHSFR8rPkU1BLUHJCJvEdxAqHmShT1FYc",
  name: "Honeycomb Duck Game",
  id: 0,
  driver: ""
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

export const useHoneycomb = () => {
  const wallet = useWallet();
  const [project] = useState<HCB_Project>(DEFAULT_PROJECT);
  const [profile, setProfile] = useState<HCB_Profile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [canPlay, setCanPlay] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  
  const clearState = () => {
      setError(null);
      setTxSignature(null);
  }

  // Fetch user profile when project and wallet are available
  useEffect(() => {
    let mounted = true;
    
    const fetchProfile = async () => {
      console.log('Initial profile fetch triggered');
      if (!project || !wallet.publicKey) {
        console.log('Missing required data:', {
          hasProject: !!project,
          hasWallet: !!wallet.publicKey
        });
        if (mounted) {
          setIsLoading(false);
        }
        return;
      }

      if (!mounted) return;
      setIsLoading(true);
      clearState();

      try {
        const { profile: profiles } = await honeycombClient.findProfiles({
          projects: [project.address],
          addresses: [wallet.publicKey.toBase58()],
        });

        if (!mounted) return;

        if (profiles && profiles.length > 0) {
          const mappedProfile = mapSDKProfileToAppProfile(profiles[0]);
          console.log('Found profile:', mappedProfile);
          setProfile(mappedProfile);
          setCanPlay(true);
        } else {
          console.log('No profile found');
          setProfile(null);
          setCanPlay(false);
        }
      } catch (e) {
        console.error('Profile fetch error:', e);
        if (mounted) {
          setError('Failed to fetch user profile.');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchProfile();
    return () => { mounted = false; };
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
                    criteriaIndex: KEY_BADGE_INDEX,
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

  const createUser = useCallback(async (): Promise<boolean> => {
    if (!wallet.publicKey) {
      setError("Wallet not connected.");
      return false;
    }

    setIsLoading(true);
    clearState();

    try {
      console.log('Creating user...');
      const { createNewUserTransaction: txResponse } = await honeycombClient.createNewUserTransaction({
        wallet: wallet.publicKey.toString(),
        info: {
          name: `DuckPlayer#${Math.floor(Math.random() * 1000)}`,
          bio: "An intrepid duck adventurer.",
          pfp: `https://api.dicebear.com/8.x/pixel-art/svg?seed=${wallet.publicKey.toBase58()}`,
        },
        payer: wallet.publicKey.toString(),
      });

      const sigs = await signAndSendTransaction(wallet, txResponse);
      const signature = sigs?.[0]?.responses?.[0]?.signature || null;
      setTxSignature(signature);

      if (signature) {
        console.log('User created successfully:', signature);
        return true;
      }
      return false;
    } catch (e) {
      console.error('User creation error:', e);
      setError(`Failed to create user: ${e instanceof Error ? e.message : 'Unknown error'}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [wallet]);

  const createProfile = useCallback(async () => {
    console.log('Starting profile creation...');
    if (!wallet.publicKey || !project) {
      const error = "Wallet or project not available.";
      console.error(error, { wallet: !!wallet.publicKey, project: !!project });
      setError(error);
      return;
    }
    
    setIsLoading(true);
    clearState();

    try {
      // Step 1: Check if user exists, if not create user
      console.log('Checking if user exists...');
      const { user: existingUsers } = await honeycombClient.findUsers({
        wallets: [wallet.publicKey.toBase58()]
      });

      let userExists = existingUsers && existingUsers.length > 0;
      
      if (!userExists) {
        console.log('User does not exist, creating user first...');
        const userCreated = await createUser();
        if (!userCreated) {
          setError('Failed to create user before profile creation');
          return;
        }
        // Wait a bit for user creation to be confirmed
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Step 2: Authenticate user
      console.log('Authenticating user...');
      let authResult: AuthResult;
      try {
        authResult = await authenticateUser(wallet);
        setAuthToken(authResult.accessToken);
      } catch (authError) {
        console.error('Authentication failed:', authError);
        setError('Failed to authenticate user');
        return;
      }

      // Step 3: Create profile
      console.log('Creating profile with authentication...');
      const { createNewProfileTransaction: txResponse } = 
        await honeycombClient.createNewProfileTransaction({
          project: project.address,
          payer: wallet.publicKey.toBase58(),
          identity: "main",
          info: {
            name: `DuckPlayer#${Math.floor(Math.random() * 1000)}`,
            bio: "An intrepid duck adventurer.",
            pfp: `https://api.dicebear.com/8.x/pixel-art/svg?seed=${wallet.publicKey.toBase58()}`,
          },
        }, {
          fetchOptions: {
            headers: {
              authorization: `Bearer ${authResult.accessToken}`,
            },
          }
        });

      console.log('Transaction response received:', txResponse);

      const sigs = await signAndSendTransaction(wallet, txResponse);
      console.log('Transaction signatures:', sigs);
      
      let signature = null;
      if (sigs && sigs.length > 0) {
        const firstSig = sigs[0];
        signature = firstSig?.responses?.[0]?.signature || 
                   (firstSig?.responses && firstSig.responses.find(r => r.signature)?.signature) ||
                   null;
      }
      
      console.log('Extracted signature:', signature);
      setTxSignature(signature);
      
      if (signature) {
        console.log('Profile creation transaction successful:', signature);
        // Wait a bit for blockchain confirmation before refetching
        console.log('Waiting for blockchain confirmation...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        try {
          const { profile: profiles } = await honeycombClient.findProfiles({
            projects: [project.address],
            addresses: [wallet.publicKey.toBase58()],
          });

          if (profiles && profiles.length > 0) {
            const mappedProfile = mapSDKProfileToAppProfile(profiles[0]);
            console.log('Profile found after creation:', mappedProfile);
            setProfile(mappedProfile);
            setCanPlay(true);
            return;
          }
        } catch (e) {
          console.error('Error fetching profile after creation:', e);
        }

        // If we didn't find the profile, force a page refresh
        console.log('Profile not found after creation, refreshing page...');
        window.location.reload();
      } else {
        console.warn('No signature found, refreshing page to check profile status...');
        window.location.reload();
      }
      
    } catch (e) {
      console.error('Profile creation error:', e);
      if (e instanceof Error && e.message.includes("User already exists with profile")) {
        // This means the profile actually exists, let's try to fetch it
        console.log('Profile might already exist, attempting to fetch...');
        try {
          const { profile: profiles } = await honeycombClient.findProfiles({
            projects: [project.address],
            addresses: [wallet.publicKey.toBase58()],
          });

          if (profiles && profiles.length > 0) {
            const mappedProfile = mapSDKProfileToAppProfile(profiles[0]);
            console.log('Found existing profile:', mappedProfile);
            setProfile(mappedProfile);
            setCanPlay(true);
            return;
          }
        } catch (fetchError) {
          console.error('Failed to fetch existing profile:', fetchError);
        }
      }
      setError(`Failed to create profile: ${e instanceof Error ? e.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  }, [wallet, project, createUser]);

  const claimKeyBadge = useCallback(async () => {
    if (!wallet.publicKey || !project || !profile) {
      setError("Cannot claim badge: Missing wallet, project, or profile.");
      return;
    }
    
    setIsLoading(true);
    clearState();
    
    try {
        // Authenticate user for badge claiming if we don't have a token
        let currentAuthToken = authToken;
        if (!currentAuthToken) {
          console.log('No auth token, authenticating user...');
          const authResult = await authenticateUser(wallet);
          currentAuthToken = authResult.accessToken;
          setAuthToken(currentAuthToken);
        }

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
        const signature = sigs?.[0]?.responses?.[0]?.signature || null;
        setTxSignature(signature);
        
        if (signature) {
          // Wait a bit for blockchain confirmation before refetching
          setTimeout(async () => {
            try {
              const { profile: profiles } = await honeycombClient.findProfiles({
                projects: [project.address],
                addresses: [wallet.publicKey!.toBase58()],
              });

              if (profiles && profiles.length > 0) {
                const mappedProfile = mapSDKProfileToAppProfile(profiles[0]);
                setProfile(mappedProfile);
              }
            } catch (e) {
              console.error('Failed to refetch profile after badge claim:', e);
            }
          }, 2000);
        }
    } catch (e) {
        setError('Failed to claim key badge.');
        console.error(e);
        throw e;
    } finally {
        setIsLoading(false);
    }
  }, [wallet, project, profile, authToken]);

  const startGame = useCallback(async () => {
    if (!profile || !canPlay) {
      setError("Cannot start game: Profile not found");
      return false;
    }
    
    try {
      return true;
    } catch (e) {
      setError('Failed to start game');
      console.error(e);
      return false;
    }
  }, [profile, canPlay]);

  return {
    project,
    profile,
    isLoading,
    error,
    txSignature,
    canPlay,
    authToken,
    startGame,
    createProject,
    createBadge,
    createProfile,
    claimKeyBadge,
  };
};