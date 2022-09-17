import React, { createContext, useState, useEffect, useContext } from "react";
import { NetworksInfo } from "../types";

type NetworkContextType = {
  networksInfo: NetworksInfo | undefined;
  setNetworksInfo: React.Dispatch<
    React.SetStateAction<NetworksInfo | undefined>
  >;
  chainIds: number[] | undefined;
};

export const NetworksContext = createContext<NetworkContextType>({
  networksInfo: undefined,
  setNetworksInfo: () => {},
  chainIds: undefined,
});

export const NetworksProvider: React.FunctionComponent = ({ children }) => {
  const [networksInfo, setNetworksInfo] = useState<NetworksInfo>();
  const [chainIds, setChainIds] = useState<number[]>();

  useEffect(() => {
    const fetch = async () => {
      const { networksInfo: storedNetworksInfo } =
        (await chrome.storage.sync.get("networksInfo")) as {
          networksInfo: NetworksInfo | undefined;
        };

      if (storedNetworksInfo) {
        setNetworksInfo(storedNetworksInfo);
      }
    };

    fetch();
  }, []);

  useEffect(() => {
    const saveToBrowser = async () => {
      await chrome.storage.sync.set({
        networksInfo,
      });
    };

    if (networksInfo) {
      setChainIds(Object.keys(networksInfo).map((e) => parseInt(e)));
      saveToBrowser();
    }
  }, [networksInfo]);

  return (
    <NetworksContext.Provider
      value={{
        networksInfo,
        setNetworksInfo,
        chainIds,
      }}
    >
      {children}
    </NetworksContext.Provider>
  );
};

export const useNetworks = () => useContext(NetworksContext);
