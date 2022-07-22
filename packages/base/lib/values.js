// This module provides a ValueObject implementation for CKB related data
// structures to allow seamless immutable.js integration.
const { xxHash32 } = require("js-xxhash");
const { ckbHash } = require("./utils");
const { bytes, blockchain, blockchainUtils } = require("@ckb-lumos/codec");

const { hexify } = bytes;
class Value {
  constructor(buffer) {
    this.buffer = buffer;
  }

  equals(other) {
    return hexify(this.buffer) === hexify(other.buffer);
  }

  hashCode() {
    return xxHash32(Buffer.from(this.buffer), 0);
  }

  hash() {
    return ckbHash(this.buffer);
  }
}

class ScriptValue extends Value {
  constructor(script) {
    super(blockchain.Script.pack(script));
  }
}

class OutPointValue extends Value {
  constructor(outPoint) {
    super(
      blockchain.OutPoint.pack(
        blockchainUtils.transformOutPointCodecType(outPoint)
      )
    );
  }
}

class RawTransactionValue extends Value {
  constructor(rawTransaction) {
    super(
      blockchain.RawTransaction.pack(
        blockchainUtils.transformRawTransactionCodecType(rawTransaction)
      )
    );
  }
}

class TransactionValue extends Value {
  constructor(transaction) {
    super(
      blockchain.Transaction.pack(
        blockchainUtils.transformTransactionCodecType(transaction)
      )
    );
  }
}

module.exports = {
  ScriptValue,
  OutPointValue,
  RawTransactionValue,
  TransactionValue,
};
