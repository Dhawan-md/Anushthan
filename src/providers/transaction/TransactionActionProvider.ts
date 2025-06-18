import { Service } from "typedi";
import { Repository } from "typeorm";
import { Transaction } from "../../entities/Transaction";
import { RepositoryFactory } from "../../factories/RepositoryFactory";
import {
  TransactionStatus,
  TransactionType,
  UserRole,
} from "../../utils/enums";

@Service()
export class TransactionActionProvider {
  private transactionActionRepository: Repository<Transaction>;

  constructor(private repositoryFactory: RepositoryFactory) {
    this.transactionActionRepository =
      this.repositoryFactory.getRepository(Transaction);
  }

  async createTransaction({
    userId,
    userRole,
    bookingId,
    amount,
  }: {
    userId: string;
    userRole: UserRole;
    bookingId: string;
    amount: number;
  }): Promise<Transaction> {
    const transaction = this.transactionActionRepository.create({
      userId,
      userRole,
      bookingId,
      amount,
      type: TransactionType.PAYMENT,
      status: TransactionStatus.PENDING,
    });

    return await this.transactionActionRepository.save(transaction);
  }
}
