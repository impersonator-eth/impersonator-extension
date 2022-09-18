import React, { useState } from "react";
import {
  Box,
  Button,
  Center,
  Flex,
  HStack,
  Spacer,
  Stack,
  Text,
} from "@chakra-ui/react";
import { CloseIcon } from "@chakra-ui/icons";
import { useNetworks } from "@/contexts/NetworksContext";
import { NetworksInfo } from "@/types";
import AddChain from "./AddChain";
import EditChain from "./EditChain";

function Chain({
  chainName,
  network,
  openEditChain,
}: {
  chainName: string;
  network: NetworksInfo[string];
  openEditChain: () => void;
}) {
  return (
    <Box
      p="1rem"
      w="17rem"
      border="1px solid white"
      fontSize="md"
      rounded={"md"}
      onClick={() => openEditChain()}
      _hover={{ cursor: "pointer" }}
    >
      <HStack>
        <Text fontWeight="bold">Name: </Text>
        <Text>{chainName}</Text>
      </HStack>
      <HStack>
        <Text fontWeight="bold">ChainId: </Text>
        <Text>{network.chainId}</Text>
      </HStack>
      <HStack>
        <Text fontWeight="bold">RPC: </Text>
        <Text overflow="hidden" whiteSpace="nowrap" textOverflow="ellipsis">
          {network.rpcUrl}
        </Text>
      </HStack>
    </Box>
  );
}

function Chains({ close }: { close: () => void }) {
  const { networksInfo } = useNetworks();

  const [tab, setTab] = useState<React.ReactElement>();

  return tab !== undefined ? (
    tab
  ) : (
    <>
      <Flex>
        <Spacer />
        <Button size="xs" variant="ghost" onClick={() => close()}>
          <CloseIcon />
        </Button>
      </Flex>
      <Center flexDir={"column"}>
        <Stack mt="1rem" pb="2rem" spacing={4}>
          {networksInfo &&
            Object.keys(networksInfo).map((chainName, i) => (
              <Chain
                key={i}
                chainName={chainName}
                network={networksInfo[chainName]}
                openEditChain={() =>
                  setTab(
                    <EditChain
                      back={() => setTab(undefined)}
                      chainName={chainName}
                    />
                  )
                }
              />
            ))}
          <Button
            onClick={() => setTab(<AddChain back={() => setTab(undefined)} />)}
          >
            Add Chain
          </Button>
        </Stack>
      </Center>
    </>
  );
}

export default Chains;
