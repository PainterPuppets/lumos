import test from "ava";
import { BuiltinRPC } from "@ckb-lumos/ckb-indexer";
import { BUILTIN_INDEXER_RPC_URL } from "../src/constants";

const indexerRpc = new BuiltinRPC(BUILTIN_INDEXER_RPC_URL);

test.before(() => {
  // @ts-ignore: Unreachable code error
  BigInt = () => {
    throw new Error("can not find bigint");
  };
});

test("get tip", async (t) => {
  const tip = await indexerRpc.getTip();
  t.true(typeof tip.blockHash === "string");
  t.true(typeof tip.blockNumber == "string");
});
