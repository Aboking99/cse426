export function chainIdToHex(chainId) {
  return "0x" + BigInt(chainId).toString(16);
}

/**
 * Switch or add MetaMask to the chain described in deployed.json.
 *
 * @param {import('ethers').Eip1193Provider} ethereum
 * @param {number} chainId
 * @param {string} rpcUrl
 * @param {string} [chainName]
 * @param {string} [blockExplorerUrl]
 */
export async function ensureChain(
  ethereum,
  chainId,
  rpcUrl,
  chainName = "Network",
  blockExplorerUrl = ""
) {
  const hex = chainIdToHex(chainId);
  try {
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: hex }],
    });
  } catch (e) {
    if (e.code === 4902) {
      await ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: hex,
            chainName,
            nativeCurrency: {
              name: "Ether",
              symbol: "ETH",
              decimals: 18,
            },
            rpcUrls: [rpcUrl],
            ...(blockExplorerUrl
              ? { blockExplorerUrls: [blockExplorerUrl] }
              : {}),
          },
        ],
      });
      return;
    }
    throw e;
  }
}
