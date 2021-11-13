import { MockProvider } from "ethereum-waffle";
import Web3 from "web3";
const web3 = new Web3();

export const zeroAddress = "0x0000000000000000000000000000000000000000";

// grabbed these from Ganache
export const owner = {
  publicKey: "0x67f28D7BC7ba9Ca465ADaCEb0d5e742904C1E2ac",
  privateKey: "074acfd62f04cf71e7a26fcee95c175cbe7db814daf29be2aa0235748fc9374f",
};
export const user = {
  publicKey: "0xc90EC26927337670Ecc5a99E07f966194Aeb124a",
  privateKey: "fda1b48e188e112066f6430f7bfac945938ebb851e5fe890df9ba891e55d45d5",
};

// mock provider with two addresses to match above owner and user
export const provider = new MockProvider({
  ganacheOptions: {
    accounts: [
      {
        balance: "10000000000000000000000",
        secretKey: "0x074acfd62f04cf71e7a26fcee95c175cbe7db814daf29be2aa0235748fc9374f",
      },
      {
        balance: "10000000000000000000000",
        secretKey: "0xfda1b48e188e112066f6430f7bfac945938ebb851e5fe890df9ba891e55d45d5",
      },
    ],
  },
});

// signature, which would be used offline and passed into
export const sign = (privateKey, input) => {
  const message = web3.utils.soliditySha3(...input);
  const signature = web3.eth.accounts.sign(message, privateKey);

  return signature.signature;
};

// used for prepping function calls to contract
export const encode = (functionName, types, inputs) => {
  return web3.eth.abi.encodeFunctionCall(
    {
      name: functionName,
      type: "function",
      inputs: types,
    },
    inputs
  );
};

// shortcut for preparing transaction data
export const prepTransaction = (toAddress, fromAddress, valueInWei, gas, data) => {
  return {
    to: toAddress,
    from: fromAddress,
    value: valueInWei ? web3.utils.toHex(valueInWei) : web3.utils.toHex(0),
    gasLimit: web3.utils.toHex(gas),
    data,
  };
};
