import { NetworksInfo } from "../types";

const init = async () => {
  const { isEnabled } = (await chrome.storage.sync.get("isEnabled")) as {
    isEnabled: boolean | undefined;
  };
  if (!isEnabled) return;

  // inject impersonator.js into webpage
  try {
    let script = document.createElement("script");
    script.setAttribute("type", "text/javascript");
    script.src = chrome.runtime.getURL("/static/js/impersonator.js");
    script.onload = async function () {
      // @ts-ignore
      this.remove();

      // initialize web3 provider (window.ethereum)
      const { address } = (await chrome.storage.sync.get("address")) as {
        address: string | undefined;
      };
      let { chainName } = (await chrome.storage.sync.get("chainName")) as {
        chainName: string | undefined;
      };
      const { networksInfo } = (await chrome.storage.sync.get(
        "networksInfo"
      )) as { networksInfo: NetworksInfo | undefined };

      if (networksInfo && chainName && networksInfo[chainName]) {
        window.postMessage(
          {
            type: "init",
            msg: {
              address,
              chainId: networksInfo[chainName].chainId,
              rpcUrl: networksInfo[chainName].rpcUrl,
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
chrome.runtime.onMessage.addListener((msgObj) => {
  window.postMessage(msgObj, "*");
});

// Receive messages from inject impersonator.ts code
window.addEventListener("message", async (e) => {
  // only accept messages from us
  if (e.source !== window) {
    return;
  }

  if (!e.data.type) {
    return;
  }

  switch (e.data.type) {
    case "setChainId": {
      const chainId = e.data.msg.chainId;
      const { networksInfo } = (await chrome.storage.sync.get(
        "networksInfo"
      )) as { networksInfo: NetworksInfo | undefined };

      if (!networksInfo) {
        break;
      }

      let rpcUrl: string | undefined;
      for (const chainName of Object.keys(networksInfo)) {
        if (networksInfo[chainName].chainId === chainId) {
          rpcUrl = networksInfo[chainName].rpcUrl;
          break;
        }
      }

      if (!rpcUrl) {
        break;
      }
      // send message to setChainId with RPC
      window.postMessage(
        {
          type: "setChainId",
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
