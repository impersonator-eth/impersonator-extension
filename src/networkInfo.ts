const networkInfo: { [chainId: number]: { name: string; rpcUrl: string[] } } = {
  1: {
    name: "ETH Mainnet",
    rpcUrl: [
      `https://mainnet.infura.io/v3/${process.env.REACT_APP_INFURA_KEY}`,
    ],
  },
  10: {
    name: "Optimism",
    rpcUrl: [
      `https://optimism-mainnet.infura.io/v3/${process.env.REACT_APP_INFURA_KEY}`,
    ],
  },
  137: {
    name: "Polygon",
    rpcUrl: [
      `https://polygon-mainnet.infura.io/v3/${process.env.REACT_APP_INFURA_KEY}`,
    ],
  },
};

const chainIds = Object.keys(networkInfo).map((e) => parseInt(e));

export { networkInfo, chainIds };
