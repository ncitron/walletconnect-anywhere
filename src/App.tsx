import React, { FormEvent, useState, useEffect } from "react";
import WalletConnect from "@walletconnect/client";
import { ethers } from "ethers";

const App: React.FC = () => {
  
  const [url, setUrl] = useState<string>();
  const [provider, setProvider] = useState<ethers.providers.JsonRpcProvider>();

  const handleSetupWeb3 = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const p = new ethers.providers.Web3Provider((window as any).ethereum);
    console.log("web3: " + p);
    setProvider(p);
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setupSession();
  }

  const setupSession = async () => {
    const connector = new WalletConnect({ uri: url });

    if (connector.connected) {
      await connector.killSession();
    }
    await connector.createSession();

    connector.on("session_request", async (error, payload) => {
      console.log("EVENT", "session_request");
      if (error) {
        throw error;
      }
      const { peerMeta } = payload.params[0];
      console.log(peerMeta);

      if (!provider) throw("not connected to web3");
      const accounts = await provider.listAccounts();
      connector.approveSession({ chainId: 1, accounts: accounts });
      console.log("approved")
    })

    connector.on("call_request", (error, payload) => {
      console.log("EVENT", "call_request", "method", payload.method);
      console.log("EVENT", "call_request", "params", payload.params);

      if (error) {
        throw error;
      }

      const params = payload.params[0];
      if (payload.method === "eth_sendTransaction") {
        provider?.getSigner().sendTransaction({
          data: params.data,
          from: params.from,
          gasLimit: params.gas,
          gasPrice: params.gasPrice,
          nonce: params.nonce,
          to: params.to,
          value: params.value
        });
      }
    });
  }

  return (
    <div>
      <form onSubmit={handleSetupWeb3}>
        <label>
          Connect to Web3: &nbsp;
          <input type="submit" name="web3_connect"></input>
        </label>
      </form>
      <form onSubmit={handleSubmit}>
        <label>
          Connect to WalletConnect: &nbsp;
          <input type="text" name="wc_url" value={url} onChange={(e) => setUrl(e.target.value)}></input>
          <input type="submit" name="wc_submit"></input>
        </label>
      </form>
    </div>
  );
}



export default App;
