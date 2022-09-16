const networkInfo: { [chainId: number]: { name: string } } = {
  1: {
    name: "ETH Mainnet",
  },
  10: {
    name: "Optimism",
  },
  137: {
    name: "Polygon",
  },
};

const chainIds = Object.keys(networkInfo).map((e) => parseInt(e));

export { networkInfo, chainIds };
