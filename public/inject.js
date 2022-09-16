const init = async () => {
  const { isEnabled } = await chrome.storage.sync.get("isEnabled");
  if (!isEnabled) return;

  // inject impersonator.js into webpage
  try {
    let script = document.createElement("script");
    script.setAttribute("type", "text/javascript");
    script.src = chrome.runtime.getURL("/static/js/impersonator.js");
    script.onload = async function () {
      this.remove();

      // initialize web3 provider (window.ethereum)
      const { address } = await chrome.storage.sync.get("address");
      const { chainId } = await chrome.storage.sync.get("chainId");
      window.postMessage(
        {
          type: "init",
          msg: {
            address,
            chainId: chainId ?? 1,
          },
        },
        "*"
      );
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

init();
