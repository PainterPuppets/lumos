import {
  Cell,
  CellDep,
  Hash,
  HexString,
  Transaction,
} from "@ckb-lumos/base";


// utils type
type TupleTypes<T> = { [P in keyof T]: T[P] } extends { [key: number]: infer V } ? V : never;
type UnionToIntersection<U> = (U extends any ? (k: U)=>void : never) extends ((k: infer I)=>void) ? I : never;
type Promisable<T> = T | Promise<T>;
type Union<A, B> = A & B;


// type WitnessPayload = BytesLike | { ungrouped: boolean; item: BytesLike };

export type BaseInputOptions = {
  cellDeps?: CellDep[];
  headerDeps?: Hash[];
  inputs?: Cell[];
  outputs?: Cell[];

  // todo: 这里好像有lock和type两种
  witnesses?: HexString[];

  skipPlugin?: boolean;
}

export type BaseOutputOptions = {
  outputs?: Cell[];
  skipPlugin?: boolean;
}

export type BasePayFeeOptions = BaseInputOptions & {
  rate: number;
}

export type PushInputOptions<Options extends {} = {}> = Union<Options, BaseInputOptions>
export type PushOutputOptions<Options extends {} = {}> = Union<Options, BaseOutputOptions>
export type PayFeeOptions<Options extends {} = {}> = Union<Options, BasePayFeeOptions>

// plugin utils
type PushInputHook<O extends {} = {}> = (options: PushInputOptions<O>) => Promisable<PushInputOptions<O>>;
type PushOutputHook<O extends {} = {}> = (options: PushOutputOptions<O>) => Promisable<PushOutputOptions<O>>;
type PayFeeHook<O extends {} = {}> = (options: PayFeeOptions<O>) => Promisable<PayFeeOptions<O>>;


export type BuilderPlugin<
  InputOptions extends {} = {},
  OutputOptions extends {} = {},
  PayFeeOptions extends {} = {},
> = {
  pushInput?: PushInputHook<InputOptions>,
  pushOutput?: PushOutputHook<OutputOptions>,
  payfee?: PayFeeHook<PayFeeOptions>,
};

export type PluginOtions<T, K extends keyof BuilderPlugin> = TupleTypes<T> extends BuilderPlugin 
  ? UnionToIntersection<Parameters<TupleTypes<T>[K]>['0']>
  : never;

export type PluginInputOtions<T> = PluginOtions<T, 'pushInput'> extends Parameters<PushInputHook>[0]
  ? Omit<PluginOtions<T, 'pushInput'>, keyof BaseInputOptions>
  : never;

export type PluginOutputOtions<T> = PluginOtions<T, 'pushOutput'> extends Parameters<PushOutputHook>[0]
  ? Omit<PluginOtions<T, 'pushOutput'>, keyof BaseInputOptions>
  : never;



export interface TransactionBuilder<Plugins extends BuilderPlugin[] = []> {
  pushInput(options?: PushInputOptions<PluginInputOtions<Plugins>>): Promisable<this>;

  removeInput(): this;

  pushOutput(output: PushOutputOptions<PluginOutputOtions<Plugins>>): Promisable<this>;

  removeOutput(): this;

  payFeeByFeeRate(options: PayFeeOptions<PluginInputOtions<Plugins>>): Promisable<this>;

  /**
   * get the current transaction byte size
   */
  calcTransactionSize(): number;

  getMessages(): HexString[];

  seal(signatures: HexString[]): Transaction;

  getTransaction(): Transaction;
}

// interface Secp256k1Blake160BuilderPluginOptions {
//   codeHash: BytesLike;
//   hashType: BytesLike;
// }

// declare function makeSecp256k1Blake160Plugin(
//   options: Secp256k1Blake160BuilderPluginOptions
// ): BuilderPlugin;

// interface SudtBuilderPluginOptions {
//   codeHash: BytesLike;
//   hashType: BytesLike;
// }

// declare function makeSudtPlugin(
//   options: SudtBuilderPluginOptions
// ): BuilderPlugin;


// interface UnipassBuilderPluginOptions {
//   codeHash: BytesLike;
//   hashType: BytesLike;
//   unipassUrl: string;
// }

// declare function makeUnipassPlugin(
//   options: SudtBuilderPluginOptions
// ): BuilderPlugin;


// test

// type Secp256k1Blake160Plugin = BuilderPlugin<{ address: string, capacity: number }>;
// type NFTPlugin = BuilderPlugin<{ nftClassCodeHash: HexString, nftId: number }>;

// type Plugins = [Secp256k1Blake160Plugin, NFTPlugin];
// type ai = PluginInputOtions<Plugins>
// type ao = PluginOutputOtions<Plugins>

// const a = { } as TransactionBuilder<[Secp256k1Blake160Plugin, NFTPlugin]>;

// type test = Parameters<TransactionBuilder<[Secp256k1Blake160Plugin, NFTPlugin]>['pushInput']>['0']['address']

// export const main = async () => {
//   const res = await a.pushInput({
//     address: '',
//     capacity: 100 * 10 ** 8,
//     nftClassCodeHash: '',
//     nftId: 1000,
//   });

//   res.getMessages()
// }
