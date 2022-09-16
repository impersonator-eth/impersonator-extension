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
} from "@chakra-ui/react";
import networkInfo from "./networkInfo";

function App() {
  const [isEnabled, setIsEnabled] = useState(true);
  const [address, setAddress] = useState<string>();
  const [networkIndex, setNetworkIndex] = useState(0);

  const getNetworkIndex = (chainId: number) => {
    let _networkIndex = 0;

    for (var i = 0; i < networkInfo.length; i++) {
      if (networkInfo[i].chainId === chainId) {
        _networkIndex = i;
        break;
      }
    }

    return _networkIndex;
  };

  const currentTab = async () => {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    return tab;
  };

  const updateAddress = async () => {
    const tab = await currentTab();

    // send msg to content_script (inject.js)
    chrome.tabs.sendMessage(tab.id!, {
      type: "setAddress",
      msg: { address },
    });

    // save to browser storage
    await chrome.storage.sync.set({
      address,
    });
  };

  useEffect(() => {
    const init = async () => {
      const {
        address: storedAddress,
        chainId: storedChainId,
        isEnabled: storedIsEnabled,
      } = (await chrome.storage.sync.get([
        "address",
        "chainId",
        "isEnabled",
      ])) as {
        address: string | undefined;
        chainId: number | undefined;
        isEnabled: boolean | undefined;
      };

      const _address =
        storedAddress && storedAddress.length > 0
          ? storedAddress
          : "0x0000000000000000000000000000000000000000";

      setAddress(_address);
      if (storedChainId) {
        setNetworkIndex(getNetworkIndex(storedChainId));
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
        const chainId = networkInfo[networkIndex].chainId;

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
  }, [networkIndex]);

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
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
              <InputRightElement w="4.5rem" mr="0.5rem">
                <Button size="sm" h="1.5rem" onClick={() => updateAddress()}>
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
            value={networkIndex}
            onChange={(e) => {
              setNetworkIndex(parseInt(e.target.value));
            }}
          >
            {networkInfo.map((network, i) => (
              <option value={i} key={i}>
                {network.name}
              </option>
            ))}
          </Select>
        </Center>
      </Container>
    </>
  );
}

export default App;
