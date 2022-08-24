import { Output, RawTransaction, Transaction, HexString } from '@ckb-lumos/base';
import { TransactionBuilder, BuilderPlugin, InputCell, SetInputOption } from './lib';

function isFunc(func: unknown): func is Function {
  return typeof func === 'function'
}


export class SimpleTransactionBuilder implements TransactionBuilder {
  _plugins: Array<BuilderPlugin> = [];

  constructor({
    plugins
  }: {
    plugins: Array<BuilderPlugin>
  }) {
    this._plugins = plugins;
  }

  _beforePushInput = (input: InputCell, options?: SetInputOption) => {
    return this._plugins
      .filter(plugin => plugin['beforePushInput'] && isFunc(plugin['beforePushInput']))
      .sort(plugin => plugin['priority'] as number || 1000)
      .reduce(
        (a, plugin) => (plugin as any).beforePushInput(a.input, a.options), 
        { input, options: options || {} },
      )
  }

  pushInput(input: InputCell, options?: SetInputOption): this {
    const { input: _input, options: _options } = this._beforePushInput(input, options);

    // todo: add depcell
    // todo: add input
    // todo: add witness payload

    return this;
  };

  removeInput(): this {
    // todo
    return this;
  };;


  pushOutput(output: Output): this {
    console.log(output);
    // todo
    return this;
  };;

  removeOutput(): this {
    // todo
    return this;
  };

  /**
   * get the current transaction byte size
   */
  calcTransactionSize(): number {
    return 0;
  };

  getMessages(): string[] {
    return [];
  }

  setWitnesses(witnesses: HexString[]): this {
    console.log(witnesses);
    return this;
  };

  getRawTransaction(): RawTransaction {
    return { } as RawTransaction;
  };

  getTransaction(): Transaction {
    return { } as Transaction;
  };
}
