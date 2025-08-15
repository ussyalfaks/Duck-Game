import { useState, useCallback, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { honeycombClient, signAndSendTransaction } from '../services/honeycomb';
import { authenticateUser, AuthResult } from '../services/auth';
import { HCB_Project, HCB_Profile, BadgesCondition } from '../types';
import { KEY_BADGE_INDEX } from '../constants';

const DEFAULT_PROJECT: HCB_Project = {
  address: "Hq63HojpwE3pK91i5kU2B7a4a3xfLrcGwTqDc8H1ftR",
  authority: "E45Jqz7F9bFdfyxHuWnqgczVtQ8a8NWvDtAGk5p9G83q",
  name: "Duck Game Project",
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

// Helper function to retry profile fetching with multiple methods
// const retryProfileFetch = async (
//   projectAddress: string, 
//   walletAddress: string, 
//   maxAttempts: number = 5
// ): Promise<HCB_Profile | null> => {
//   for (let attempt = 1; attempt <= maxAttempts; attempt++) {
//     try {
//       console.log(`Profile fetch attempt ${attempt}/${maxAttempts} for wallet: ${walletAddress}`);
      
//       // Method 1: Try finding by project and wallet address
//       try {
//         const { profile: profiles } = await honeycombClient.findProfiles({
//           projects: [projectAddress],
//           addresses: [walletAddress],
//         });

//         if (profiles && profiles.length > 0) {
//           const mappedProfile = mapSDKProfileToAppProfile(profiles[0]);
//           console.log('Profile found via project+address search:', mappedProfile);
//           return mappedProfile;
//         }
//       } catch (e) {
//         console.log('Method 1 (project+address) failed:', e.message);
//       }

//       // Method 2: Try finding by wallet address only
//       try {
//         const { profile: allProfiles } = await honeycombClient.findProfiles({
//           addresses: [walletAddress],
//         });

//         if (allProfiles && allProfiles.length > 0) {
//           // Find profile for our specific project
//           const projectProfile = allProfiles.find(p => p.project === projectAddress);
//           if (projectProfile) {
//             const mappedProfile = mapSDKProfileToAppProfile(projectProfile);
//             console.log('Profile found via address-only search:', mappedProfile);
//             return mappedProfile;
//           }
//         }
//       } catch (e) {
//         console.log('Method 2 (address-only) failed:', e.message);
//       }

//       // Method 3: Try finding user and then their profiles
//       try {
//         const { user: users } = await honeycombClient.findUsers({
//           wallets: [walletAddress]
//         });

//         if (users && users.length > 0) {
//           const user = users[0];
//           console.log('Found user:', user.id, 'with profiles:', user.profiles?.length);
          
//           if (user.profiles && user.profiles.length > 0) {
//             const projectProfile = user.profiles.find(p => p.project === projectAddress);
//             if (projectProfile) {
//               const mappedProfile = mapSDKProfileToAppProfile(projectProfile);
//               console.log('Profile found via user search:', mappedProfile);
//               return mappedProfile;
//             }
//           }
//         }
//       } catch (e) {
//         console.log('Method 3 (user search) failed:', e.message);
//       }
      
//       // Wait with exponential backoff before next attempt
//       if (attempt < maxAttempts) {
//         const delay = Math.min(1000 * Math.pow(2, attempt - 1), 8000); // Max 8 seconds
//         console.log(`All methods failed. Waiting ${delay}ms before next attempt...`);
//         await new Promise(resolve => setTimeout(resolve, delay));
//       }
//     } catch (error) {
//       console.error(`Profile fetch attempt ${attempt} failed completely:`, error);
//       if (attempt === maxAttempts) {
//         console.error('All profile fetch attempts exhausted');
//         // Don't throw, return null to allow manual retry
//       } else {
//         // Wait before retry
//         const delay = Math.min(1000 * Math.pow(2, attempt - 1), 8000);
//         await new Promise(resolve => setTimeout(resolve, delay));
//       }
//     }
//   }
  
//   console.log('Profile fetch failed after all attempts');
//   return null;
// };

// Helper function to retry profile fetching with multiple methods
const retryProfileFetch = async (
  projectAddress: string, 
  walletAddress: string, 
  maxAttempts: number = 5
): Promise<HCB_Profile | null> => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`Profile fetch attempt ${attempt}/${maxAttempts} for wallet: ${walletAddress}`);
      
      // Method 1: Try finding by project and wallet address using the correct API structure
      try {
        const profilesArray = await honeycombClient.findProfiles({
          // All filters below are optional
          userIds: [], // Integer array of Honeycomb Protocol user account IDs
          projects: [projectAddress], // String array of project addresses
          addresses: [], // String array of Honeycomb Protocol profile account addresses
          identities: [], // String array of profile identities
          includeProof: true, // Optional, set to true if you want to include the proof of the profile's account
        }).then(({profile}) => profile); // This will be an array of profiles

        if (profilesArray && profilesArray.length > 0) {
          // Find the profile that matches our wallet address
          const matchingProfile = profilesArray.find(p => {
            // Check if this profile belongs to our wallet through the user's wallets array
            return p.user?.wallets?.wallets?.includes(walletAddress);
          });

          if (matchingProfile) {
            const mappedProfile = mapSDKProfileToAppProfile(matchingProfile);
            console.log('Profile found via project search:', mappedProfile);
            return mappedProfile;
          }
        }
      } catch (e) {
        console.log('Method 1 (project search) failed:', e.message);
      }

      // Method 2: Try finding by specific profile addresses if we have them
      try {
        // First, let's find user to get their profile addresses
        const { user: users } = await honeycombClient.findUsers({
          wallets: [walletAddress]
        });

        if (users && users.length > 0) {
          const user = users[0];
          if (user.profiles && user.profiles.length > 0) {
            // Get profile addresses for this user
            const userProfileAddresses = user.profiles
              .filter(p => p.project === projectAddress)
              .map(p => p.address);

            if (userProfileAddresses.length > 0) {
              const profilesArray = await honeycombClient.findProfiles({
                userIds: [], 
                projects: [projectAddress], 
                addresses: userProfileAddresses, // Use specific profile addresses
                identities: [], 
                includeProof: true, 
              }).then(({profile}) => profile);

              if (profilesArray && profilesArray.length > 0) {
                const mappedProfile = mapSDKProfileToAppProfile(profilesArray[0]);
                console.log('Profile found via address search:', mappedProfile);
                return mappedProfile;
              }
            }
          }
        }
      } catch (e) {
        console.log('Method 2 (address search) failed:', e.message);
      }

      // Method 3: Try finding by user ID
      try {
        const { user: users } = await honeycombClient.findUsers({
          wallets: [walletAddress]
        });

        if (users && users.length > 0) {
          const user = users[0];
          console.log('Found user:', user.id, 'with profiles:', user.profiles?.length);
          
          // Use user ID to find profiles
          const profilesArray = await honeycombClient.findProfiles({
            userIds: [user.id], // Use the user ID
            projects: [projectAddress], 
            addresses: [], 
            identities: [], 
            includeProof: true, 
          }).then(({profile}) => profile);

          if (profilesArray && profilesArray.length > 0) {
            // Find profile for our specific project
            const projectProfile = profilesArray.find(p => p.project === projectAddress);
            if (projectProfile) {
              const mappedProfile = mapSDKProfileToAppProfile(projectProfile);
              console.log('Profile found via user ID search:', mappedProfile);
              return mappedProfile;
            }
          }
        }
      } catch (e) {
        console.log('Method 3 (user ID search) failed:', e.message);
      }

      // Method 4: Try finding all profiles for the project and filter manually
      try {
        const profilesArray = await honeycombClient.findProfiles({
          userIds: [], 
          projects: [projectAddress], 
          addresses: [], 
          identities: [], 
          includeProof: true, 
        }).then(({profile}) => profile);

        if (profilesArray && profilesArray.length > 0) {
          // Look for a profile that matches our wallet in any way
          const matchingProfile = profilesArray.find(p => {
            return p.user?.wallets?.wallets?.includes(walletAddress);
          });

          if (matchingProfile) {
            const mappedProfile = mapSDKProfileToAppProfile(matchingProfile);
            console.log('Profile found via project-wide search:', mappedProfile);
            return mappedProfile;
          }
        }
      } catch (e) {
        console.log('Method 4 (project-wide search) failed:', e.message);
      }
      
      // Wait with exponential backoff before next attempt
      if (attempt < maxAttempts) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 8000); // Max 8 seconds
        console.log(`All methods failed. Waiting ${delay}ms before next attempt...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    } catch (error) {
      console.error(`Profile fetch attempt ${attempt} failed completely:`, error);
      if (attempt === maxAttempts) {
        console.error('All profile fetch attempts exhausted');
        // Don't throw, return null to allow manual retry
      } else {
        // Wait before retry
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 8000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  console.log('Profile fetch failed after all attempts');
  return null;
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
  const [profileFetched, setProfileFetched] = useState(false);
  
  const clearState = () => {
      setError(null);
      setTxSignature(null);
  }

  // Fetch user profile when project and wallet are available
  useEffect(() => {
    let mounted = true;
    
    const fetchProfile = async () => {
      console.log('Initial profile fetch triggered');
      if (!project || !wallet.publicKey || profileFetched) {
        console.log('Skipping profile fetch:', {
          hasProject: !!project,
          hasWallet: !!wallet.publicKey,
          alreadyFetched: profileFetched
        });
        return;
      }

      if (!mounted) return;
      setIsLoading(true);
      clearState();

      try {
        const fetchedProfile = await retryProfileFetch(
          project.address, 
          wallet.publicKey.toBase58(),
          3
        );

        if (!mounted) return;

        if (fetchedProfile) {
          console.log('Profile found during initial fetch:', fetchedProfile);
          setProfile(fetchedProfile);
          setCanPlay(true);
          setProfileFetched(true);
        } else {
          console.log('No profile found during initial fetch');
          setProfile(null);
          setCanPlay(false);
        }
      } catch (e) {
        console.error('Initial profile fetch error:', e);
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
  }, [project, wallet.publicKey, profileFetched]);

  // Reset profile fetched state when wallet changes
  useEffect(() => {
    setProfileFetched(false);
    setProfile(null);
    setCanPlay(false);
  }, [wallet.publicKey]);

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
      // Don't set error for user already exists
      if (e instanceof Error && e.message.includes("already exists")) {
        console.log('User already exists, continuing...');
        return true;
      }
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
      // Step 1: First check if profile already exists with robust search
      console.log('Checking for existing profile...');
      try {
        const existingProfile = await retryProfileFetch(
          project.address, 
          wallet.publicKey.toBase58(),
          3
        );
        
        if (existingProfile) {
          console.log('Profile already exists! Setting it up:', existingProfile);
          setProfile(existingProfile);
          setCanPlay(true);
          setProfileFetched(true);
          setIsLoading(false);
          return;
        }
      } catch (e) {
        console.log('Initial profile check failed, will try to create new one');
      }

      // Step 2: Check if user exists, if not create user
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
      } else {
        console.log('User already exists:', existingUsers[0]);
        
        // If user exists, check their profiles again more thoroughly
        const user = existingUsers[0];
        if (user.profiles && user.profiles.length > 0) {
          console.log('User has profiles:', user.profiles);
          const projectProfile = user.profiles.find(p => p.project === project.address);
          if (projectProfile) {
            console.log('Found profile in user data:', projectProfile);
            const mappedProfile = mapSDKProfileToAppProfile(projectProfile);
            setProfile(mappedProfile);
            setCanPlay(true);
            setProfileFetched(true);
            setIsLoading(false);
            return;
          }
        }
      }

      // Step 3: Authenticate user
      console.log('Authenticating user...');
      let authResult: AuthResult;
      try {
        authResult = await authenticateUser(wallet);
        setAuthToken(authResult.accessToken);
        console.log('Authentication successful');
      } catch (authError) {
        console.error('Authentication failed:', authError);
        setError('Failed to authenticate user');
        return;
      }

      // Step 4: Try to create profile (this might fail if it already exists)
      console.log('Attempting to create new profile...');
      try {
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

        console.log('Transaction response received:', !!txResponse);

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
        }
      } catch (createError) {
        console.log('Profile creation failed (might already exist):', createError.message);
        // Don't fail here, just log and continue to fetch
      }

      // Step 5: Regardless of creation success/failure, try to fetch the profile
      console.log('Fetching profile (should exist now)...');
      const finalProfile = await retryProfileFetch(
        project.address, 
        wallet.publicKey.toBase58(),
        10 // More attempts
      );

      if (finalProfile) {
        console.log('Profile successfully found:', finalProfile);
        setProfile(finalProfile);
        setCanPlay(true);
        setProfileFetched(true);
      } else {
        console.error('Profile still not found after all attempts');
        setError('Profile exists but could not be loaded. Please refresh the page and try again.');
      }
      
    } catch (e) {
      console.error('Profile creation/fetch error:', e);
      
      // If we get a "profile already exists" error, try one more fetch
      if (e instanceof Error && (
          e.message.includes("Profile already exists") || 
          e.message.includes("already exists")
        )) {
        console.log('Profile already exists error - attempting final fetch...');
        
        try {
          const existingProfile = await retryProfileFetch(
            project.address, 
            wallet.publicKey.toBase58(),
            5
          );

          if (existingProfile) {
            console.log('Found existing profile after error:', existingProfile);
            setProfile(existingProfile);
            setCanPlay(true);
            setProfileFetched(true);
            return;
          }
        } catch (fetchError) {
          console.error('Final profile fetch also failed:', fetchError);
        }
        
        setError('Profile exists but cannot be loaded. Please refresh the page.');
      } else {
        setError(`Profile setup failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
      }
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
              const updatedProfile = await retryProfileFetch(
                project.address, 
                wallet.publicKey!.toBase58(),
                5
              );

              if (updatedProfile) {
                setProfile(updatedProfile);
                console.log('Profile updated after badge claim:', updatedProfile);
              }
            } catch (e) {
              console.error('Failed to refetch profile after badge claim:', e);
            }
          }, 3000);
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

  const updateProfile = (updatedProfile: HCB_Profile) => {
    setProfile(updatedProfile);
  };

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
    setProfile, // Export setProfile for manual profile loading
    updateProfile, // Export updateProfile for profile updates
  };
};