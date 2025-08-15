honeycom official website = https://docs.honeycombprotocol.com/

Update profile (clients side)
Same as creating a profile, you'll need to authenticate the user and include an access token in the request. Please see this page (Authenticating with the Edge Client
Certain actions on the Edge Client will require your users to be authenticated. We recommend authenticating your players before attempting to perform game actions using the Edge Client.

You'll need to first create a Honeycomb user before authenticating using the information below.

Authenticating with the Edge Client
Authentication using Edge Client is a 2 step process. First, send an auth request query like this:

JavaScript
GraphQL
Unity/C#
Godot
const { 
  authRequest: { message: authRequest } 
} = await client.authRequest({
  userPublicKey.toString()
});

In return you'll get a response like this:


{
  "data": {
    "message": "Please sign this message to authenticate to Honeycomb unified interface: 3CzXyQb2NVuXaKuQJ26FTqWcdXxirGvbJ2RNPpXCA9Mj"
  }
}



Next, you will need sign this message:

Front-end
Server-side
Unity/C#
Godot
import { useWallet } from "@solana/wallet-adapter-react";
import base58 from "bs58";

// Get the user's wallet
const wallet = useWallet();
// Convert the auth request into a UInt8Array
const encodedMessage = new TextEncoder().encode(authRequest);
// Sign the message
const signedUIntArray = await wallet.signMessage(encodedMessage);
// Convert the signed message into a base58 encoded string
const signature = base58.encode(signedUIntArray);
// Send the signed message to the server
const { authConfirm } = await client.authConfirm({ wallet: userPublicKey.toString(), signature });


After you've sent the signed message to the server, you'll get an access token and a user object containing the details of the user. You can use the access token to authenticate the user in subsequent requests. Here's an example:

Frontend/ServerSide
Unity/C#
Godot
const { createNewProfileTransaction: txResponse } =
  await client.createNewProfileTransaction(
    {
      project: projectAddress,
      info: {
        name: `Test profile`,
        bio: `This is a test profile`,
        pfp: "https://www.example.com/pfp.png",
      },
      payer: userPublicKey.toString(),
    },
    {
      fetchOptions: {
          headers: {
            authorization: `Bearer ${accessToken}`,
          },
        },
    }
  );

) to learn how to get an access token.

JavaScript
const {
  createUpdateProfileTransaction: txResponse // This is the transaction response, you'll need to sign and send this transaction
} = await client.createUpdateProfileTransaction({
  payer: userPublicKey.toString(),
  profile: profileAddress.toString(),
  info: {
    bio: "This is profile of user",
    name: "User",
    pfp: "link-to-pfp"
  },
  customData: {
    add: { // Here you can add any custom data to a user's profile, the format is given below (please always use key: ["string"])
      location: ["San Francisco, CA"],
      website: ["https://johndoe.dev"],
      github: ["https://github.com/johndoe"],
      stars: ["55"]
    },
    remove: [ // Provide any keys for custom data you want to remove from the profile, the key-value pairs will be removed, the format is given below
      "collaborations" // This will remove the key "collaborations" from the profile along with the corresponding value
    ]
  }
},
{
  fetchOptions: {
    headers: {
      authorization: `Bearer ${accessToken}`, // Required, you'll need to authenticate the user with our Edge Client and provide the resulting access token here, otherwise this operation will fail
    },
  }
});


Users
Before you can create a profile for your project, you need to create a user. Let's cover how you can create a user.

Creating a user 
JavaScript
GraphQL
Unity/C#
Godot
const {
  createNewUserTransaction: txResponse // This is the transaction response, you'll need to sign and send this transaction
} = await client.createNewUserTransaction({
    wallet: userPublicKey.toString(), // User's wallet public key
    info: {
        name: "Test User",
        pfp: "https://lh3.googleusercontent.com/-Jsm7S8BHy4nOzrw2f5AryUgp9Fym2buUOkkxgNplGCddTkiKBXPLRytTMXBXwGcHuRr06EvJStmkHj-9JeTfmHsnT0prHg5Mhg",
        bio: "This is a test user",
    },
    payer: adminPublicKey.toString(), // Optional, the transaction payer's public key
});


Create user and profile 
You can create a user and a profile in a single transaction. However, please do keep in mind that profiles are stored in a merkle tree, so if your project doesn't have a profiles tree, this operation won't work as intended. Please create a profiles tree before using this operation.

JavaScript
GraphQL
Unity/C#
Godot
const { 
  createNewUserWithProfileTransaction: txResponse // This is the transaction response, you'll need to sign and send this transaction
} = await client.createNewUserWithProfileTransaction({
    project: projectAddress.toString(),
    wallet: userPublicKey.toString(),
    payer: adminPublicKey.toString(), 
    profileIdentity: "main",
    userInfo: {
        name: "Honeycomb Developer",
        bio: "This user is created for testing purposes",
        pfp: "https://lh3.googleusercontent.com/-Jsm7S8BHy4nOzrw2f5AryUgp9Fym2buUOkkxgNplGCddTkiKBXPLRytTMXBXwGcHuRr06EvJStmkHj-9JeTfmHsnT0prHg5Mhg",
    },
});


Update user 
The update user operation allows you to not only update a user's previously provided information, but also to get their Civic Pass information.

JavaScript
GraphQL
Unity/C#
Godot
const { createUpdateUserTransaction: txResponse } =
  await client.createUpdateUserTransaction(
    {
      payer: userPublicKey.toString(), // The public key of the user who is updating their information
      populateCivic: true, // Optional, set to true if you want to populate the Civic Pass information
      wallets: { // Optional, add or remove wallets from the user's Honeycomb Protocol account  
        add: [newPublicKey], // Optional, add any wallets to the user's Honeycomb Protocol account
        remove: [oldPublicKey] // Optional, remove any wallets from the user's Honeycomb Protocol account
      },
      info: { // Optional, user's information
        bio: "Updated user bio", // Optional, updated user bio
        name: "Honeycomb Developer", // Optional, updated name
        pfp: "https://lh3.googleusercontent.com/-Jsm7S8BHy4nOzrw2f5AryUgp9Fym2buUOkkxgNplGCddTkiKBXPLRytTMXBXwGcHuRr06EvJStmkHj-9JeTfmHsnT0prHg5Mhg", // Optional, updated profile picture
      }
    },
    {
      fetchOptions: {
          headers: {
            authorization: `Bearer ${accessToken}`, // Required, you'll need to authenticate the user with our Edge Client and provide the resulting access token here, otherwise this operation will fail
          },
        },
    }
  );