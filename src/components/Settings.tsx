import { useState, useEffect } from "react";
import { Flex, Spacer, Button } from "@chakra-ui/react";
import { CloseIcon } from "@chakra-ui/icons";

function Settings({ close }: { close: () => void }) {
  return (
    <>
      <Flex>
        <Spacer />
        <Button size="xs" variant="ghost" onClick={() => close()}>
          <CloseIcon />
        </Button>
      </Flex>
    </>
  );
}

export default Settings;
