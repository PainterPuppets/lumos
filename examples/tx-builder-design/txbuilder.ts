import { Transaction, HexString, helpers, commons } from '@ckb-lumos/lumos';
import type { TransactionSkeletonType } from '@ckb-lumos/helpers';
import { TransactionBuilder, BuilderPlugin, PluginInputOtions, PluginOutputOtions, PayFeeOptions, PushInputOptions, PushOutputOptions } from './interface';
import _ from 'lodash';

const DEFAULT_OPTIONS: PushInputOptions = {
  cellDeps: [],
  headerDeps: [],
  inputs: [],
  outputs: [],
  witnesses: [],
}

export class SimpleTxBuilder<Plugins extends BuilderPlugin[]> implements TransactionBuilder<Plugins> {
  _plugins: Plugins;
  txSkeleton: TransactionSkeletonType;

  constructor(plugins: Plugins) {
    this.txSkeleton = helpers.TransactionSkeleton({});
    this._plugins = plugins;
  }

  async pushInput(initialOptions: PushInputOptions<PluginInputOtions<Plugins>>) {
    const options = await (async () => {
      if (initialOptions.skipPlugin) {
        return initialOptions;
      }


      return this._plugins
        .filter(p => p['pushInput'])
        .reduce(
          async (currentOptions, currentPlugin) => currentPlugin.pushInput(await Promise.resolve(currentOptions)), 
          Promise.resolve(Object.assign({}, _.cloneDeep(DEFAULT_OPTIONS), initialOptions))
        );
    })()

    if (options.cellDeps) {
      // todo: add unique cellDeps
      this.txSkeleton = this.txSkeleton.update("cellDeps", (cellDeps) => cellDeps.push(...options.cellDeps));
    }

    if (options.inputs) {
      this.txSkeleton = this.txSkeleton.update("inputs", (inputs) => inputs.push(...options.inputs));
    }

    if (options.outputs) {
      this.txSkeleton = this.txSkeleton.update("outputs", (outputs) => outputs.push(...options.outputs));
    }

    if (options.witnesses) {
      this.txSkeleton = this.txSkeleton.update("witnesses", (witnesses) => witnesses.push(...options.witnesses));
    }

    if (options.headerDeps) {
      this.txSkeleton = this.txSkeleton.update("headerDeps", (headerDeps) => headerDeps.push(...options.headerDeps));
    }

    return this;
  }

  removeInput() {
    // todo: impl
    return this;
  }

  async pushOutput(initialOptions: PushOutputOptions<PluginOutputOtions<Plugins>>) {
    const options = await (async () => {
      if (initialOptions.skipPlugin) {
        return initialOptions;
      }

      return this._plugins
        .filter(p => p['pushOutput'])
        .reduce(
          async (currentOptions, currentPlugin) => currentPlugin.pushOutput(await Promise.resolve(currentOptions)), 
          Promise.resolve(Object.assign({}, _.cloneDeep(DEFAULT_OPTIONS), initialOptions))
        );
    })()

    if (options.outputs) {
      this.txSkeleton = this.txSkeleton.update("outputs", (outputs) => outputs.push(...options.outputs));
    }

    return this;
  }

  removeOutput() {
    // todo: impl
    return this;
  }

  async payFeeByFeeRate(initialOptions: PayFeeOptions<PluginInputOtions<Plugins>>) {
    // todo: impl
    console.log(initialOptions);

    return this;
  }

  calcTransactionSize(): number {
    return commons.common.__tests__.getTransactionSize(this.txSkeleton);
  }

  getMessages(): HexString[] {
    this.txSkeleton = commons.common.prepareSigningEntries(this.txSkeleton);

    return this.txSkeleton.get("signingEntries").map(entry => entry.message).toArray()
  }

  seal(signatures: HexString[]): Transaction {
    return helpers.sealTransaction(this.txSkeleton, signatures)
  };

  getTransaction(): Transaction {
    return helpers.createTransactionFromSkeleton(this.txSkeleton);
  };
}