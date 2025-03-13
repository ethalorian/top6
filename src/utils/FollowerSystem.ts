import { ethers } from "ethers";
import { createClientUPProvider } from "@/providers/up-provider";

// Define provider interface to avoid using 'any'
type UPProviderType = ReturnType<typeof createClientUPProvider>;

// LSP26 Follower System contract address on LUKSO mainnet
export const LSP26_CONTRACT_ADDRESS = '0xf01103E5a9909Fc0DBe8166dA7085e0285daDDcA';

// LSP26 Follower System ABI - complete interface according to specification
export const LSP26_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "addr",
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
        "internalType": "address[]",
        "name": "addresses",
        "type": "address[]"
      }
    ],
    "name": "followBatch",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "addr",
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
        "internalType": "address[]",
        "name": "addresses",
        "type": "address[]"
      }
    ],
    "name": "unfollowBatch",
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
        "name": "addr",
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
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "addr",
        "type": "address"
      }
    ],
    "name": "followerCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "addr",
        "type": "address"
      }
    ],
    "name": "followingCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "addr",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "startIndex",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "endIndex",
        "type": "uint256"
      }
    ],
    "name": "getFollowsByIndex",
    "outputs": [
      {
        "internalType": "address[]",
        "name": "",
        "type": "address[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "addr",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "startIndex",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "endIndex",
        "type": "uint256"
      }
    ],
    "name": "getFollowersByIndex",
    "outputs": [
      {
        "internalType": "address[]",
        "name": "",
        "type": "address[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "follower",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "addr",
        "type": "address"
      }
    ],
    "name": "Follow",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "unfollower",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "addr",
        "type": "address"
      }
    ],
    "name": "Unfollow",
    "type": "event"
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
    console.log(`Following address: ${addressToFollow} from ${followerAddress}`);
    
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
 * Unfollow an address using the LSP26 Follower System
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
    console.log(`Unfollowing address: ${addressToUnfollow} from ${followerAddress}`);
    
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
    console.log(`Checking if ${followerAddress} is following ${followedAddress}`);
    
    // Ensure order of parameters matches the contract specification
    // isFollowing(address follower, address addr)
    const iface = new ethers.utils.Interface(LSP26_ABI);
    const calldata = iface.encodeFunctionData("isFollowing", [followerAddress, followedAddress]);
    
    // Use provider.request directly for reliable response handling
    const result = await provider.request({
      method: 'eth_call',
      params: [
        {
          to: LSP26_CONTRACT_ADDRESS,
          data: calldata
        },
        'latest'
      ]
    });
    
    console.log("Raw result from isFollowing:", result);
    
    // Decode the result - for boolean values, LSP26 returns 0x1 (true) or 0x0 (false)
    // The return is 32 bytes padded for boolean: 0x0000000000000000000000000000000000000000000000000000000000000001
    const isFollowing = result === "0x0000000000000000000000000000000000000000000000000000000000000001";
    
    console.log(`Follow status: ${isFollowing}`);
    return isFollowing;
  } catch (error) {
    console.error("Error checking follow status:", error);
    return false;
  }
}

/**
 * Get followers count for an address
 * @param provider The provider to use for the call
 * @param address The address to check follower count for
 * @returns A promise that resolves to the number of followers
 */
export async function getFollowerCount(
  provider: UPProviderType,
  address: string
): Promise<number> {
  try {
    const iface = new ethers.utils.Interface(LSP26_ABI);
    const calldata = iface.encodeFunctionData("followerCount", [address]);
    
    const result = await provider.request({
      method: 'eth_call',
      params: [
        {
          to: LSP26_CONTRACT_ADDRESS,
          data: calldata
        },
        'latest'
      ]
    });
    
    // Parse the hex result to a number
    const count = parseInt(result, 16);
    return count;
  } catch (error) {
    console.error("Error getting follower count:", error);
    return 0;
  }
}

/**
 * Get following count for an address
 * @param provider The provider to use for the call
 * @param address The address to check following count for
 * @returns A promise that resolves to the number of addresses being followed
 */
export async function getFollowingCount(
  provider: UPProviderType,
  address: string
): Promise<number> {
  try {
    const iface = new ethers.utils.Interface(LSP26_ABI);
    const calldata = iface.encodeFunctionData("followingCount", [address]);
    
    const result = await provider.request({
      method: 'eth_call',
      params: [
        {
          to: LSP26_CONTRACT_ADDRESS,
          data: calldata
        },
        'latest'
      ]
    });
    
    // Parse the hex result to a number
    const count = parseInt(result, 16);
    return count;
  } catch (error) {
    console.error("Error getting following count:", error);
    return 0;
  }
} 