import { useState, useEffect } from "react";
import {
  useUpdateEffect,
  Flex,
  Heading,
  Spacer,
  Container,
  Switch,
  Text,
  HStack,
  Center,
  Image,
  InputGroup,
  Input,
  InputRightElement,
  Box,
  Button,
  Select,
  Spinner,
} from "@chakra-ui/react";
import { networkInfo, chainIds } from "./networkInfo";
import { StaticJsonRpcProvider } from "@ethersproject/providers";
import { isAddress } from "@ethersproject/address";

function App() {
  const [isEnabled, setIsEnabled] = useState(true);
  const [displayAddress, setDisplayAddress] = useState<string>("");
  const [address, setAddress] = useState<string>();
  const [isAddressValid, setIsAddressValid] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [chainId, setChainId] = useState(chainIds[0]);

  const currentTab = async () => {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    return tab;
  };

  const updateAddress = async () => {
    setIsUpdating(true);
    const tab = await currentTab();

    let isValid = false;
    let _address = address;
    if (address) {
      // Resolve ENS
      const mainnetProvider = new StaticJsonRpcProvider(
        networkInfo[1].rpcUrl[0]
      );
      const resolvedAddress = await mainnetProvider.resolveName(address);
      if (resolvedAddress) {
        setAddress(resolvedAddress);
        _address = resolvedAddress;
        isValid = true;
      } else if (isAddress(address)) {
        isValid = true;
      }
    }
    setIsAddressValid(isValid);

    if (isValid) {
      // send msg to content_script (inject.js)
      chrome.tabs.sendMessage(tab.id!, {
        type: "setAddress",
        msg: { address: _address },
      });

      // save to browser storage
      await chrome.storage.sync.set({
        address: _address,
      });
      await chrome.storage.sync.set({
        displayAddress,
      });
    }

    setIsUpdating(false);
  };

  useEffect(() => {
    const init = async () => {
      const {
        displayAddress: storedDisplayAddress,
        address: storedAddress,
        chainId: storedChainId,
        isEnabled: storedIsEnabled,
      } = (await chrome.storage.sync.get([
        "displayAddress",
        "address",
        "chainId",
        "isEnabled",
      ])) as {
        displayAddress: string | undefined;
        address: string | undefined;
        chainId: number | undefined;
        isEnabled: boolean | undefined;
      };

      if (storedDisplayAddress) {
        setDisplayAddress(storedDisplayAddress);
      }

      const _address =
        storedAddress && storedAddress.length > 0
          ? storedAddress
          : "0x0000000000000000000000000000000000000000";

      setAddress(_address);
      if (storedChainId) {
        setChainId(storedChainId);
      }
      setIsEnabled(storedIsEnabled ?? true);
    };

    if (chrome.storage) {
      init();
    }
  }, []);

  useUpdateEffect(() => {
    if (chrome.storage) {
      chrome.storage.sync.set({
        isEnabled,
      });
    }
  }, [isEnabled]);

  useUpdateEffect(() => {
    const updateChainId = async () => {
      if (chrome.tabs) {
        const tab = await currentTab();

        // send msg to content_script (inject.js)
        chrome.tabs.sendMessage(tab.id!, {
          type: "setChainId",
          msg: { chainId },
        });

        // save to browser storage
        await chrome.storage.sync.set({
          chainId,
        });
      }
    };

    updateChainId();
  }, [chainId]);

  return (
    <>
      <Flex
        py="4"
        px={["2", "4", "10", "10"]}
        borderBottom="2px"
        borderBottomColor="gray.400"
      >
        <Spacer flex="1" />
        <Heading maxW={["302px", "4xl", "4xl", "4xl"]}>
          <HStack spacing={4}>
            <Image src="impersonatorLogo.png" w="2.2rem" />
            <Text>Impersonator</Text>
          </HStack>
        </Heading>
        <Spacer flex="1" />
      </Flex>
      <Container alignItems={"center"}>
        <Center flexDir={"column"}>
          <HStack mt="0.2rem" spacing={5}>
            <Text fontSize="md">Enabled</Text>
            <Switch
              size="sm"
              isChecked={isEnabled}
              onChange={() => setIsEnabled((_isEnabled) => !_isEnabled)}
            />
          </HStack>
          <Box mt="1.5rem">
            <InputGroup>
              <Input
                placeholder="address / ens"
                aria-label="address"
                autoComplete="off"
                minW="20rem"
                pr="5.2rem"
                rounded="lg"
                value={displayAddress}
                onChange={(e) => {
                  const _displayAddress = e.target.value;
                  setDisplayAddress(_displayAddress);
                  setAddress(_displayAddress);
                  setIsAddressValid(true); // remove invalid warning when user types again
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") updateAddress();
                }}
                isInvalid={!isAddressValid}
              />
              <InputRightElement w="4.5rem" mr="0.5rem">
                <Button
                  size="sm"
                  h="1.5rem"
                  onClick={() => updateAddress()}
                  isLoading={isUpdating}
                >
                  Update
                </Button>
              </InputRightElement>
            </InputGroup>
          </Box>
          <Select
            mt="0.5rem"
            px="0.2rem"
            variant="filled"
            rounded="lg"
            _hover={{ cursor: "pointer" }}
            value={chainId}
            onChange={(e) => {
              setChainId(parseInt(e.target.value));
            }}
          >
            {chainIds.map((cid, i) => (
              <option value={cid} key={i}>
                {networkInfo[cid].name}
              </option>
            ))}
          </Select>
        </Center>
      </Container>
    </>
  );
}

export default App;
