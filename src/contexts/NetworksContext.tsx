import React, { createContext, useState, useEffect, useContext } from "react";
import { useUpdateEffect } from "@chakra-ui/react";
import { NetworksInfo } from "@/types";

type NetworkContextType = {
  networksInfo: NetworksInfo | undefined;
  setNetworksInfo: React.Dispatch<
    React.SetStateAction<NetworksInfo | undefined>
  >;
};

export const NetworksContext = createContext<NetworkContextType>({
  networksInfo: undefined,
  setNetworksInfo: () => {},
});

export const NetworksProvider: React.FunctionComponent = ({ children }) => {
  const [networksInfo, setNetworksInfo] = useState<NetworksInfo>();

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

  useUpdateEffect(() => {
    const saveToBrowser = async () => {
      await chrome.storage.sync.set({
        networksInfo,
      });
    };

    saveToBrowser();
  }, [networksInfo]);

  return (
    <NetworksContext.Provider
      value={{
        networksInfo,
        setNetworksInfo,
      }}
    >
      {children}
    </NetworksContext.Provider>
  );
};

export const useNetworks = () => useContext(NetworksContext);
