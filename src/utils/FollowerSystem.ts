import { ethers } from "ethers";
import { createClientUPProvider } from "@/providers/up-provider";

// Define provider interface to avoid using 'any'
type UPProviderType = ReturnType<typeof createClientUPProvider>;

// LSP26 Follower System contract address on LUKSO mainnet
export const LSP26_CONTRACT_ADDRESS = '0xf01103E5a9909Fc0DBe8166dA7085e0285daDDcA';

// LSP26 Follower System ABI - just the methods we need
export const LSP26_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "addressToFollow",
        "type": "address"
      }
    ],
    "name": "follow",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "addressToUnfollow",
        "type": "address"
      }
    ],
    "name": "unfollow",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "follower",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "followed",
        "type": "address"
      }
    ],
    "name": "isFollowing",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

/**
 * Follow an address using the LSP26 Follower System
 * @param provider The provider to use for the transaction
 * @param followerAddress The address that will follow (typically the current user)
 * @param addressToFollow The address to follow
 * @returns A promise that resolves when the follow transaction is sent
 */
export async function followAddress(
  provider: UPProviderType,
  followerAddress: string,
  addressToFollow: string
): Promise<string> {
  try {
    // Create an interface to encode the function call
    const iface = new ethers.utils.Interface(LSP26_ABI);
    const calldata = iface.encodeFunctionData("follow", [addressToFollow]);

    // Send the transaction
    const tx = await provider.request({
      method: 'eth_sendTransaction',
      params: [{
        from: followerAddress,
        to: LSP26_CONTRACT_ADDRESS,
        data: calldata,
      }]
    });

    console.log("Follow transaction sent:", tx);
    return tx as string;
  } catch (error) {
    console.error("Error following address:", error);
    throw error;
  }
}

/**
 * Unfollow an address uing the LSP26 Follower System
 * @param provider The provider to use for the transaction
 * @param followerAddress The address that will unfollow (typically the current user)
 * @param addressToUnfollow The address to unfollow
 * @returns A promise that resolves when the unfollow transaction is sent
 */
export async function unfollowAddress(
  provider: UPProviderType,
  followerAddress: string,
  addressToUnfollow: string
): Promise<string> {
  try {
    // Create an interface to encode the function call
    const iface = new ethers.utils.Interface(LSP26_ABI);
    const calldata = iface.encodeFunctionData("unfollow", [addressToUnfollow]);

    // Send the transaction
    const tx = await provider.request({
      method: 'eth_sendTransaction',
      params: [{
        from: followerAddress,
        to: LSP26_CONTRACT_ADDRESS,
        data: calldata,
      }]
    });

    console.log("Unfollow transaction sent:", tx);
    return tx as string;
  } catch (error) {
    console.error("Error unfollowing address:", error);
    throw error;
  }
}

/**
 * Check if an address is following another address
 * @param provider The provider to use for the call
 * @param followerAddress The potential follower address
 * @param followedAddress The potentially followed address
 * @returns A promise that resolves to true if following, false otherwise
 */
export async function checkIsFollowing(
  provider: UPProviderType,
  followerAddress: string,
  followedAddress: string
): Promise<boolean> {
  try {
    // Create an ethers provider
    // Need to cast here because Web3Provider expects a specific Provider type
    // This is a safe cast because the UP provider implements the required methods
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ethersProvider = new ethers.providers.Web3Provider(provider as any);
    
    // Create a contract instance
    const contract = new ethers.Contract(
      LSP26_CONTRACT_ADDRESS,
      LSP26_ABI,
      ethersProvider
    );
    
    // Call the isFollowing method
    const isFollowing = await contract.isFollowing(followerAddress, followedAddress);
    return isFollowing;
  } catch (error) {
    console.error("Error checking follow status:", error);
    return false;
  }
} 