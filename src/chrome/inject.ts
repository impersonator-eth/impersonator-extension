import { NetworksInfo, SimulationInfo } from "../types";

let store = {
  address: "",
  displayAddress: "",
  chainName: "",
};

const init = async () => {
  const { isEnabled } = (await chrome.storage.sync.get("isEnabled")) as {
    isEnabled: boolean | undefined;
  };
  if (!isEnabled) return;

  // inject inpage.js into webpage
  try {
    let script = document.createElement("script");
    script.setAttribute("type", "text/javascript");
    script.src = chrome.runtime.getURL("/static/js/inpage.js");
    script.onload = async function () {
      // @ts-ignore
      this.remove();

      // initialize web3 provider (window.ethereum)
      const { address } = (await chrome.storage.sync.get("address")) as {
        address: string | undefined;
      };
      const { displayAddress } = (await chrome.storage.sync.get(
        "displayAddress"
      )) as {
        displayAddress: string | undefined;
      };
      let { chainName } = (await chrome.storage.sync.get("chainName")) as {
        chainName: string | undefined;
      };
      const { networksInfo } = (await chrome.storage.sync.get(
        "networksInfo"
      )) as { networksInfo: NetworksInfo | undefined };
      const { simulationInfo } = (await chrome.storage.sync.get(
        "simulationInfo"
      )) as { simulationInfo: SimulationInfo | undefined };

      if (
        networksInfo &&
        chainName &&
        networksInfo[chainName] &&
        address &&
        displayAddress
      ) {
        store = {
          address,
          displayAddress,
          chainName,
        };

        window.postMessage(
          {
            type: "init",
            msg: {
              address,
              chainId: networksInfo[chainName].chainId,
              rpcUrl: networksInfo[chainName].rpcUrl,
              simulationInfo
            },
          },
          "*"
        );
      }
    };
    document.head
      ? document.head.prepend(script)
      : document.documentElement.prepend(script);
  } catch (e) {
    console.log(e);
  }
};

// Receive messages from popup.js and forward it to the injected code (impersonator.ts)
chrome.runtime.onMessage.addListener((msgObj, sender, sendResponse) => {
  if (msgObj.type) {
    switch (msgObj.type) {
      case "setAddress": {
        const address = msgObj.msg.address as string;
        const displayAddress = msgObj.msg.displayAddress as string;

        store.address = address;
        store.displayAddress = displayAddress;
        break;
      }
      case "setChainId": {
        const chainName = msgObj.msg.chainName as string;

        store.chainName = chainName;
        break;
      }
      case "getInfo": {
        sendResponse(store);

        break;
      }
    }
  }

  window.postMessage(msgObj, "*");
});

// Receive messages from injected impersonator.ts code
window.addEventListener("message", async (e) => {
  // only accept messages from us
  if (e.source !== window) {
    return;
  }

  if (!e.data.type) {
    return;
  }

  switch (e.data.type) {
    case "i_switchEthereumChain": {
      const chainId = e.data.msg.chainId as number;
      const { networksInfo } = (await chrome.storage.sync.get(
        "networksInfo"
      )) as { networksInfo: NetworksInfo | undefined };

      if (!networksInfo) {
        break;
      }

      let rpcUrl: string | undefined;
      let chainName: string;
      for (const _chainName of Object.keys(networksInfo)) {
        if (networksInfo[_chainName].chainId === chainId) {
          rpcUrl = networksInfo[_chainName].rpcUrl;
          chainName = _chainName;
          break;
        }
      }

      if (!rpcUrl) {
        break;
      }

      store.chainName = chainName!;
      // send message to switchEthereumChain with RPC, in impersonator.ts
      window.postMessage(
        {
          type: "switchEthereumChain",
          msg: {
            chainId,
            rpcUrl,
          },
        },
        "*"
      );
      break;
    }
  }
});

init();

// to remove isolated modules error
export {};
