const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("FundChain", function () {
  async function deploy() {
    const [creator, alice, bob] = await ethers.getSigners();
    const FundChain = await ethers.getContractFactory("FundChain");
    const fundChain = await FundChain.deploy();
    return { fundChain, creator, alice, bob };
  }

  it("creates a campaign and lists it", async function () {
    const { fundChain, creator } = await deploy();
    await fundChain.createCampaign("Kit", "Workshop kit", ethers.parseEther("1"), 60);

    const all = await fundChain.getAllCampaigns();
    expect(all.length).to.equal(1);
    expect(all[0].creator).to.equal(creator.address);
    expect(all[0].title).to.equal("Kit");
    expect(all[0].goal).to.equal(ethers.parseEther("1"));
  });

  it("accepts contributions while active", async function () {
    const { fundChain, alice } = await deploy();
    await fundChain.createCampaign("Kit", "", ethers.parseEther("1"), 60);

    await fundChain.connect(alice).contribute(0, { value: ethers.parseEther("0.4") });

    const [campaign] = await fundChain.getAllCampaigns();
    expect(campaign.totalRaised).to.equal(ethers.parseEther("0.4"));
    expect(await fundChain.contributions(0, alice.address)).to.equal(ethers.parseEther("0.4"));
  });

  it("lets the creator withdraw after a successful campaign", async function () {
    const { fundChain, creator, alice } = await deploy();
    await fundChain.createCampaign("Kit", "", ethers.parseEther("1"), 10);

    await fundChain.connect(alice).contribute(0, { value: ethers.parseEther("1") });
    await time.increase(11 * 60);

    const before = await ethers.provider.getBalance(creator.address);
    const tx = await fundChain.withdrawFunds(0);
    const receipt = await tx.wait();
    const gas = receipt.gasUsed * receipt.gasPrice;
    const after = await ethers.provider.getBalance(creator.address);

    expect(after - before + gas).to.equal(ethers.parseEther("1"));
    const [campaign] = await fundChain.getAllCampaigns();
    expect(campaign.withdrawn).to.equal(true);
  });

  it("refunds contributors when the goal is missed", async function () {
    const { fundChain, alice } = await deploy();
    await fundChain.createCampaign("Kit", "", ethers.parseEther("1"), 10);

    await fundChain.connect(alice).contribute(0, { value: ethers.parseEther("0.2") });
    await time.increase(11 * 60);

    await expect(fundChain.connect(alice).refund(0)).to.changeEtherBalance(
      alice,
      ethers.parseEther("0.2")
    );
    expect(await fundChain.contributions(0, alice.address)).to.equal(0n);
  });

  it("blocks withdraw if the goal was missed and refund if it was met", async function () {
    const { fundChain, alice } = await deploy();
    await fundChain.createCampaign("Miss", "", ethers.parseEther("1"), 10);
    await fundChain.connect(alice).contribute(0, { value: ethers.parseEther("0.1") });
    await time.increase(11 * 60);

    await expect(fundChain.withdrawFunds(0)).to.be.revertedWith("Goal was not met");

    const { fundChain: other, alice: donor } = await deploy();
    await other.createCampaign("Hit", "", ethers.parseEther("1"), 10);
    await other.connect(donor).contribute(0, { value: ethers.parseEther("1") });
    await time.increase(11 * 60);

    await expect(other.connect(donor).refund(0)).to.be.revertedWith("Goal was met, no refunds");
  });
});
