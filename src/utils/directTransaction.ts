// Add type declaration for window.ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

// New utility file for direct provider interaction

// Function to directly send transactions without ethers.js
export async function sendDirectTransaction(
    to: string,
    data: string,
    from: string
  ): Promise<string> {
    // Check if window.ethereum is available
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('No Ethereum provider found');
    }
  
    try {
      // Prepare transaction parameters
      const transactionParameters = {
        to, // The contract address
        from, // User's address
        data, // Encoded transaction data
      };
  
      // Send transaction directly using provider
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [transactionParameters],
      });
  
      console.log('Transaction sent directly:', txHash);
      return txHash as string;
    } catch (error) {
      console.error('Direct transaction error:', error);
      throw error;
    }
  }
  
  // Helper function to pad hex string to 32 bytes (64 chars + 0x)
  export function padTo32Bytes(hexString: string): string {
    // Remove '0x' prefix if present
    const cleanHex = hexString.startsWith('0x') ? hexString.slice(2) : hexString;
    
    // Pad to 64 characters (32 bytes)
    const padded = cleanHex.padStart(64, '0');
    
    return '0x' + padded;
  }
  
  // Function to manually encode setDataBatch parameters
  export function encodeSetDataBatchData(keys: string[], values: string[]): string {
    if (keys.length !== values.length) {
      throw new Error('Keys and values must have the same length');
    }
  
    // Function selector for setDataBatch(bytes32[],bytes[])
    const functionSelector = '0x97902421';
  
    // Encode array offset pointers (both arrays start after all the pointers)
    // Position for first array (keys): 0x40 (64 bytes - 2 pointers of 32 bytes each)
    // Position for second array (values): calculated based on keys array length
    const keysPositionHex = '0000000000000000000000000000000000000000000000000000000000000040';
    
    // Calculate values position: 0x40 (first array position) + 0x20 (array length) + (keys.length * 0x20)
    const valuesPosition = 0x40 + 0x20 + (keys.length * 0x20);
    const valuesPositionHex = valuesPosition.toString(16).padStart(64, '0');
    
    // Encode arrays length
    const keysLengthHex = keys.length.toString(16).padStart(64, '0');
    
    // Encode keys array items (each key is already 32 bytes)
    let encodedKeys = '';
    for (const key of keys) {
      // Remove 0x prefix and ensure 32 bytes
      const cleanKey = key.startsWith('0x') ? key.slice(2) : key;
      encodedKeys += cleanKey.padStart(64, '0');
    }
    
    // Encode values array length
    const valuesLengthHex = values.length.toString(16).padStart(64, '0');
    
    // For values, we need to include offset for each value and then the actual values
    let valuesOffsets = '';
    let valuesData = '';
    let currentOffset = values.length * 0x20; // Start after all the offsets
    
    for (const value of values) {
      // Add offset pointer
      valuesOffsets += currentOffset.toString(16).padStart(64, '0');
      
      // Clean value (remove 0x)
      const cleanValue = value.startsWith('0x') ? value.slice(2) : value;
      
      // Get length in bytes
      const valueLength = cleanValue.length / 2;
      const valueLengthHex = valueLength.toString(16).padStart(64, '0');
      
      // Add value data (length + data)
      valuesData += valueLengthHex + cleanValue;
      
      // Update offset for next value
      // 32 bytes for length + value length (padded to 32 byte multiples)
      const valuePaddedLength = Math.ceil(valueLength / 32) * 32;
      currentOffset += 32 + valuePaddedLength;
    }
    
    // Combine all parts
    const encodedData = functionSelector + 
                       keysPositionHex +
                       valuesPositionHex +
                       keysLengthHex +
                       encodedKeys +
                       valuesLengthHex +
                       valuesOffsets +
                       valuesData;
    
    return encodedData;
  }