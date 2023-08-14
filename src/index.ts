import { config } from "dotenv";
import { IBundler, Bundler } from "@biconomy/bundler";
import {
    BiconomySmartAccount,
    BiconomySmartAccountConfig,
    DEFAULT_ENTRYPOINT_ADDRESS,
} from "@biconomy/account";
import {
    IHybridPaymaster,
    PaymasterFeeQuote,
    PaymasterMode,
    SponsorUserOperationDto,
} from "@biconomy/paymaster";
import { Wallet, providers, ethers } from "ethers";
import { BiconomyPaymaster } from "@biconomy/paymaster";
import { ChainId } from "@biconomy/core-types";

// const generatedSW = "0x36e23b8e3ba341e85f1f2b757a1a7b67673433b7";

config();

const bundler: IBundler = new Bundler({
    bundlerUrl:
        "https://bundler.biconomy.io/api/v2/80001/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44",
    chainId: ChainId.POLYGON_MUMBAI,
    entryPointAddress: DEFAULT_ENTRYPOINT_ADDRESS,
});

const provider = new providers.JsonRpcProvider(
    "https://rpc.ankr.com/polygon_mumbai"
);
const wallet = new Wallet(process.env.PRIVATE_KEY || "", provider);

const biconomySmartAccountConfig: BiconomySmartAccountConfig = {
    signer: wallet,
    chainId: ChainId.POLYGON_MUMBAI,
    bundler: bundler,
    // entryPointAddress: DEFAULT_ENTRYPOINT_ADDRESS,
};

// Create a smart account for user attached to wallet that is in env
async function createAccount() {
    let biconomySmartAccount = new BiconomySmartAccount(
        biconomySmartAccountConfig
    );
    biconomySmartAccount = await biconomySmartAccount.init();
    console.log("owner: ", biconomySmartAccount.owner);
    console.log(
        "address: ",
        await biconomySmartAccount.getSmartAccountAddress()
    );

    console.log("smart address: ", biconomySmartAccount);
    return biconomySmartAccount;
}

async function createMaticTransaction() {
    const sawallet = new BiconomySmartAccount({
        signer: wallet,
        chainId: ChainId.POLYGON_MUMBAI,
        bundler: bundler,
    });

    await sawallet.init();

    // const { data } = await sawallet.getSmartAccountsByOwner({
    //     chainId: ChainId.POLYGON_MUMBAI,
    //     owner: generatedSW,
    //     index: 0,
    // });

    // console.log("Attached SW: ", data);

    const transaction = {
        to: "0x3472059945ee170660a9A97892a3cf77857Eba3A",
        data: "0x",
        value: ethers.utils.parseEther("0.1"),
    };

    const userOp = await sawallet.buildUserOp([transaction]);
    userOp.paymasterAndData = "0x";

    const userOpResponse = await sawallet.sendUserOp(userOp);

    const transactionDetail = await userOpResponse.wait();

    console.log("transaction detail below");
    console.log(transactionDetail);
}

async function createERC20Transaction() {
    const sawallet = new BiconomySmartAccount({
        signer: wallet,
        chainId: ChainId.POLYGON_MUMBAI,
        bundler: bundler,
    });

    await sawallet.init();

    const erc20Interface = new ethers.utils.Interface([
        "function transfer(address recipient, uint256 amount) external returns (bool success)",
    ]);

    const calldata = erc20Interface.encodeFunctionData("transfer", [
        "0x3472059945ee170660a9A97892a3cf77857Eba3A", //to
        ethers.utils.parseEther("0.1"), //amount
    ]);

    const dummyTokenAddress = "0xfe4F5145f6e09952a5ba9e956ED0C25e3Fa4c7F1";

    const transaction = {
        to: dummyTokenAddress,
        data: calldata,
        value: 0,
    };

    const userOp = await sawallet.buildUserOp([transaction]);
    userOp.paymasterAndData = "0x";

    const userOpResponse = await sawallet.sendUserOp(userOp);

    const transactionDetail = await userOpResponse.wait();

    console.log("transaction detail below");
    console.log(transactionDetail);
}

const paymaster = new BiconomyPaymaster({
    paymasterUrl: "https://paymaster.biconomy.io/api/v1/80001/",
});

async function createERC20TransactionPayWithERC20() {
    const biconomySmartAccount = new BiconomySmartAccount({
        signer: wallet,
        chainId: ChainId.POLYGON_MUMBAI,
        bundler: bundler,
        paymaster: paymaster,
    });

    await biconomySmartAccount.init();

    const erc20Interface = new ethers.utils.Interface([
        "function transfer(address recipient, uint256 amount) external returns (bool success)",
    ]);

    const calldata = erc20Interface.encodeFunctionData("transfer", [
        "0x3472059945ee170660a9A97892a3cf77857Eba3A", //to
        ethers.utils.parseEther("0.1"), //amount
    ]);

    const dummyTokenAddress = "0xfe4F5145f6e09952a5ba9e956ED0C25e3Fa4c7F1";

    const transaction = {
        to: dummyTokenAddress,
        data: calldata,
        value: 0,
    };

    const partialUserOp = await biconomySmartAccount.buildUserOp([transaction]);

    const biconomyPaymaster =
        biconomySmartAccount.paymaster as IHybridPaymaster<SponsorUserOperationDto>;

    try {
        const feeQuotesResponse =
            await biconomyPaymaster.getPaymasterFeeQuotesOrData(partialUserOp, {
                // here we are explicitly telling by mode ERC20 that we want to pay in ERC20 tokens and expect fee quotes
                mode: PaymasterMode.ERC20,
                // tokenList: [],
                // preferredToken is optional. If you want to pay in a specific token, you can pass its address here and get fee quotes for that token only
                // preferredToken: dummyTokenAddress,
            });

        console.log("feeQuotesResponse: ", feeQuotesResponse);
    } catch (error) {
        console.log("error: ", error);
    }

    // const feeQuotes = feeQuotesResponse.feeQuotes as PaymasterFeeQuote[];
    // const spender = feeQuotesResponse.tokenPaymasterAddress || "";

    // const choices = feeQuotes?.map((quote: any, index: number) => ({
    //     name: `Option ${index + 1}: ${quote.maxGasFee}: ${quote.symbol} `,
    //     value: index,
    // }));

    // console.table(choices);
}

createERC20TransactionPayWithERC20();

//owner:  0xdF5Ab141a619A3E988235fdc111E5B1BB8A7bd4D
//smart address:  0x36e23b8e3ba341e85f1f2b757a1a7b67673433b7
