import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';
import { sepolia } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'FHEverse Card Game',
  projectId: 'fheverse-card-game',
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(sepolia.rpcUrls.default.http[0]),
  },
  ssr: false,
});
