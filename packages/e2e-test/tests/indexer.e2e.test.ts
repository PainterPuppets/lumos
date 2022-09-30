import anyTest, { TestInterface } from "ava";
import { generateHDAccount, HDAccount } from "../src/utils";
import { CKB_RPC_URL, INDEXER_RPC_URL } from "../src/constants";
import { E2EProvider } from "../src/e2eProvider";
import { join } from "path";
import { FaucetProvider } from "../src/faucetProvider";
import { FileFaucetQueue } from "../src/faucetQueue";
import { Cell, Script } from "@ckb-lumos/base";
import { encodeToAddress } from "@ckb-lumos/helpers";
import { Config } from "@ckb-lumos/config-manager";
import { RPC } from "@ckb-lumos/rpc";
import { Indexer } from "@ckb-lumos/ckb-indexer";

interface TestContext {
  account: HDAccount;
  cellsMap: Record<HDAccount["address"], Cell[]>;
  faucetProvider: FaucetProvider;
  config: Config;
}
const test = anyTest as TestInterface<TestContext>;

const rpc = new RPC(CKB_RPC_URL);
const indexer = new Indexer(INDEXER_RPC_URL, CKB_RPC_URL);
const e2eProvider = new E2EProvider({ indexer, rpc });

test.before(async (t) => {
  const config = await e2eProvider.loadLocalConfig();
  const alice = generateHDAccount();
  const faucetProvider = new FaucetProvider(e2eProvider, {
    queue: new FileFaucetQueue(join(__dirname, "../tmp/")),
  });

  const txHashes = await Promise.all([
    faucetProvider.claimCKB(alice.address),
    faucetProvider.claimCKB(alice.address),
  ]);

  await Promise.all(
    txHashes.map((txHash) => e2eProvider.waitTransactionCommitted(txHash))
  );

  await e2eProvider.waitForBlock({
    relative: true,
    value: 1,
  });

  await Promise.all(
    (
      await Promise.all([
        faucetProvider.claimCKB(alice.address),
        faucetProvider.claimCKB(alice.address),
        faucetProvider.claimCKB(alice.address),
      ])
    ).map((txHash) => e2eProvider.waitTransactionCommitted(txHash))
  );

  await e2eProvider.waitTransactionCommitted(
    await e2eProvider.daoDeposit({ fromPk: alice.privKey })
  );

  const cells = await e2eProvider.findCells({
    lock: alice.lockScript,
    order: "asc",
  });

  t.context = {
    account: alice,
    cellsMap: { [alice.address]: cells },
    faucetProvider,
    config,
  };
});

test.after(async (t) => {
  t.context.faucetProvider.end();
});

test("Test query cells by lock script", async (t) => {
  const alice = t.context.account;
  const aliceCells = t.context.cellsMap[alice.address];
  const cells = await e2eProvider.findCells({ lock: alice.lockScript });

  t.deepEqual(cells.length, aliceCells.length);
  t.deepEqual(cells, aliceCells);
});

test("Test query cells by lock script script and between block range", async (t) => {
  const alice = t.context.account;
  const aliceCells = t.context.cellsMap[alice.address];

  const fromBlock = aliceCells[2].blockNumber!;
  const toBlock = aliceCells[4].blockNumber!;

  const cells = await e2eProvider.findCells({
    lock: alice.lockScript,
    fromBlock,
    toBlock,
  });

  cells.map((cell) =>
    t.true(parseInt(fromBlock) <= parseInt(cell.blockNumber!))
  );
  cells.map((cell) => t.true(parseInt(toBlock) >= parseInt(cell.blockNumber!)));
});

test("Test query cells by lock script and skip the first 2 cells", async (t) => {
  const alice = t.context.account;
  const aliceCells = t.context.cellsMap[alice.address];

  const cells = await e2eProvider.findCells({
    lock: alice.lockScript,
    skip: 2,
  });

  t.deepEqual(cells.length, aliceCells.length - 2);
  t.deepEqual(cells, aliceCells.slice(2));
});

test("Test query cells by lock script and return the cells in desc order", async (t) => {
  const alice = t.context.account;
  const aliceCells = t.context.cellsMap[alice.address];

  const cells = await e2eProvider.findCells({
    lock: alice.lockScript,
    order: "desc",
  });

  t.deepEqual(cells.length, aliceCells.length);
  t.deepEqual(cells, [...aliceCells].reverse());
});

test("Test query cells by lock script, return the cells in desc order then skip the first 2 cells", async (t) => {
  const alice = t.context.account;
  const aliceCells = t.context.cellsMap[alice.address];

  const cells = await e2eProvider.findCells({
    lock: alice.lockScript,
    skip: 2,
    order: "desc",
  });

  t.deepEqual(cells.length, aliceCells.length - 2);
  t.deepEqual(cells, [...aliceCells].reverse().slice(2));
});

test("Test query cells by lock script with argsLen as number", async (t) => {
  const alice = t.context.account;
  const aliceCells = t.context.cellsMap[alice.address];

  const alicePrefixLock: Script = {
    ...alice.lockScript,
    args: alice.lockScript.args.slice(0, 20), // length: 9
  };

  const alicePrefixAccount = encodeToAddress(alicePrefixLock);
  await e2eProvider.waitTransactionCommitted(
    await t.context.faucetProvider.claimCKB(alicePrefixAccount)
  );

  const cells = await e2eProvider.findCells({
    lock: alicePrefixLock,
    argsLen: 20,
  });

  t.deepEqual(cells.length, aliceCells.length);
  t.deepEqual(cells, aliceCells);

  const cells2 = await e2eProvider.findCells({
    lock: alicePrefixLock,
    argsLen: "any",
  });

  t.deepEqual(cells2.length, aliceCells.length + 1);
});

test("Test query cells by non exist lock script", async (t) => {
  const nonExistAccount = generateHDAccount();

  const cells = await e2eProvider.findCells({
    lock: nonExistAccount.lockScript,
  });

  t.deepEqual(cells, []);
});

test("Test query cells by type script", async (t) => {
  const cells = await e2eProvider.findCells({
    type: {
      codeHash: t.context.config.SCRIPTS["DAO"]!.CODE_HASH,
      hashType: t.context.config.SCRIPTS["DAO"]!.HASH_TYPE,
      args: "0x",
    },
  });

  t.true(cells.length > 0);
});

test("Test query cells by both lock and type script and return nonempty result", async (t) => {
  const alice = t.context.account;
  const aliceCells = t.context.cellsMap[alice.address];

  const cells = await e2eProvider.findCells({
    lock: alice.lockScript,
    type: {
      codeHash: t.context.config.SCRIPTS["DAO"]!.CODE_HASH,
      hashType: t.context.config.SCRIPTS["DAO"]!.HASH_TYPE,
      args: "0x",
    },
  });

  const withTypeCells = aliceCells.filter((cell) => cell.cellOutput.type);

  t.deepEqual(cells.length, withTypeCells.length);
  t.deepEqual(cells, withTypeCells);
});

test("Test query cells by both lock and empty type script", async (t) => {
  const alice = t.context.account;
  const aliceCells = t.context.cellsMap[alice.address];

  const cells = await e2eProvider.findCells({
    lock: alice.lockScript,
    type: "empty",
  });

  const withTypeCells = aliceCells.filter((cell) => cell.cellOutput.type);

  t.deepEqual(cells.length, aliceCells.length - withTypeCells.length);
  t.deepEqual(
    cells,
    aliceCells.filter((cell) => cell.cellOutput.type === null)
  );
});

test("Test query cells by lock and script length range and return empty result", async (t) => {
  const alice = t.context.account;
  const aliceCells = t.context.cellsMap[alice.address];

  const cells = await e2eProvider.findCells({
    lock: alice.lockScript,
    scriptLenRange: ["0x0", "0x1"],
  });

  const withTypeCells = aliceCells.filter((cell) => cell.cellOutput.type);

  t.deepEqual(cells.length, aliceCells.length - withTypeCells.length);
  t.deepEqual(
    cells,
    aliceCells.filter((cell) => cell.cellOutput.type === null)
  );
});
