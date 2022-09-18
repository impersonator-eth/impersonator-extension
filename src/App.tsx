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
import { SettingsIcon } from "@chakra-ui/icons";
import { StaticJsonRpcProvider } from "@ethersproject/providers";
import { isAddress } from "@ethersproject/address";
import Settings from "@/components/Settings";
import { useNetworks } from "@/contexts/NetworksContext";

function App() {
  const { networksInfo } = useNetworks();

  const [isEnabled, setIsEnabled] = useState(true);
  const [displayAddress, setDisplayAddress] = useState<string>("");
  const [address, setAddress] = useState<string>();
  const [isAddressValid, setIsAddressValid] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [chainName, setChainName] = useState<string>();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
    if (address && networksInfo) {
      // get mainnet rpc (if exists)
      let mainnetRPC: string | undefined;
      for (const chainName of Object.keys(networksInfo)) {
        if (networksInfo[chainName].chainId === 1) {
          mainnetRPC = networksInfo[chainName].rpcUrl;
          break;
        }
      }

      if (!mainnetRPC) {
        // fallback public rpc
        mainnetRPC = "https://rpc.ankr.com/eth";
      }

      // Resolve ENS
      const mainnetProvider = new StaticJsonRpcProvider(mainnetRPC);
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
      // send msg to content_script (inject.ts)
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
        chainName: storedChainName,
        isEnabled: storedIsEnabled,
      } = (await chrome.storage.sync.get([
        "displayAddress",
        "address",
        "chainName",
        "isEnabled",
      ])) as {
        displayAddress: string | undefined;
        address: string | undefined;
        chainName: string | undefined;
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
      if (storedChainName) {
        setChainName(storedChainName);
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
      if (chrome.tabs && networksInfo && chainName) {
        const tab = await currentTab();
        const chainId = networksInfo[chainName].chainId;

        // send msg to content_script (inject.ts)
        chrome.tabs.sendMessage(tab.id!, {
          type: "setChainId",
          msg: { chainId, rpcUrl: networksInfo[chainName].rpcUrl },
        });

        // save to browser storage
        await chrome.storage.sync.set({
          chainName,
        });
      }
    };

    updateChainId();
  }, [chainName, networksInfo]);

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
      <Container mt="0.4rem" alignItems={"center"}>
        {!isSettingsOpen ? (
          <>
            <Flex>
              <HStack spacing={5}>
                <Text fontSize="md">Enabled</Text>
                <Switch
                  size="sm"
                  isChecked={isEnabled}
                  onChange={() => setIsEnabled((_isEnabled) => !_isEnabled)}
                />
              </HStack>
              <Spacer />
              <Button
                size="sm"
                onClick={() =>
                  setIsSettingsOpen((_isSettingsOpen) => !_isSettingsOpen)
                }
              >
                <SettingsIcon
                  transition="900ms rotate ease-in-out"
                  transform={isSettingsOpen ? "rotate(33deg)" : "rotate(0deg)"}
                />
              </Button>
            </Flex>
            <Center flexDir={"column"}>
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
                      if (isAddressValid) {
                        setIsAddressValid(true); // remove invalid warning when user types again
                      }
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
                mt="1rem"
                px="0.2rem"
                variant="filled"
                rounded="lg"
                _hover={{ cursor: "pointer" }}
                placeholder="Select Network"
                value={chainName}
                onChange={(e) => {
                  setChainName(e.target.value);
                }}
              >
                {networksInfo &&
                  Object.keys(networksInfo).map((chainName, i) => (
                    <option value={chainName} key={i}>
                      {chainName}
                    </option>
                  ))}
              </Select>
            </Center>
          </>
        ) : (
          <Settings close={() => setIsSettingsOpen(false)} />
        )}
      </Container>
    </>
  );
}

export default App;
