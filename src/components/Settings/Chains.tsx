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

function Chain({
  chainId,
  network,
}: {
  chainId: number;
  network: NetworksInfo[number];
}) {
  return (
    <Box
      p="1rem"
      w="17rem"
      border="1px solid white"
      fontSize="md"
      rounded={"md"}
    >
      <HStack>
        <Text fontWeight="bold">Name: </Text>
        <Text>{network.name}</Text>
      </HStack>
      <HStack>
        <Text fontWeight="bold">ChainId: </Text>
        <Text>{chainId}</Text>
      </HStack>
      <HStack>
        <Text fontWeight="bold">RPC: </Text>
        <Text overflow="hidden" whiteSpace="nowrap" textOverflow="ellipsis">
          {network.rpcUrl.length > 1 ? "Multiple RPCs" : network.rpcUrl[0]}
        </Text>
      </HStack>
    </Box>
  );
}

function Chains({ close }: { close: () => void }) {
  const { networksInfo, chainIds } = useNetworks();

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
            chainIds &&
            chainIds.map((cid, i) => (
              <Chain key={i} chainId={cid} network={networksInfo[cid]} />
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
