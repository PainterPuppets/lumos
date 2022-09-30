import { CkbIndexer } from "./indexer";
import { RPC } from "./rpc";
import { CkbBuiltinRPC } from "./builtinRpc";

export class CkbBuiltinIndexer extends CkbIndexer {
  protected getIndexerRpc(): RPC {
    return new CkbBuiltinRPC(this.ckbIndexerUri);
  }
}
