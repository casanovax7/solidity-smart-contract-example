import "@babel/polyfill";
import { use, expect } from "chai";
import { solidity } from "ethereum-waffle";
import { deployContract } from "ethereum-waffle";
import CabinetOfCuriosities from "../build/CabinetOfCuriosities.json";
import { sign, encode, prepTransaction, provider, owner, user, zeroAddress } from "./helpers";

// setup chai for solidity
use(solidity);

describe("Cabinet of Curiosities", () => {
  const [walletCreator, walletConsumer] = provider.getWallets();
  let cabinet;
  beforeEach(async () => {
    cabinet = await deployContract(walletCreator, CabinetOfCuriosities);
  });

  it("Owner is deployer", async () => {
    const contractOwner = await cabinet.owner();
    expect(contractOwner).to.equal(walletCreator.address);
    expect(contractOwner).to.not.equal(walletConsumer.address);
    expect("owner").to.be.calledOnContract(cabinet);
  });

  it("Cabinet main collection can be set only by owner", async () => {
    // call contract method with contract deployer/owner
    await cabinet.setExternalAccount(zeroAddress);
    expect("setExternalAccount").to.be.calledOnContract(cabinet);

    // call contract method from walletConsumer address
    await expect(
      cabinet.connect(walletConsumer).setExternalAccount(zeroAddress)
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });
});

describe("Cabinet Shop", () => {
  const [walletCreator, walletConsumer] = provider.getWallets();
  let cabinet;
  beforeEach(async () => {
    cabinet = await deployContract(walletCreator, CabinetOfCuriosities);
  });

  it("Users can shop at the appropriate time", async () => {
    // some variables for shop
    const group = "group1";
    const itemId = 4; //poster
    const itemQty = 1;
    const itemPrice = 180000000000000000;

    // create a signature for walletConsumer
    const signature = sign(owner.privateKey, [
      {
        type: "string",
        value: "SHOP",
      },
      {
        type: "string",
        value: group,
      },
      {
        type: "uint",
        value: itemId,
      },
      {
        type: "uint",
        value: itemQty,
      },
      {
        type: "address",
        value: user.publicKey,
      },
    ]);

    const transactionData = prepTransaction(
      cabinet.address,
      walletConsumer.address,
      itemPrice,
      200000,
      encode(
        "shop",
        [
          {
            type: "uint256",
            name: "_id",
          },
          {
            type: "uint256",
            name: "_qty",
          },
          {
            type: "bytes",
            name: "_signature",
          },
        ],
        [itemId, itemQty, signature]
      )
    );

    // send with correct signature, but group is not set correctly on contract
    await expect(walletConsumer.sendTransaction(transactionData)).to.be.revertedWith("invsig");

    // set the group
    await cabinet.setGroup(group);

    // shop as walletConsumer - should succeed
    await walletConsumer.sendTransaction(transactionData);

    const invalidTransactionData = prepTransaction(
      cabinet.address,
      walletConsumer.address,
      itemPrice,
      200000,
      encode(
        "shop",
        [
          {
            type: "uint256",
            name: "_id",
          },
          {
            type: "uint256",
            name: "_qty",
          },
          {
            type: "bytes",
            name: "_signature",
          },
        ],
        [
          itemId,
          itemQty,
          // just a random different signature
          "0x65c851b748c10f8aef1fdfe5ec7b523c40435a5b9c2fdd55851f07fe7c10082024aaee209102d5fbb97cea581a618e3552be20401a4843cdbf1bc9d4cae2617a1c",
        ]
      )
    );

    // send with invalid signature
    await expect(walletConsumer.sendTransaction(invalidTransactionData)).to.be.revertedWith(
      "invsig"
    );

    // check if user now has one of the posters
    let itemCount = await cabinet.balanceOf(walletConsumer.address, itemId);
    expect(itemCount).to.equal(1);
  });
});
