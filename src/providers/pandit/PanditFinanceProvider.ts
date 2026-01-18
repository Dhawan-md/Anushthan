import { Service } from "typedi";
import { EntityManager } from "typeorm";

import { PanditLedger } from "../../entities/PanditLedger";
import { PanditWallet } from "../../entities/PanditWallet";

import { PanditLedgerStatus, PanditLedgerType } from "../../utils/enums";

type ApplyLedgerEntryParams = {
  panditId: string;
  type: PanditLedgerType;
  amount: number; // signed: +earning, -penalty, -payout
  bookingId?: string;
  transactionId?: string;
  note?: string;

  // Optional for later idempotency; you can ignore for now
  referenceKey?: string;

  manager: EntityManager;
};

@Service()
export class PanditFinanceProvider {
  constructor() {}

  async applyLedgerEntry(
    params: ApplyLedgerEntryParams
  ): Promise<PanditLedger> {
    const {
      panditId,
      type,
      amount,
      bookingId,
      transactionId,
      note,
      referenceKey,
      manager,
    } = params;

    // 🔥 USE TRANSACTIONAL REPOSITORIES
    const walletRepo = manager.getRepository(PanditWallet);
    const ledgerRepo = manager.getRepository(PanditLedger);

    // 1) Ensure wallet exists
    let wallet = await walletRepo.findOne({ where: { panditId } });
    if (!wallet) {
      wallet = await walletRepo.save(
        walletRepo.create({
          panditId,
          totalEarnings: 0,
          totalPenalties: 0,
          netPending: 0,
        })
      );
    }

    // 2) Idempotency (temporary dedupe)
    if (bookingId) {
      const existing = await ledgerRepo.findOne({
        where: {
          panditId,
          bookingId,
          type,
          status: PanditLedgerStatus.POSTED,
        },
      });

      if (existing) return existing;
    }

    // 3) Create ledger entry
    const ledger = ledgerRepo.create({
      panditId,
      bookingId,
      transactionId,
      type,
      amount,
      status: PanditLedgerStatus.POSTED,
      note,
      referenceKey, // now properly enforced
    });

    const savedLedger = await ledgerRepo.save(ledger);

    // 4) Update wallet totals
    if (type === PanditLedgerType.EARNING && amount > 0) {
      wallet.totalEarnings += amount;
      wallet.netPending += amount;
    } else if (type === PanditLedgerType.PENALTY && amount < 0) {
      wallet.totalPenalties += Math.abs(amount);
      wallet.netPending += amount;
    } else if (type === PanditLedgerType.PAYOUT && amount < 0) {
      wallet.netPending += amount;
    } else {
      wallet.netPending += amount;
    }

    await walletRepo.save(wallet);

    return savedLedger;
  }
}
