import {
  Cell,
  CellCollector,
  CellProvider,
  QueryOptions,
  Script,
  Header,
} from "@painterpuppets-lumos/base";
import { Options } from "@painterpuppets-lumos/helpers";
import { RPC } from "@painterpuppets-lumos/rpc";
import { FromInfo } from "./from_info";

export interface CellCollectorConstructor {
  new (
    fromInfo: FromInfo,
    cellProvider: CellProvider,
    {
      config,
      queryOptions,
      tipHeader,
      NodeRPC,
    }: Options & {
      queryOptions?: QueryOptions;
      tipHeader?: Header;
      NodeRPC?: typeof RPC;
    }
  ): CellCollectorType;
}

export interface CellCollectorType extends CellCollector {
  readonly fromScript: Script;
  collect(): AsyncGenerator<Cell>;
}
