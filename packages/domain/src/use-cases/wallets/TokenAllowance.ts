import { Amount, Erc20, EvmAddress, success } from '@lens-protocol/shared-kernel';

import {
  UnsignedTransaction,
  TransactionKind,
  UserRejectedError,
  InsufficientGasError,
  Wallet,
  WalletConnectionError,
  PendingSigningRequestError,
  AnyTransactionRequestModel,
} from '../../entities';
import { ActiveWallet } from '../authentication/ActiveWallet';
import { IGenericResultPresenter } from '../transactions/IGenericResultPresenter';
import { TransactionQueue } from '../transactions/TransactionQueue';

export enum TokenAllowanceLimit {
  EXACT,
  INFINITE,
}

export type TokenAllowanceRequest = {
  amount: Amount<Erc20>;
  spender: EvmAddress;
  limit: TokenAllowanceLimit;
  kind: TransactionKind.APPROVE_MODULE;
};

export type UnsignedTokenAllowanceTransaction = UnsignedTransaction<TokenAllowanceRequest>;

export interface IApproveTransactionGateway {
  createApproveTransaction(
    request: TokenAllowanceRequest,
    wallet: Wallet,
  ): Promise<UnsignedTokenAllowanceTransaction>;
}

export type ITokenAllowancePresenter = IGenericResultPresenter<
  void,
  PendingSigningRequestError | InsufficientGasError | UserRejectedError | WalletConnectionError
>;

export class TokenAllowance {
  constructor(
    private readonly activeWallet: ActiveWallet,
    private readonly gateway: IApproveTransactionGateway,
    private readonly presenter: ITokenAllowancePresenter,
    private readonly queue: TransactionQueue<AnyTransactionRequestModel>,
  ) {}

  async increaseAllowance(request: TokenAllowanceRequest) {
    const wallet = await this.activeWallet.requireActiveWallet();

    const approveTransaction = await this.gateway.createApproveTransaction(request, wallet);

    const result = await wallet.sendTransaction(approveTransaction);

    if (result.isFailure()) {
      this.presenter.present(result);
      return;
    }

    const transaction = result.value;
    await this.queue.push(transaction);

    this.presenter.present(success());
  }
}
