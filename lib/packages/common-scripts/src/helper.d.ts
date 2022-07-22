import { TransactionSkeletonType } from "@ckb-lumos/helpers";
import { CellDep, Script, Address, HexString } from "@ckb-lumos/base";
import { Config } from "@ckb-lumos/config-manager";
export declare function addCellDep(txSkeleton: TransactionSkeletonType, newCellDep: CellDep): TransactionSkeletonType;
export declare function generateDaoScript(config: Config): Script;
export declare function isSecp256k1Blake160Script(script: Script, config: Config): boolean;
export declare function isSecp256k1Blake160Address(address: Address, config: Config): boolean;
export declare function isSecp256k1Blake160MultisigScript(script: Script, config: Config): boolean;
export declare function isSecp256k1Blake160MultisigAddress(address: Address, config: Config): boolean;
export declare function isDaoScript(script: Script | undefined, config: Config): boolean;
export declare function isSudtScript(script: Script | undefined, config: Config): boolean;
export declare function isAcpScript(script: Script, config: Config): boolean;
export declare function isAcpAddress(address: Address, config: Config): boolean;
export declare function hashWitness(hasher: any, witness: HexString): void;
export declare function prepareSigningEntries(txSkeleton: TransactionSkeletonType, config: Config, scriptType: "SECP256K1_BLAKE160" | "SECP256K1_BLAKE160_MULTISIG"): TransactionSkeletonType;
export declare function ensureScript(script: Script, config: Config, scriptType: "SECP256K1_BLAKE160" | "SECP256K1_BLAKE160_MULTISIG" | "DAO"): void;
export declare const SECP_SIGNATURE_PLACEHOLDER = "0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
declare const _default: {
    addCellDep: typeof addCellDep;
    generateDaoScript: typeof generateDaoScript;
    isSecp256k1Blake160Script: typeof isSecp256k1Blake160Script;
    isSecp256k1Blake160MultisigScript: typeof isSecp256k1Blake160MultisigScript;
    isDaoScript: typeof isDaoScript;
    isSudtScript: typeof isSudtScript;
    prepareSigningEntries: typeof prepareSigningEntries;
    isSecp256k1Blake160Address: typeof isSecp256k1Blake160Address;
    isSecp256k1Blake160MultisigAddress: typeof isSecp256k1Blake160MultisigAddress;
    ensureScript: typeof ensureScript;
    isAcpScript: typeof isAcpScript;
    isAcpAddress: typeof isAcpAddress;
};
export default _default;
