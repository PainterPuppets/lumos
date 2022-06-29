import {
  byteOf,
  byteVecOf,
  option,
  table,
  vector,
  union,
  struct,
} from "@ckb-lumos/codec/lib/molecule";
import {
  BytesOpt,
  createFixedHexBytesCodec,
  Byte32Vec,
  Byte32,
} from "@ckb-lumos/codec/lib/blockchain";
import { bytify, hexify } from "@ckb-lumos/codec/lib/bytes";

const Hexify = { pack: bytify, unpack: hexify };

const Identity = createFixedHexBytesCodec(21);

const RCRule = struct(
  {
    smt_root: Byte32,
    flags: byteOf(Hexify),
  },
  ["smt_root", "flags"]
);

const RCCellVec = Byte32Vec;

export const RCData = union(
  {
    RCRule,
    RCCellVec,
  },
  ["RCRule", "RCCellVec"]
);

const SmtProof = byteVecOf(Hexify);

const SmtProofEntry = table(
  {
    mask: byteOf(Hexify),
    proof: SmtProof,
  },
  ["mask", "proof"]
);

const SmtProofEntryVec = vector(SmtProofEntry);

const OmniIdentity = table(
  {
    identity: Identity,
    proofs: SmtProofEntryVec,
  },
  ["identity", "proofs"]
);

const OmniIdentityOpt = option(OmniIdentity);

export const OmnilockWitnessLock = table(
  {
    signature: BytesOpt,
    omni_identity: OmniIdentityOpt,
    preimage: BytesOpt,
  },
  ["signature", "omni_identity", "preimage"]
);
