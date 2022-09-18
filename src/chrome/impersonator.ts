import { EventEmitter } from "events";
import { Provider, StaticJsonRpcProvider } from "@ethersproject/providers";
import { hexValue } from "@ethersproject/bytes";
import { Logger } from "@ethersproject/logger";

const logger = new Logger("ethers/5.7.0");

type Window = Record<string, any>;

const DEFAULT_ADDRESS = "0x0000000000000000000000000000000000000000";

class ImpersonatorProvider extends EventEmitter {
  isImpersonator = true;
  isMetaMask = true;

  private address: string;
  private provider: Provider;
  private chainId: number;

  constructor(chainId: number, rpcUrl: string, address: string) {
    super();

    this.provider = new StaticJsonRpcProvider(rpcUrl);
    this.chainId = chainId;
    this.address = address;
  }

  setAddress = (address: string) => {
    this.address = address;
    this.emit("accountsChanged", [address]);
  };

  setChainId = (chainId: number, rpcUrl: string) => {
    this.chainId = chainId;
    this.provider = new StaticJsonRpcProvider(rpcUrl);
    this.emit("chainChanged", chainId.toString(16));
  };

  request(request: { method: string; params?: Array<any> }): Promise<any> {
    return this.send(request.method, request.params || []);
  }

  async send(method: string, params?: Array<any>): Promise<any> {
    console.log({ method, params });
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
      case "wallet_addEthereumChain":
      case "wallet_switchEthereumChain": {
        // @ts-ignore
        const chainId = Number(params[0].chainId as string);
        // send message to content_script (inject.ts) to fetch corresponding RPC
        window.postMessage(
          {
            type: "i_setChainId",
            msg: {
              chainId,
            },
          },
          "*"
        );
        return null;
      }
      case "eth_sign": {
        return throwUnsupported("eth_sign not supported");
      }
      case "personal_sign": {
        return throwUnsupported("personal_sign not supported");
      }
      case "eth_sendTransaction": {
        return throwUnsupported("eth_sendTransaction not supported");
      }
      // unchanged from Eip1193Bridge
      case "eth_gasPrice": {
        const result = await this.provider.getGasPrice();
        return result.toHexString();
      }
      case "eth_blockNumber": {
        return await this.provider.getBlockNumber();
      }
      case "eth_chainId": {
        const result = await this.provider.getNetwork();
        return hexValue(result.chainId);
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

    // If our provider supports send, maybe it can do a better job?
    if ((this as any).provider.send) {
      const result = await (this as any).provider.send(method, params);
      return coerce(result);
    }

    return throwUnsupported(`unsupported method: ${method}`);
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
      try {
        const impersonatedProvider = new ImpersonatorProvider(
          chainId,
          rpcUrl,
          address
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
