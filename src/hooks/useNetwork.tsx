import { useState, useEffect } from "react";
import { NetworkInfo } from "../types";

function useNetwork() {
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>();
  const [chainIds, setChainIds] = useState<number[]>();

  useEffect(() => {
    const fetch = async () => {
      const { networkInfo: storedNetworkInfo } = (await chrome.storage.sync.get(
        "networkInfo"
      )) as {
        networkInfo: NetworkInfo | undefined;
      };

      if (storedNetworkInfo) {
        setNetworkInfo(storedNetworkInfo);
      }
    };

    fetch();
  }, []);

  useEffect(() => {
    const saveToBrowser = async () => {
      await chrome.storage.sync.set({
        networkInfo,
      });
    };

    if (networkInfo) {
      setChainIds(Object.keys(networkInfo).map((e) => parseInt(e)));
      saveToBrowser();
    }
  }, [networkInfo]);

  return { networkInfo, setNetworkInfo, chainIds };
}

export default useNetwork;
