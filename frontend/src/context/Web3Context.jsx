import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ethers } from "ethers";
import { fetchDeployed } from "../lib/deployed.js";
import { ensureChain } from "../lib/chains.js";

const Web3Context = createContext(null);

export function Web3Provider({ children }) {
  const [deployed, setDeployed] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState("");
  const [connectStatus, setConnectStatus] = useState("");

  useEffect(() => {
    fetchDeployed()
      .then((d) => {
        if (!d) {
          setLoadError("Invalid deployment config.");
          return;
        }
        setLoadError("");
        setDeployed(d);
      })
      .catch((e) => setLoadError(e.message));
  }, []);

  const ready = Boolean(
    deployed?.chainId != null &&
      deployed?.rpcUrl &&
      Array.isArray(deployed.campaigns) &&
      deployed.campaigns.length > 0
  );

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setConnectStatus("Install MetaMask to connect.");
      return;
    }
    if (!ready || !deployed) {
      setConnectStatus("Add campaigns and rpcUrl in deployed.json first.");
      return;
    }
    try {
      setConnectStatus("Connecting…");
      await ensureChain(
        window.ethereum,
        Number(deployed.chainId),
        deployed.rpcUrl,
        deployed.networkName || "Network"
      );
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      await browserProvider.send("eth_requestAccounts", []);
      const net = await browserProvider.getNetwork();
      if (Number(net.chainId) !== Number(deployed.chainId)) {
        setConnectStatus("Switch MetaMask to the network in deployed.json.");
        return;
      }
      const s = await browserProvider.getSigner();
      const addr = await s.getAddress();
      setSigner(s);
      setAccount(addr);
      setConnectStatus("Connected.");

      const reload = () => window.location.reload();
      window.ethereum.on?.("accountsChanged", reload);
      window.ethereum.on?.("chainChanged", reload);
    } catch (e) {
      setConnectStatus(e.shortMessage || e.message);
    }
  }, [deployed, ready]);

  const value = useMemo(
    () => ({
      deployed,
      loadError,
      ready,
      signer,
      account,
      connectStatus,
      connect,
      yodaIsMock: deployed?.yodaIsMock === true,
    }),
    [deployed, loadError, ready, signer, account, connectStatus, connect]
  );

  return (
    <Web3Context.Provider value={value}>{children}</Web3Context.Provider>
  );
}

export function useWeb3() {
  const ctx = useContext(Web3Context);
  if (!ctx) throw new Error("useWeb3 must be used within Web3Provider");
  return ctx;
}
