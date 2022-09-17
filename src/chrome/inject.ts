import { NetworkInfo } from "../types";

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
      let { chainId } = (await chrome.storage.sync.get("chainId")) as {
        chainId: number | undefined;
      };
      const { networkInfo } = (await chrome.storage.sync.get(
        "networkInfo"
      )) as { networkInfo: NetworkInfo | undefined };

      chainId = chainId ?? 1;
      if (networkInfo && networkInfo[chainId]) {
        window.postMessage(
          {
            type: "init",
            msg: {
              address,
              chainId,
              rpcUrl: networkInfo[chainId].rpcUrl[0],
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
      const { networkInfo } = await chrome.storage.sync.get("networkInfo");
      const rpcUrl = networkInfo[chainId].rpcUrl[0];

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
