import { struct, vector } from "@painterpuppets-lumos/codec/lib/molecule";
import { Byte32 } from "@painterpuppets-lumos/codec/lib/blockchain";
import { createFixedBytesCodec } from "@painterpuppets-lumos/codec";
import { Uint32 } from "@painterpuppets-lumos/codec/lib/number";
import { BI } from "@painterpuppets-lumos/bi";

export const OutPoint = struct(
  {
    tx_hash: Byte32,
    index: createFixedBytesCodec({
      byteLength: 4,
      pack: (hex) => Uint32.pack(hex),
      unpack: (buf) => BI.from(Uint32.unpack(buf)).toHexString(),
    }),
  },
  ["tx_hash", "index"]
);

export const OutPointVec = vector(OutPoint);
