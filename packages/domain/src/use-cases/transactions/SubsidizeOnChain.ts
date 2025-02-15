import { PromiseResult } from '@lens-protocol/shared-kernel';

import {
  IUnsignedProtocolCall,
  Nonce,
  TransactionKind,
  ISignedProtocolCall,
  AnyTransactionRequestModel,
  MetaTransaction,
  PendingSigningRequestError,
  UserRejectedError,
  WalletConnectionError,
  ProtocolTransactionRequestModel,
  TransactionError,
} from '../../entities';
import { ActiveWallet } from '../authentication/ActiveWallet';
import { BroadcastingError } from './BroadcastingError';
import { ISignedOperation } from './DelegableSigning';
import { ITransactionResultPresenter } from './ITransactionResultPresenter';
import { TransactionQueue } from './TransactionQueue';

export interface IMetaTransactionNonceGateway {
  getNextMetaTransactionNonceFor(kind: TransactionKind): Promise<Nonce | undefined>;
}

export interface IOnChainRelayer<T extends ProtocolTransactionRequestModel> {
  relayProtocolCall(
    signedCall: ISignedProtocolCall<T>,
  ): PromiseResult<MetaTransaction<T>, BroadcastingError>;
}

export interface IOnChainProtocolCallGateway<T extends ProtocolTransactionRequestModel> {
  createUnsignedProtocolCall(request: T, nonceOverride?: Nonce): Promise<IUnsignedProtocolCall<T>>;
}

export type ISubsidizeOnChainPresenter<T extends ProtocolTransactionRequestModel> =
  ITransactionResultPresenter<
    T,
    | BroadcastingError
    | PendingSigningRequestError
    | UserRejectedError
    | WalletConnectionError
    | TransactionError
  >;

export class SubsidizeOnChain<T extends ProtocolTransactionRequestModel>
  implements ISignedOperation<T>
{
  constructor(
    protected readonly activeWallet: ActiveWallet,
    protected readonly metaTransactionNonceGateway: IMetaTransactionNonceGateway,
    protected readonly onChainProtocolCallGateway: IOnChainProtocolCallGateway<T>,
    protected readonly relayer: IOnChainRelayer<T>,
    protected readonly transactionQueue: TransactionQueue<AnyTransactionRequestModel>,
    protected readonly presenter: ISubsidizeOnChainPresenter<T>,
  ) {}

  async execute(request: T) {
    const wallet = await this.activeWallet.requireActiveWallet();

    const nonce = await this.metaTransactionNonceGateway.getNextMetaTransactionNonceFor(
      request.kind,
    );

    const unsignedCall = await this.onChainProtocolCallGateway.createUnsignedProtocolCall(
      request,
      nonce,
    );

    const signingResult = await wallet.signProtocolCall(unsignedCall);

    if (signingResult.isFailure()) {
      this.presenter.present(signingResult);
      return;
    }

    const relayResult = await this.relayer.relayProtocolCall(signingResult.value);

    if (relayResult.isFailure()) {
      this.presenter.present(relayResult);
      return;
    }

    const transaction = relayResult.value;
    await this.transactionQueue.push(transaction, this.presenter);
  }
}
