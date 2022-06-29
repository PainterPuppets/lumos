## lumos/omnilock administrator mode 设计

关于omnilock [administrator mode]( https://blog.cryptape.com/omnilock-a-universal-lock-that-powers-interoperability-1#heading-administrator-mode)

omnilock administrator mode的args为
<1 byte auth flag> <20 bytes auth content> <1 byte Omnilock flags> <32 byte RC cell type ID>

该mode涉及到rce_cell/proof的生成和 administrator mode omnilock cell的解锁

## 解锁：
administrator mode有两种解锁办法

1. 按照auth flag的方法解锁，即witenessArgs中只包含signature的部分
直接使用其他p2pkh/p2sh/etc…的代码解锁就可以

2. 按照administrator's PKH/SH的方法解锁，即witenessArgs中包含omni_identity的部分

应该在suite中加入AuthByAdministrator，设计大概是这样的
```
export type TypeId = HexString;
export type Identity = HexString; // replace to codecs
export const SMT_PROOF_MASK = {
  INPUT: 0x01,
  OUTPUT: 0x02,
  BOTH: 0x03,
}
export type SmtProofMask = keyof typeof SMT_PROOF_MASK;

type SmtProof = {
  mask: SmtProofMask,
  proof: HexString,
}

export type AuthByAdministrator = AuthBy<
  "ADMINISTRATOR",
  { 
    identity: Identity,
    proofs: Array<SmtProof>,
    rcCell: ScriptConfig | TypeId,
    config: ScriptConfig,
  }
>;

```
pubkeyHash：用于填入witenessArgs中omni_identity部分的identity字段 (identity相关链接)[https://blog.cryptape.com/omnilock-a-universal-lock-that-powers-interoperability-1#heading-administrator-mode:~:text=in%20memory%20layout.-,Omnilock%20Witness,-When%20unlocking%20an]

scriptHash：用于填入witenessArgs中omni_identity部分的identity字段 (identity相关链接)[https://blog.cryptape.com/omnilock-a-universal-lock-that-powers-interoperability-1#heading-administrator-mode:~:text=in%20memory%20layout.-,Omnilock%20Witness,-When%20unlocking%20an]

proofs：用于填入witenessArgs中omni_identity部分的proofs字段

rcCell：用作在添加cellDeps，可以填入ScriptConfig或者TypeId，这里是为了寻找到匹配的rcCell,可以通过typeid或者ScriptConfig从链上获取到对应cell，这些cell将放入transaction的cell_deps中

config：omnilock script的配置

### 关于这些传参的获取：

pubkeyHash/scriptHash：由解锁用户提供

proofs：由rcCell管理者生成，因为rcCell中只包含smt的root部分，无法反推smt中有什么内容，所以无法生成proof，必须由rcCell的管理者生成

rcCell：由解锁用户提供，当用户想解锁某个omnilock的时候，必然知道该lock的addr/args,可以从中获得rcCell的typid
可以提供一个转换函数方便用户使用：
```
function convertOmnilockAddrToArgs(addr: Address): {
  omnilockFlags: OmnilockFlags;
  omnilockArgs: OmnilockArgs;
}
```

这里需要一个函数，queryRcCells，其实现大概是根据typeid找到对应的cell，查看data判断是不是一个rcCell,如果不是则报错，如果是则判断是rcRuleCell还是rcVecCell, 前者返回该cell，后者递归查询vec中包含的每一个typeid,
```
function  queryRcCells(typeid: TypeId): Array<Cells>
```


## administrator mode omnilock script的生成
想要生成administrator mode omnilock script，必须要有一个rcCell的typeid, 这里涉及到两种用例：
 - 用户自己生成rcCell并获取到typeid，生成administrator mode omnilock script
 - 用户从别人那里获取到typid，生成administrator mode omnilock script



## 生成rcCell
目前rce_cell有两种格式
```
rce_rule_cell: {
  lock: <…>
  type: <type id type script>
  data: 
     RCRule:
      <new smt root>
      <flags>
}
```
```
rce_vec_cell: {
  lock: <…>
  type: <type id type script>
  data: 
    RCCellVec:
      Array<rce_rule_cell typeid>
}
```

大概会需要如下的函数
```
// rce.ts

type RcCellData = HexString;
type Identity = HexString; // Todo: replace to codecs
type TypeId = Script;

type RcRuleflags = {
	isBlacklist?: boolean,
	isEmergency?: boolean,
}

/**
 *
 * @example
 * ``` js
 * const identity = IdentityCodec.pack({
 *   flag: "PUBKEY_HASH",
 *   content: "0x1234567812345678123456781234567812345678",
 * });
 * 
 * const rcRuleData = createRceRuleData([identity]);
 * const { txSkeleton, typeId } = await deploy.generateDeployWithTypeIdTx({
 *   cellProvider: ...,
 *   fromInfo: ...,
 *   scriptBinary: Reader(rcRuleData).toArrayBuffer()
 *   config: ...,
 * })
 * 
 * seal and send txSkeleton...
 * ```
 */
export function createRceRuleData(identities: Array<Identity>, config: RcRuleflags = {}): RcCellData

/**
 * 
 * const rcVecData = createRceVecData([typeId]);
 * const { txSkeleton, typeId } = await deploy.generateDeployWithTypeIdTx({
 *   cellProvider: ...,
 *   fromInfo: ...,
 *   scriptBinary: Reader(rcVecData).toArrayBuffer()
 *   config: ...,
 * })
 * 
 * seal and send txSkeleton...
 * ```
 */
export function createRceVecData(RceRuleCells: Array<TypeId>): RcCellData
```

## 生成proof
smt和proof相关的库：https://github.com/Daryl-L/sparse-merkle-tree-ts

因为rcCell中只包含smt的root部分，无法反推smt中有什么内容，而想生成proof必须要知道smt中的全部内容，所以rcCell的管理者必须在某处存储每个cell中的所有内容，大概会需要这样一个函数
```
/**
 *
 * @param {Array<Identity>} AllIdentities 该cell中所有的Identity
 * @param {Identity} checkIdentity 需要证明的Identity
 * @param {boolean} on 该Identity是否存在于这个cell中
 */

export function generateSingleProof(AllIdentities: Array<Identity>, checkIdentitites: Array<Identity>, on?: boolean)
```