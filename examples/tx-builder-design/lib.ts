import {
  Address,
  Cell,
  Output,
  CellDep,
  Hash,
  HexNumber,
  HexString,
  OutPoint,
  Script,
  Transaction,
  RawTransaction,
  Indexer
} from "@ckb-lumos/base";
import { BI } from '@ckb-lumos/lumos';
import { BytesLike } from "@ckb-lumos/codec";
import { addressToScript } from "@ckb-lumos/helpers";

interface ExchangeSudtForCkbOptions {
  // target sudt
  // sudt: Script;
  // sudtSender: Address;
  // sudtAmountForExchange: HexNumber;
  // sudtAmountForRecipient: HexNumber;

  sender: Address;

  // the lock(address) of exchange provider
  amount: HexNumber;

  // receive the ckbAmount + sudtAmountForRecipient
  recipient: Address;

  indexer: Indexer;
}

export async function buildSecp256k1Blake160Exchange(options: ExchangeSudtForCkbOptions) {
  const secp256k1Blake160Plugin = makeSecp256k1Blake160Plugin({
    codeHash: "0x",
    hashType: "type",
  });
  const exchangeTx = builder({
    plugins: [secp256k1Blake160Plugin],
  });

  const collector = options.indexer.collector({
    lock: addressToScript(options.sender),
  });

  const neededCapacity = BI.from(options.amount).add(100000);
  let collectedSum = BI.from(0);
  const collected: Cell[] = [];

  for await (const cell of collector.collect()) {
    collectedSum = collectedSum.add(cell.cellOutput.capacity);
    collected.push(cell);
    if (collectedSum >= neededCapacity) break;
  }

  if (collectedSum < neededCapacity) {
    throw new Error("Not enough CKB");
  }
  // TODO

  return exchangeTx;
}

/* builder */
interface BuilderOptions {
  plugins: BuilderPlugin[];
}

declare function builder(builderOptions: BuilderOptions): TransactionBuilder;

type Promisable<T> = T | Promise<T>;

export interface InputCell {
  outPoint: OutPoint;
  cellOutput: {
    lock: Script;
    type?: Script;
    capacity: HexNumber;
  };
  data: HexString;
}

type WitnessPayload = BytesLike | { ungrouped: boolean; item: BytesLike };

export interface SetInputOption {
  lockWitness?: WitnessPayload;
  typeWitness?: WitnessPayload;

  cellDeps?: CellDep[];
  headerDeps?: Hash[];
}

export interface TransactionBuilder {
  pushInput(input: InputCell, options?: SetInputOption): this;

  removeInput(): this;

  pushOutput(output: Output): this;

  removeOutput(): this;

  /**
   * get the current transaction byte size
   */
  calcTransactionSize(): number;

  getMessages(): HexString[];

  setWitnesses(witnesses: HexString[]): this;

  getRawTransaction(): RawTransaction;

  getTransaction(): Transaction;
}

/* plugin */
// TODO define the plugin
export type BuilderPlugin = {
  [key: string]: unknown;
};

interface Secp256k1Blake160BuilderPluginOptions {
  codeHash: BytesLike;
  hashType: BytesLike;
}

declare function makeSecp256k1Blake160Plugin(
  options: Secp256k1Blake160BuilderPluginOptions
): BuilderPlugin;

interface SudtBuilderPluginOptions {
  codeHash: BytesLike;
  hashType: BytesLike;
}

declare function makeSudtPlugin(
  options: SudtBuilderPluginOptions
): BuilderPlugin;