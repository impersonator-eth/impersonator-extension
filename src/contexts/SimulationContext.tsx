import React, { createContext, useState, useEffect, useContext } from "react";
import { useUpdateEffect } from "@chakra-ui/react";
import { SimulationInfo } from "@/types";

type SimulationContextType = {
  simulationInfo: SimulationInfo | undefined;
  setSimulationInfo: React.Dispatch<
    React.SetStateAction<SimulationInfo | undefined>
  >;
};

export const SimulationContext = createContext<SimulationContextType>({
  simulationInfo: undefined,
  setSimulationInfo: () => {},
});

export const SimulationProvider: React.FunctionComponent<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [simulationInfo, setSimulationInfo] = useState<SimulationInfo>();

  useEffect(() => {
    const fetch = async () => {
      const { simulationInfo: storedSimulationInfo } =
        (await chrome.storage.sync.get("simulationInfo")) as {
          simulationInfo: SimulationInfo | undefined;
        };

      if (storedSimulationInfo) {
        setSimulationInfo(storedSimulationInfo);
      }
    };

    fetch();
  }, []);

  useUpdateEffect(() => {
    const saveToBrowser = async () => {
      await chrome.storage.sync.set({
        simulationInfo,
      });
    };

    saveToBrowser();
  }, [simulationInfo]);

  return (
    <SimulationContext.Provider
      value={{
        simulationInfo,
        setSimulationInfo,
      }}
    >
      {children}
    </SimulationContext.Provider>
  );
};

export const useSimulation = () => useContext(SimulationContext);
