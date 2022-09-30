import {
  Address,
  Script,
  HexString,
  TransactionWithStatus,
} from "@ckb-lumos/base";
import { BI, BIish } from "@ckb-lumos/bi";
import { GENESIS_CELL_PRIVATEKEYS } from "./constants";
import { asyncSleep } from "./utils";
import { FaucetQueue, MockFaucetQueue } from "./faucetQueue";
import { encodeToAddress } from "@ckb-lumos/helpers";

type LockScriptLike = Address | Script;
interface ClaimTask {
  claimer: LockScriptLike;
  amount: BI;
  onClaimed: (txHash: string) => unknown;
  onError: (error: Error) => unknown;
}

interface CKBOprationProvider {
  transferCKB(options: {
    to: Address;
    fromPk: HexString;
    amount: BIish;
  }): Promise<string>;

  waitTransactionCommitted(txHash: string): Promise<TransactionWithStatus>;
}

export class FaucetProvider {
  private running = false;

  private queue: FaucetQueue;
  private claimQueue: ClaimTask[] = [];

  constructor(
    protected ckbOprationProvider: CKBOprationProvider,
    options: {
      queue?: FaucetQueue;
      genesisCellPks?: Array<string>;
    } = {}
  ) {
    const {
      queue = new MockFaucetQueue(),
      genesisCellPks = GENESIS_CELL_PRIVATEKEYS,
    } = options;
    this.queue = queue;
    this.queue.initialKeys(genesisCellPks);
    this.start();
  }

  private async getNext() {
    const task = this.claimQueue.shift();

    if (!task) {
      return undefined;
    }

    const idlePk = await this.queue.popIdleKey();

    return {
      privateKey: idlePk,
      task,
    };
  }

  async start(): Promise<void> {
    this.running = true;

    while (this.running) {
      const next = await this.getNext();
      if (!next) {
        await asyncSleep(1000);
        continue;
      }

      const txHash = await this.ckbOprationProvider
        .transferCKB({
          to:
            typeof next.task.claimer === "string"
              ? next.task.claimer
              : encodeToAddress(next.task.claimer),
          fromPk: next.privateKey,
          amount: next.task.amount,
        })
        .catch((err) => {
          next.task.onError(err);
          throw err;
        });
      next.task.onClaimed(txHash);

      this.ckbOprationProvider.waitTransactionCommitted(txHash).then(() => {
        this.queue.releaseKey(next.privateKey);
      });
    }
  }

  end(): void {
    this.running = false;
  }

  claimCKB(claimer: LockScriptLike, amount?: BI): Promise<string> {
    return new Promise((res, rej) => {
      this.claimQueue.push({
        claimer,
        amount: amount || BI.from(1000 * 10 ** 8),
        onClaimed: (txHash: string) => res(txHash),
        onError: (error: Error) => rej(error),
      });
    });
  }
}
