import { useEffect, useState } from "react";
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
import { useSimulation } from "@/contexts/SimulationContext";
import { useNetworks } from "@/contexts/NetworksContext";

function EditSimulation({ back }: { back: () => void }) {
  const { simulationInfo, setSimulationInfo } = useSimulation();
  const { setReloadRequired } = useNetworks();

  const [accountSlug, setAccountSlug] = useState<string>("");
  const [projectSlug, setProjectSlug] = useState<string>("");
  const [accessKey, setAccessKey] = useState<string>("");
  const [isBtnLoading, setIsBtnLoading] = useState(false);

  const saveSettings = () => {
    setIsBtnLoading(true);

    setReloadRequired(true);
    setSimulationInfo(simulationInfo => {
      return {
        ...simulationInfo,
        accountSlug,
        projectSlug,
        accessKey,
      };
    });
    back();

    setIsBtnLoading(false);
  };

  const deleteSettings = () => {
    setReloadRequired(true);
    setSimulationInfo(undefined);
    back();
  }

  useEffect(() => {
    if (simulationInfo) {
      setProjectSlug(simulationInfo.projectSlug);
      setAccountSlug(simulationInfo.accountSlug);
      setAccessKey(simulationInfo.accessKey);
    }
  }, [simulationInfo]);

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
      <Box paddingBottom="0.5rem">
        <Heading size="md">Simulation Settings</Heading>
        <Stack mt="1rem" spacing={2}>
          <Input
            placeholder="Account Slug"
            aria-label="Account Slug"
            autoComplete="off"
            minW="20rem"
            size="sm"
            rounded="lg"
            value={accountSlug}
            onChange={(e) => {
              setAccountSlug(e.target.value);
            }}
            isInvalid={!accountSlug}
          />
          <Input
            placeholder="Project Slug"
            aria-label="Project Slug"
            autoComplete="off"
            minW="20rem"
            size="sm"
            rounded="lg"
            value={projectSlug}
            onChange={(e) => {
              setProjectSlug(e.target.value);
            }}
            isInvalid={!projectSlug}
          />
          <Input
            placeholder="Access Key"
            aria-label="Access Key"
            autoComplete="off"
            minW="20rem"
            size="sm"
            rounded="lg"
            value={accessKey}
            onChange={(e) => {
              setAccessKey(e.target.value);
            }}
            isInvalid={!accessKey}
          />
                    <Center>
            <HStack spacing="3">
              <Button
                size="sm"
                maxW="6rem"
                colorScheme="blue"
                onClick={() => saveSettings()}
                isLoading={isBtnLoading}
                disabled={
                  !accountSlug || !projectSlug || !accessKey || isBtnLoading
                }
              >
                Save
              </Button>
              <Button
                size="sm"
                maxW="6rem"
                colorScheme="red"
                onClick={() => deleteSettings()}
              >
                Delete
              </Button>
            </HStack>
          </Center>
        </Stack>
      </Box>
    </>
  );
}

export default EditSimulation;
