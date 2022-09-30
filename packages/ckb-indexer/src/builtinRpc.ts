import { Tip, utils } from "@ckb-lumos/base";
import { RPC, request } from "./rpc";

export class CkbBuiltinRPC extends RPC {
  async getTip(): Promise<Tip> {
    return utils.deepCamel(await request(this.uri, "get_indexer_tip"));
  }

  async getIndexerInfo(): Promise<string> {
    throw new Error("builtin indexer rpc not support get_indexer_info method");
  }
}
