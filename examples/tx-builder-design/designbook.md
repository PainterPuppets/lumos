## txBuilder设计文档
背景: 希望能以script为中心去构建交易，帮助用户减轻复杂度


### plugin设计方案
plugin本身最好是一个函数，以函数式的方式调用，实现方法类似koa的洋葱模型/express的middleware


### 一些常见交易的伪代码


#### secp256k1 transfer

``` ts
// a(100 ckb) & a(fee) => b(100ckb)
txBuilder.setPlugin(makeSecp256k1Plugin())

txBuilder.pushInput({ fromAddress: alice, amount: 100 })
txBuilder.pushOutput({ address: bob, amount: 100 })
txBuilder.payFee({ fromAddress: alice, rate: 1000 })

const messages = getMessages()
// some signing code
txBuilder.setWitnesses(sigs)
const txHash = rpc.sendTransaction(txBuilder.getTransaction())
```

#### omnilock transfer
``` ts
// a(100 ckb) & a(fee) => b(100ckb)

txBuilder.setPlugin(makeSecp256k1Plugin())
txBuilder.setPlugin(makeOmnilockPlugin())

txBuilder.pushInput({ fromAddress: alice, amount: 100 })
txBuilder.pushOutput({ address: bob, amount: 100 })
txBuilder.payFee({ fromAddress: alice, rate: 1000 })
const messages = getMessages()
some signing code
txBuilder.setWitnesses(sigs)
const txHash = rpc.sendTransaction(txBuilder.getTransaction())
```

#### multisig transfer
```ts
// a(50ckb) & a(0.5 fee) & b(50ckb) & b(0.5 fee) => c(100), need a & b sigs

txBuilder.setPlugin(makeMultisigPlugin())
txBuilder.setPlugin(makeSecp256k1Plugin())

txBuilder.pushInput({ fromAddress: alice, amount: 50 })
txBuilder.pushInput({ fromAddress: bob, amount: 50 })
txBuilder.pushOutput({ address: charlie, amount: 100 })
txBuilder.payFee({ fromAddress: alice, rate: 500 })
txBuilder.payFee({ fromAddress: bob, rate: 500 })
const messages = getMessages()
// some signing code...
txBuilder.setWitnesses(sigs)
const txHash = rpc.sendTransaction(txBuilder.getTransaction())
```

#### trade sudt

``` ts
// a(1sudt) & a(0.5 fee) & b(50ckb) & b(0.5 fee) => b(1sudt) & a(50ckb), need a & b sigs
txBuilder.setPlugin(makeSudtPlugin())
txBuilder.setPlugin(makeSecp256k1Plugin())

txBuilder.pushInput({ fromAddress: alice, sudtArg: sudt1, amount: 1 })
txBuilder.pushInput({ fromAddress: bob, amount: 50 })
txBuilder.pushOutput({ address: alice, amount: 50 })
txBuilder.pushOutput({ address: bob, sudtArg: sudt1, amount: 1 })
txBuilder.payFee({ fromAddress: alice, rate: 500 })
txBuilder.payFee({ fromAddress: bob, rate: 500 })
const messages = getMessages()
// some signing code...
txBuilder.setWitnesses(sigs)
const txHash = rpc.sendTransaction(txBuilder.getTransaction())
```

#### dao
``` ts
// a(100ckb) => a(100ckb deposited)

txBuilder.setPlugin(makeDaoPlugin())
txBuilder.setPlugin(makeSecp256k1Plugin())

txBuilder.pushInput({ fromAddress: alice, amount: 100 })
txBuilder.pushOutput({ Address: alice, amount: 100 })
txBuilder.payFee({ fromAddress: alice, rate: 1000 })
const messages = getMessages()
// some signing code...
txBuilder.setWitnesses(sigs)
const txHash = rpc.sendTransaction(txBuilder.getTransaction())

```


### TBD

#### 一种集成sign的想法

multisig transfer
``` ts
// a(50ckb) & a(0.5 fee) & b(50ckb) & b(0.5 fee) => c(100), need a & b sigs

// alice side
txBuilder.setPlugin(makeMultisigPlugin())
txBuilder.setPlugin(makeSecp256k1Plugin())

txBuilder.pushInput({ fromAddress: alice, amount: 50 })
txBuilder.pushInput({ fromAddress: bob, amount: 50 })
txBuilder.pushOutput({ address: charlie, amount: 100 })
txBuilder.payFee({ fromAddress: alice, rate: 500 })
txBuilder.payFee({ fromAddress: bob, rate: 500 })

txBuilder.inputs[0].sign(message => xxx) 
// or
txBuilder.inputs.find(i => i.lockScript.args === alice.args).sign(message => xxx) 

const tx = txBuilder.getTransaction();
sendTxToBob(tx)

// bob side
const aliceSignedTx = getSignedTxFromAlice()

txBuilder.setPlugin(makeMultisigPlugin())
txBuilder.setPlugin(makeSecp256k1Plugin())

txBuilder.createFromTransaction(aliceSignedTx);

txBuilder.input[1].sign(message => xxxxxx)
// or
txBuilder.inputs.find(i => i.lockScript.args === bob.args).sign(message => xxx)
const txHash = rpc.sendTransaction(txBuilder.getTransaction())
```

#### 关于plugin的同步和异步

如果plugin中不想包含async函数，那么需要将cell/deps collect部分放到函数外面，以参数的形式引入，或许会增加一些使用门槛

举个例子，在unipass lock中需要异步获取proof，比较理想的情况应该是plugin中封装了获取proof的部分，用户只需要在options中传一些参数(unipassUrl)就可以自动处理获取smt proof放入deps中的步骤，如果不想包含async的话，或许需要用户做一些额外的配置工作，plugin能做的部分感觉就比较少。


``` ts
// immediately example

txBuilder.setPlugin(makeUnipassPlugin({
  scriptConfig: {
    codeHash: BytesLike;
    hashType: BytesLike;
  },
}))
txBuilder.setPlugin(makeSecp256k1Plugin({
  scriptConfig: {
    codeHash: BytesLike;
    hashType: BytesLike;
  },
}))

const account = await UP.connect({ email: false, evmKeys: true })
const { usernameHash } = new UPCoreSimpleProvier(
  account.username,
  ASSET_LOCK_CODE_HASH
)
const assetLockProof = await fetchAssetLockProof(usernameHash)

const inputCells = await indexer.collect({ ... })
const outputCells = await indexer.collect({ ... })

txBuilder.pushInput(inputCells, { proof: assetLockProof })
txBuilder.pushOutput(outputCells)

txSize = txBuilder.calcTransactionSize()
const feeCells = await indexer.collect({ ... })
const changeOutput = xxxx
// payfee
txBuilder.pushInput({ fromAddress: alice, cells: feeCells })
txBuilder.pushOutput(changeOutput)

const messages = getMessages()
// some signing code...
txBuilder.setWitnesses(sigs)
const txHash = rpc.sendTransaction(txBuilder.getTransaction())
```

``` ts
// async example

txBuilder.setPlugin(makeUnipassPlugin({
  scriptConfig: {
    codeHash: BytesLike;
    hashType: BytesLike;
  },
  unipassUrl: string,
  aggregatorUrl: string,
  indexer,
}))
txBuilder.setPlugin(makeSecp256k1Plugin({
  scriptConfig: {
    codeHash: BytesLike;
    hashType: BytesLike;
  },
  indexer,
}))

await txBuilder.pushInput({ fromAddress: alice, amount: 100 })
await txBuilder.pushOutput({ Address: alice, amount: 100 })
await txBuilder.payFee({ fromAddress: alice, rate: 1000 })
const messages = getMessages()
// some signing code...
txBuilder.setWitnesses(sigs)
const txHash = rpc.sendTransaction(txBuilder.getTransaction())

```

### interface
``` ts

```