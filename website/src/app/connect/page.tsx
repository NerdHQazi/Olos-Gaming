"use client";

import { useCallback, useEffect, useState } from "react";
import { useAppKit, useAppKitAccount } from "@reown/appkit/react";
import { useAppKitWallet } from "@reown/appkit-wallet-button/react";
import Secure from "../../../Screens/connect/secure";
import WalleConnections from "../../../Screens/connect/wallets-connection";
import ConnectionStates from "../../../Screens/connect/connection-state";

interface EthereumProvider {
  isMetaMask?: boolean;
  providers?: EthereumProvider[];
  request: <T = unknown>(args: {
    method: string;
    params?: unknown[] | Record<string, unknown>;
  }) => Promise<T>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (
    event: string,
    handler: (...args: unknown[]) => void,
  ) => void;
}

interface EIP6963ProviderDetail {
  info: {
    uuid: string;
    name: string;
    icon: string;
    rdns: string;
  };
  provider: EthereumProvider;
}

interface EIP6963AnnounceEvent extends Event {
  detail: EIP6963ProviderDetail;
}

type ConnectionState = "idle" | "connecting" | "success" | "error";
type WalletType = "MetaMask" | "WalletConnect" | null;

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function getWindowEthereum(): EthereumProvider | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  return window.ethereum as unknown as EthereumProvider | undefined;
}

function findMetaMaskProvider(
  providers: EIP6963ProviderDetail[],
): EthereumProvider | undefined {
  const eip6963MetaMask = providers.find(
    (item) =>
      item.info.rdns === "io.metamask" ||
      item.info.name.toLowerCase() === "metamask",
  );

  if (eip6963MetaMask) {
    return eip6963MetaMask.provider;
  }

  const ethereum = getWindowEthereum();

  if (!ethereum) {
    return undefined;
  }

  if (ethereum.providers?.length) {
    return ethereum.providers.find((provider) => provider.isMetaMask);
  }

  if (ethereum.isMetaMask) {
    return ethereum;
  }

  return undefined;
}

export default function Page() {
  const { close } = useAppKit();

  const { address: appKitAddress, isConnected: isAppKitConnected } =
    useAppKitAccount({
      namespace: "eip155",
    });

  const [connectionState, setConnectionState] =
    useState<ConnectionState>("idle");
  const [walletAddress, setWalletAddress] = useState("");
  const [connectedWallet, setConnectedWallet] = useState<WalletType>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [eip6963Providers, setEip6963Providers] = useState<
    EIP6963ProviderDetail[]
  >([]);

  console.log(walletAddress);
  const [metaMaskProvider, setMetaMaskProvider] =
    useState<EthereumProvider | null>(null);

  const { isReady, isPending, connect } = useAppKitWallet({
    namespace: "eip155",
    onSuccess: () => {
      setErrorMessage("");
    },
    onError: (error: Error) => {
      setConnectionState("error");
      setConnectedWallet("WalletConnect");
      setErrorMessage(error.message || "Unable to connect to WalletConnect.");
    },
  });

  useEffect(() => {
    const handleAnnounceProvider = (event: Event) => {
      const customEvent = event as EIP6963AnnounceEvent;
      const detail = customEvent.detail;

      if (!detail?.provider) {
        return;
      }

      setEip6963Providers((current) => {
        const exists = current.some(
          (item) => item.info.uuid === detail.info.uuid,
        );

        if (exists) {
          return current;
        }

        return [...current, detail];
      });
    };

    window.addEventListener("eip6963:announceProvider", handleAnnounceProvider);

    window.dispatchEvent(new Event("eip6963:requestProvider"));

    return () => {
      window.removeEventListener(
        "eip6963:announceProvider",
        handleAnnounceProvider,
      );
    };
  }, []);

  let provider = metaMaskProvider;

  useEffect(() => {
    provider = findMetaMaskProvider(eip6963Providers) ?? null;

    if (provider) {
      setMetaMaskProvider(provider);
    }
  }, [eip6963Providers]);

  useEffect(() => {
    if (metaMaskProvider) {
      return;
    }

    const timeout = window.setTimeout(() => {
      provider = findMetaMaskProvider(eip6963Providers) ?? null;

      if (provider) {
        setMetaMaskProvider(provider);
      }
    }, 1000);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [eip6963Providers, metaMaskProvider]);

  useEffect(() => {
    if (
      connectedWallet === "WalletConnect" &&
      isAppKitConnected &&
      appKitAddress
    ) {
      setWalletAddress(appKitAddress);
      setConnectionState("success");
      close();
    }
  }, [appKitAddress, close, connectedWallet, isAppKitConnected]);

  useEffect(() => {
    if (!metaMaskProvider) {
      return;
    }

    const handleAccountsChanged = (...args: unknown[]) => {
      const accounts = args[0] as string[] | undefined;
      const account = accounts?.[0];

      if (connectedWallet !== "MetaMask") {
        return;
      }

      if (!account) {
        setWalletAddress("");
        setConnectedWallet(null);
        setConnectionState("idle");
        return;
      }

      setWalletAddress(account);
      setConnectionState("success");
    };

    const handleChainChanged = () => {
      if (connectedWallet === "MetaMask") {
        setConnectionState("success");
      }
    };

    metaMaskProvider.on?.("accountsChanged", handleAccountsChanged);
    metaMaskProvider.on?.("chainChanged", handleChainChanged);

    return () => {
      metaMaskProvider.removeListener?.(
        "accountsChanged",
        handleAccountsChanged,
      );

      metaMaskProvider.removeListener?.("chainChanged", handleChainChanged);
    };
  }, [connectedWallet, metaMaskProvider]);

  const connectMetaMask = useCallback(async () => {
    setErrorMessage("");
    setConnectedWallet("MetaMask");
    setConnectionState("connecting");

    let provider = metaMaskProvider;

    if (!provider) {
      provider = findMetaMaskProvider(eip6963Providers) ?? null;
    }

    if (!provider) {
      window.dispatchEvent(new Event("eip6963:requestProvider"));

      await new Promise((resolve) => {
        window.setTimeout(resolve, 500);
      });

      provider = findMetaMaskProvider(eip6963Providers) ?? null;
    }

    if (!provider) {
      setConnectionState("error");
      setErrorMessage(
        "MetaMask was not detected. Please make sure the MetaMask extension is installed and enabled in this browser.",
      );
      return;
    }

    setMetaMaskProvider(provider);

    try {
      const accounts = await provider.request<string[]>({
        method: "eth_requestAccounts",
      });

      const account = accounts?.[0];

      if (!account) {
        throw new Error("MetaMask did not return an account.");
      }

      setWalletAddress(account);
      if (typeof window !== "undefined") {
        localStorage.setItem("eth_address", account);
      }
      setConnectedWallet("MetaMask");
      setConnectionState("success");
    } catch (error) {
      setConnectedWallet("MetaMask");
      setConnectionState("error");

      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        (error as { code?: number }).code === 4001
      ) {
        setErrorMessage("The MetaMask connection request was rejected.");
        return;
      }

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to connect to MetaMask.",
      );
    }
  }, [eip6963Providers, metaMaskProvider]);

  const connectWalletConnect = async () => {
    if (!isReady || isPending) {
      return;
    }

    setErrorMessage("");
    setConnectedWallet("WalletConnect");
    setConnectionState("connecting");

    try {
      await connect("walletConnect");
    } catch (error) {
      setConnectionState("error");
      setConnectedWallet("WalletConnect");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to connect with WalletConnect.",
      );
    }
  };

  const copyAddress = async () => {
    if (!walletAddress) {
      return;
    }

    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch {
      setCopied(false);
    }
  };

  const resetConnection = () => {
    close();
    setConnectionState("idle");
    setErrorMessage("");
    setConnectedWallet(null);
    setWalletAddress("");
    setCopied(false);
  };

  const handleWalletClick = (walletName: string) => {
    if (walletName === "MetaMask") {
      void connectMetaMask();
      return;
    }

    if (walletName === "WalletConnect") {
      void connectWalletConnect();
    }
  };

  return (
    <main className="min-h-screen bg-[#05080f] px-5 py-8 text-white sm:px-8 lg:px-12">
      <div className="mx-auto flex min-h-[calc(100vh-64px)] max-w-[1160px] items-center justify-center">
        <div className="grid w-full grid-cols-1 gap-10 lg:grid-cols-[1fr_1fr] lg:gap-12">
          <Secure />

          <WalleConnections
            isPending={isPending}
            isReady={isReady!}
            handleWalletClick={handleWalletClick}
          />
        </div>
      </div>

      <ConnectionStates
        connectionState={connectionState}
        connectedWallet={connectedWallet!}
        resetConnection={resetConnection}
        shortenAddress={shortenAddress}
        copyAddress={copyAddress}
        copied={copied}
        errorMessage={errorMessage}
        connectMetaMask={connectMetaMask}
        connectWalletConnect={connectWalletConnect}
        walletAddress={walletAddress}
      />
    </main>
  );
}
