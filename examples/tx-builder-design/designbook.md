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
