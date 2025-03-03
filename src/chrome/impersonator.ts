import { EventEmitter } from "events";
import { StaticJsonRpcProvider } from "@ethersproject/providers";
import { hexValue } from "@ethersproject/bytes";
import { Logger } from "@ethersproject/logger";
import { SimulationInfo } from "@/types";

const logger = new Logger("ethers/5.7.0");

type Window = Record<string, any>;

class ImpersonatorProvider extends EventEmitter {
  isImpersonator = true;
  isMetaMask = true;

  private address: string;
  private provider: StaticJsonRpcProvider;
  private chainId: number;
  private simulationInfo?: SimulationInfo;

  constructor(chainId: number, rpcUrl: string, address: string, simulationInfo?: SimulationInfo) {
    super();

    this.provider = new StaticJsonRpcProvider(rpcUrl);
    this.chainId = chainId;
    this.address = address;
    this.simulationInfo = simulationInfo;
  }

  getSimulationEndpoint = () => {
    if (!this.simulationInfo) {
      throw new Error("Simulation info not found");
    }

    return `https://api.tenderly.co/api/v1/account/${this.simulationInfo.accountSlug}/project/${this.simulationInfo.projectSlug}/simulate`;
  }

  getSimulationTxLink = (id: string) => {
    if (!this.simulationInfo) {
      throw new Error("Simulation info not found");
    }

    return `https://dashboard.tenderly.co/${this.simulationInfo.accountSlug}/${this.simulationInfo.projectSlug}/simulator/${id}`;
  }

  setAddress = (address: string) => {
    this.address = address;
    this.emit("accountsChanged", [address]);
  };

  setChainId = (chainId: number, rpcUrl: string) => {
    this.provider = new StaticJsonRpcProvider(rpcUrl);

    if (this.chainId !== chainId) {
      this.chainId = chainId;
      this.emit("chainChanged", hexValue(chainId));
    }
  };

  request(request: { method: string; params?: Array<any> }): Promise<any> {
    return this.send(request.method, request.params || []);
  }

  async send(method: string, params?: Array<any>): Promise<any> {
    const throwUnsupported = (message: string): never => {
      return logger.throwError(message, Logger.errors.UNSUPPORTED_OPERATION, {
        method: method,
        params: params,
      });
    };

    let coerce = (value: any) => value;

    switch (method) {
      // modified methods
      case "eth_requestAccounts":
      case "eth_accounts":
        return [this.address];

      case "net_version": {
        return this.chainId;
      }
      case "eth_chainId": {
        return hexValue(this.chainId);
      }
      case "wallet_addEthereumChain":
      case "wallet_switchEthereumChain": {
        // @ts-ignore
        const chainId = Number(params[0].chainId as string);

        const setChainIdPromise = new Promise((resolve) => {
          // send message to content_script (inject.ts) to fetch corresponding RPC
          window.postMessage(
            {
              type: "i_switchEthereumChain",
              msg: {
                chainId,
              },
            },
            "*"
          );

          // receive from content_script (inject.ts)
          const controller = new AbortController();
          window.addEventListener(
            "message",
            (e: any) => {
              // only accept messages from us
              if (e.source !== window) {
                return;
              }

              if (!e.data.type) {
                return;
              }

              switch (e.data.type) {
                case "switchEthereumChain": {
                  const chainId = e.data.msg.chainId as number;
                  const rpcUrl = e.data.msg.rpcUrl as string;
                  (
                    (window as Window).ethereum as ImpersonatorProvider
                  ).setChainId(chainId, rpcUrl);
                  // remove this listener as we already have a listener for "message" and don't want duplicates
                  controller.abort();

                  resolve(null);
                  break;
                }
              }
            },
            { signal: controller.signal } as AddEventListenerOptions
          );
        });

        await setChainIdPromise;
        return null;
      }
      case "eth_sign": {
        return throwUnsupported("eth_sign not supported");
      }
      case "personal_sign": {
        return throwUnsupported("personal_sign not supported");
      }
      case "eth_sendTransaction": {
        if (this.simulationInfo) {
          const txParams = (params ?? [{}])[0];
          const tx = {
            from: txParams.from ?? this.address,
            to: txParams.to,
            input: txParams.data ?? "0x",
            gas: txParams.gas ? parseInt(txParams.gas, 16) : 8_000_000,
            gas_price: "0",
            value: txParams.value ? parseInt(txParams.value, 16).toString() : "0",
            network_id: this.chainId.toString(),
            save: true,
            save_if_fails: true
          }

          const result = await fetch(this.getSimulationEndpoint(), {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Access-Key": this.simulationInfo.accessKey,
            },
            body: JSON.stringify(tx),
          });
          const json = await result.json();
          const id = json.simulation.id;
          // const txHash = json.transaction.hash;

          const link = this.getSimulationTxLink(id);
          window.open(link, "_blank");

          // return txHash;
          // Could return txHash, but most dApps will just end up cycling eth_getTransactionHash. Its not useful to return it.
        }
        break;
      }
      // unchanged from Eip1193Bridge
      case "eth_gasPrice": {
        const result = await this.provider.getGasPrice();
        return result.toHexString();
      }
      case "eth_blockNumber": {
        return await this.provider.getBlockNumber();
      }
      case "eth_getBalance": {
        // @ts-ignore
        const result = await this.provider.getBalance(params[0], params[1]);
        return result.toHexString();
      }
      case "eth_getStorageAt": {
        // @ts-ignore
        return this.provider.getStorageAt(params[0], params[1], params[2]);
      }
      case "eth_getTransactionCount": {
        const result = await this.provider.getTransactionCount(
          // @ts-ignore
          params[0],
          // @ts-ignore
          params[1]
        );
        return hexValue(result);
      }
      case "eth_getBlockTransactionCountByHash":
      case "eth_getBlockTransactionCountByNumber": {
        // @ts-ignore
        const result = await this.provider.getBlock(params[0]);
        return hexValue(result.transactions.length);
      }
      case "eth_getCode": {
        // @ts-ignore
        const result = await this.provider.getCode(params[0], params[1]);
        return result;
      }
      case "eth_sendRawTransaction": {
        // @ts-ignore
        return await this.provider.sendTransaction(params[0]);
      }
      case "eth_call": {
        // @ts-ignore
        return await this.provider.call(params[0], params[1]);
      }
      case "estimateGas": {
        // @ts-ignore
        if (params[1] && params[1] !== "latest") {
          throwUnsupported("estimateGas does not support blockTag");
        }
        // @ts-ignore
        const result = await this.provider.estimateGas(params[0]);
        return result.toHexString();
      }
      case "eth_getBlockByHash":
      case "eth_getBlockByNumber": {
        // @ts-ignore
        if (params[1]) {
          // @ts-ignore
          return await this.provider.getBlockWithTransactions(params[0]);
        } else {
          // @ts-ignore
          return await this.provider.getBlock(params[0]);
        }
      }
      case "eth_getTransactionByHash": {
        // @ts-ignore
        return await this.provider.getTransaction(params[0]);
      }
      case "eth_getTransactionReceipt": {
        // @ts-ignore
        return await this.provider.getTransactionReceipt(params[0]);
      }
      case "eth_getUncleCountByBlockHash":
      case "eth_getUncleCountByBlockNumber": {
        coerce = hexValue;
        break;
      }

      case "eth_getTransactionByBlockHashAndIndex":
      case "eth_getTransactionByBlockNumberAndIndex":
      case "eth_getUncleByBlockHashAndIndex":
      case "eth_getUncleByBlockNumberAndIndex":
      case "eth_newFilter":
      case "eth_newBlockFilter":
      case "eth_newPendingTransactionFilter":
      case "eth_uninstallFilter":
      case "eth_getFilterChanges":
      case "eth_getFilterLogs":
      case "eth_getLogs":
        break;
    }

    // @ts-ignore
    const result = await this.provider.send(method, params);
    return coerce(result);
  }
}

// receive from content_script (inject.ts)
window.addEventListener("message", (e: any) => {
  // only accept messages from us
  if (e.source !== window) {
    return;
  }

  if (!e.data.type) {
    return;
  }

  switch (e.data.type) {
    case "init": {
      const address = e.data.msg.address as string;
      const chainId = e.data.msg.chainId as number;
      const rpcUrl = e.data.msg.rpcUrl as string;

      const simulationInfo = e.data.msg.simulationInfo as SimulationInfo | undefined;

      try {
        const impersonatedProvider = new ImpersonatorProvider(
          chainId,
          rpcUrl,
          address,
          simulationInfo
        );

        (window as Window).ethereum = impersonatedProvider;
      } catch (e) {
        console.error("Impersonator Error:", e);
      }

      break;
    }
    case "setAddress": {
      const address = e.data.msg.address as string;
      ((window as Window).ethereum as ImpersonatorProvider).setAddress(address);
      break;
    }
    case "setChainId": {
      const chainId = e.data.msg.chainId as number;
      const rpcUrl = e.data.msg.rpcUrl as string;
      ((window as Window).ethereum as ImpersonatorProvider).setChainId(
        chainId,
        rpcUrl
      );
      break;
    }
  }
});
