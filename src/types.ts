export type NetworksInfo = {
  [name: string]: { chainId: number; rpcUrl: string };
};

export type SimulationInfo = {
  accountSlug: string;
  projectSlug: string;
  accessKey: string;
}