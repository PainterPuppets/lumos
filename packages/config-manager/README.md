# @painterpuppets-lumos/config-manager

## Example

```ts
import { initializeConfig, predefined } from '@painterpuppets-lumos/config';
import { generateAddress } from '@painterpuppets-lumos/helper'

initializeConfig(predefined.AGGRON);
generateAddress({...}) // ckt1...


initializeConfig(predefined.LINA);
generateAddress({...}) // ckb1...
```
