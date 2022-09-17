import { useState } from "react";
import {
  Button,
  Center,
  Box,
  Input,
  Heading,
  Stack,
  Flex,
  Spacer,
  HStack,
  Text,
} from "@chakra-ui/react";
import { ChevronLeftIcon } from "@chakra-ui/icons";
import { useNetworks } from "@/contexts/NetworksContext";

function AddChain({ back }: { back: () => void }) {
  const { networksInfo, setNetworksInfo } = useNetworks();

  const [chainName, setChainName] = useState<string>();
  const [chainId, setChainId] = useState<string>();
  const [rpc, setRpc] = useState<string>();
  const [isAdding, setIsAdding] = useState(false);
  const [isChainNameNotUnique, setIsChainNameNotUnique] = useState(false);

  const addChain = () => {
    setIsAdding(true);

    if (chainName && chainId && rpc && networksInfo) {
      if (networksInfo[chainName]) {
        setIsChainNameNotUnique(true);
      } else {
        setNetworksInfo((_networksInfo) => {
          back();
          return {
            ..._networksInfo,
            [chainName]: {
              chainId: parseInt(chainId),
              rpcUrl: rpc,
            },
          };
        });
      }
    }

    setIsAdding(false);
  };

  return (
    <>
      <Flex>
        <Spacer />
        <Button size="sm" variant="ghost" onClick={() => back()}>
          <HStack>
            <ChevronLeftIcon fontSize="2xl" /> <Text>Back</Text>
          </HStack>
        </Button>
      </Flex>
      <Box>
        <Heading size="md">Add Chain</Heading>
        <Stack mt="1rem" spacing={2}>
          <Input
            placeholder="Name"
            aria-label="Name"
            autoComplete="off"
            minW="20rem"
            size="sm"
            rounded="lg"
            value={chainName}
            onChange={(e) => {
              setChainName(e.target.value);
              if (isChainNameNotUnique) {
                setIsChainNameNotUnique(false); // remove invalid warning when user types again
              }
            }}
            isInvalid={isChainNameNotUnique}
          />
          <Input
            placeholder="Chain Id"
            aria-label="Chain Id"
            type="number"
            autoComplete="off"
            minW="20rem"
            size="sm"
            rounded="lg"
            value={chainId}
            onChange={(e) => {
              setChainId(e.target.value);
            }}
          />
          <Input
            placeholder="RPC Url"
            aria-label="RPC Url"
            autoComplete="off"
            minW="20rem"
            size="sm"
            rounded="lg"
            value={rpc}
            onChange={(e) => {
              setRpc(e.target.value);
            }}
          />
          <Center>
            <Button
              size="sm"
              maxW="6rem"
              colorScheme="blue"
              onClick={() => addChain()}
              isLoading={isAdding}
            >
              Add Chain
            </Button>
          </Center>
        </Stack>
      </Box>
    </>
  );
}

export default AddChain;
