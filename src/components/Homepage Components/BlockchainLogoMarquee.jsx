import BitcoinLogo from "/bitcoin.svg";
import EthereumLogo from "/ethereum3.svg";
import StellarLogo from "/stellar.svg";
import LitecoinLogo from "/litecoin.svg";
import MoneroLogo from "/monero.svg";
import SolanaLogo from "/solana.svg";
import TronLogo from "/tron.svg";
import WorldcoinLogo from "/worldcoin.svg";
import SkaleLogo from "/skale.svg";
import PolygonLogo from "/polygon.svg";
import AvalancheLogo from "/avalanche.svg";
import ArbitrumLogo from "/arbitrum.svg";
import BinanceLogo from "/binance.svg";
import UniswapLogo from "/uniswap.svg";
import MetamaskLogo from "/metamask.svg";

const BlockchainLogoMarquee = () => {
  const logos = [
    { Logo: BitcoinLogo, name: "Bitcoin" },
    { Logo: EthereumLogo, name: "Ethereum" },
    { Logo: StellarLogo, name: "Stellar" },
    { Logo: LitecoinLogo, name: "Litecoin" },
    { Logo: MoneroLogo, name: "Monero" },
    { Logo: SolanaLogo, name: "Solana" },
    { Logo: TronLogo, name: "Tron" },
    { Logo: WorldcoinLogo, name: "Worldcoin" },
    { Logo: AvalancheLogo, name: "Avalanche" },
    { Logo: ArbitrumLogo, name: "Arbitrum" },
    { Logo: BinanceLogo, name: "Binance" },
    { Logo: UniswapLogo, name: "Uniswap" },
    { Logo: MetamaskLogo, name: "Metamask" },
    { Logo: SkaleLogo, name: "Skale" },
    { Logo: PolygonLogo, name: "Polygon" },
  ];

  return (
    <div className="relative overflow-hidden py-8">
      <div className="animate-marquee flex">
        {[...logos, ...logos].map((logo, index) => (
          <div
            key={index}
            className="flex-shrink-0 mx-8 opacity-50 hover:opacity-100 transition-opacity"
            title={logo.name}
          >
            <img
              src={logo.Logo}
              alt={logo.name}
              className="h-12 w-[120px] grayscale hover:grayscale-0 transition-all"
            />
          </div>
        ))}
      </div>
      <style jsx>{`
        @keyframes marquee {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          display: flex;
          animation: marquee 20s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default BlockchainLogoMarquee;
