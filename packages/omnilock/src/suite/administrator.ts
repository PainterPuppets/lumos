import { TransactionSkeletonType } from "@ckb-lumos/helpers";
import { ScriptConfig } from "@ckb-lumos/config-manager";
import { AdjustedSkeleton, AuthByAdministrator, AuthPart } from "../types";
import { unimplemented } from "../utils";

export function isAdministratorHint(x: AuthPart): x is AuthByAdministrator {
  return x && typeof x === "object" && x.authFlag === "ADMINISTRATOR";
}

export function administrator(
  txSkeleton: TransactionSkeletonType,
  options: { config: ScriptConfig; hints: AuthByAdministrator[] }
): AdjustedSkeleton {
  console.log(txSkeleton);
  console.log(options);
  unimplemented();
}
