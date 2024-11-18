import PropTypes from "prop-types";
import "@rainbow-me/rainbowkit/styles.css";
import {
  getDefaultConfig,
  RainbowKitProvider,
  lightTheme,
} from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import {
  sepolia,
  mainnet,
  polygon,
  optimism,
  arbitrum,
  base,
  skaleTitanTestnet,
} from "wagmi/chains";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";

export default function Providers({ children }) {
  const config = getDefaultConfig({
    appName: "My RainbowKit App",
    projectId: "1e91e33eb8db73af7f34de8d02fb03f1",
    chains: [
      sepolia,
      mainnet,
      polygon,
      optimism,
      arbitrum,
      base,
      skaleTitanTestnet,
    ],
    ssr: false,
  });

  const queryClient = new QueryClient();

  Providers.propTypes = {
    children: PropTypes.node.isRequired,
  };

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={lightTheme({
            accentColor: "#083344",
            accentColorForeground: "white",
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
