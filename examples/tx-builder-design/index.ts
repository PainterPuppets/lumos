import { config, Indexer, RPC, hd } from "@ckb-lumos/lumos"
import { encodeToAddress } from "@ckb-lumos/helpers"
import { buildSecp256k1Blake160Exchange } from './lib';

// ckt
const CKB_RPC_URL = "https://testnet.ckb.dev/rpc"
const CKB_INDEXER_URL = "https://testnet.ckb.dev/indexer"

const rpc = new RPC(CKB_RPC_URL)
const indexer = new Indexer(CKB_INDEXER_URL, CKB_RPC_URL)

const CONFIG = config.createConfig({
  PREFIX: "ckt",
  SCRIPTS: {
    ...config.predefined.AGGRON4.SCRIPTS,
  },
})

config.initializeConfig(CONFIG)

export const generateSECP256K1Account = (privKey: string) => {
  const pubKey = hd.key.privateToPublic(privKey)
  const args = hd.key.publicKeyToBlake160(pubKey)
  const template = CONFIG.SCRIPTS["SECP256K1_BLAKE160"]!
  const lockScript = {
    codeHash: template.CODE_HASH,
    hashType: template.HASH_TYPE,
    args: args,
  }
  const address = encodeToAddress(lockScript, { config: CONFIG })
  return {
    lockScript,
    address,
    pubKey,
    privKey,
  }
}

const bootstrap = async () => {
  const alice = generateSECP256K1Account("0xd00c06bfd800d27397002dca6fb0993d5ba6399b4238b2f29ee9deb97593d2bc")
  const bob = generateSECP256K1Account("0x63d86723e08f0f813a36ce6aa123bb2289d90680ae1e99d4de8cdb334553f24d")

  let txBuilder = await buildSecp256k1Blake160Exchange({
    sender: alice.address,
    amount: (100 * 10 ** 8).toString(16),
    recipient: bob.address,
    indexer,
  })

  const messages = txBuilder.getMessages()
  const sigs = messages.map(message => hd.key.signRecoverable(message!, alice.privKey))

  txBuilder = txBuilder.setWitnesses(sigs);

  const tx = txBuilder.getTransaction();

  const hash = await rpc.sendTransaction(tx, "passthrough")
  console.log("The transaction hash is", hash)

}

bootstrap()



