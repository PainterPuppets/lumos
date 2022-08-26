import { Cell, helpers, BI } from '@ckb-lumos/lumos';
import { bytes } from '@ckb-lumos/codec';
import { Indexer, blockchain } from "@ckb-lumos/base";
import { ScriptConfig } from '@ckb-lumos/config-manager'
import { BuilderPlugin } from './interface';


type Secp256k1Blake160PluginOptions = {
  scriptConfig: ScriptConfig;
  indexer: Indexer;
}
type Secp256k1Blake160InputOptions = { address: string, capacity: number };

type Secp256k1Blake160Plugin = BuilderPlugin<
  Secp256k1Blake160InputOptions,
  Secp256k1Blake160InputOptions,
  { address: string }
>;

export const SECP256K1BLAKE160_SIGNATURE_PLACEHOLDER = '0x' + '00'.repeat(65);

export function makeSecp256k1Blake160Plugin(
  pluginOptions: Secp256k1Blake160PluginOptions
): Secp256k1Blake160Plugin {
  return {
    pushInput: async (options) => {
      let _options = options;

      const infoScript = helpers.parseAddress(options.address);

      // 没有调用该plugin
      if (infoScript.codeHash !== pluginOptions.scriptConfig.CODE_HASH) {
        return _options;
      }

      // add cell deps
      _options.cellDeps.push({
        outPoint: {
          txHash: pluginOptions.scriptConfig.TX_HASH,
          index: pluginOptions.scriptConfig.INDEX,
        },
        depType: pluginOptions.scriptConfig.DEP_TYPE,
      })

      // collect cell
      // todo: remove 0.001 tx fee
      const neededCapacity = BI.from(options.capacity).add(100000);
      let collectedSum = BI.from(0);
      const collected: Cell[] = [];
      const collector = pluginOptions.indexer.collector({ lock: infoScript, type: "empty" });
      for await (const cell of collector.collect()) {
        collectedSum = collectedSum.add(cell.cellOutput.capacity);
        collected.push(cell);
        if (collectedSum.gte(neededCapacity)) break;
      }

      if (collectedSum.lt(neededCapacity)) {
        console.log('error: Not enough CKB"')
        // TODO: add error handling
        throw new Error("Not enough CKB");
      }

      // set input
      _options.inputs.push(...collected);

      // change
      const changeOutput: Cell = {
        cellOutput: {
          capacity: collectedSum.sub(neededCapacity).toHexString(),
          lock: infoScript,
        },
        data: "0x",
      };
      _options.outputs.push(changeOutput);

      // set witness
      _options.witnesses.push(
        bytes.hexify(blockchain.WitnessArgs.pack({
          lock: SECP256K1BLAKE160_SIGNATURE_PLACEHOLDER
        }))
      );

      return _options;
    },
    pushOutput: async (options) => {
      let _options = options;
      
      const infoScript = helpers.parseAddress(options.address);

      // 没有调用该plugin
      if (infoScript.codeHash !== pluginOptions.scriptConfig.CODE_HASH) {
        return _options;
      }

      const output: Cell = {
        cellOutput: {
          capacity: BI.from(options.capacity).toHexString(),
          lock: infoScript,
        },
        data: "0x",
      };
  
      _options.outputs.push(output);

      return _options;
    },
    payfee: async (options) => {
      // todo: impl
      let _options = options;
      console.log(pluginOptions);

      return _options;
    }
  }
}
