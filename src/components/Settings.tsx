import { useState } from "react";
import {
  Flex,
  Spacer,
  Button,
  Center,
  Box,
  Input,
  Heading,
  Stack,
} from "@chakra-ui/react";
import { CloseIcon } from "@chakra-ui/icons";
import useNetwork from "../hooks/useNetwork";

function Settings({ close }: { close: () => void }) {
  const { setNetworkInfo } = useNetwork();

  const [chainName, setChainName] = useState<string>();
  const [chainId, setChainId] = useState<string>();
  const [rpc, setRpc] = useState<string>();

  const addChain = () => {
    if (chainName && chainId && rpc) {
      setNetworkInfo((networkInfo) => {
        return {
          ...networkInfo,
          [parseInt(chainId)]: {
            name: chainName,
            rpcUrl: [rpc],
          },
        };
      });
    }
  };

  return (
    <>
      <Flex>
        <Spacer />
        <Button size="xs" variant="ghost" onClick={() => close()}>
          <CloseIcon />
        </Button>
      </Flex>
      <Center flexDir={"column"}>
        <Box>
          <Heading size="md">Add Chain</Heading>
          <Stack mt="1rem" spacing={2}>
            <Input
              placeholder="Name"
              aria-label="Name"
              autoComplete="off"
              minW="20rem"
              pr="5.2rem"
              size="sm"
              rounded="lg"
              value={chainName}
              onChange={(e) => {
                setChainName(e.target.value);
              }}
            />
            <Input
              placeholder="Chain Id"
              aria-label="Chain Id"
              type="number"
              autoComplete="off"
              minW="20rem"
              pr="5.2rem"
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
              pr="5.2rem"
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
              >
                Add Chain
              </Button>
            </Center>
          </Stack>
        </Box>
      </Center>
    </>
  );
}

export default Settings;
