import { TransactionRequest } from '@ethersproject/providers';
import { faker } from '@faker-js/faker';
import { TypedData } from '@lens-protocol/blockchain-bindings';
import {
  AnyTransactionRequestModel,
  ProtocolTransactionRequestModel,
  UnsignedTransaction,
  WalletConnectionError,
} from '@lens-protocol/domain/entities';
import {
  mockAnyTransactionRequestModel,
  mockPollId,
  mockSignature,
} from '@lens-protocol/domain/mocks';
import { ChainType, EvmAddress, Result } from '@lens-protocol/shared-kernel';
import { mockEvmAddress } from '@lens-protocol/shared-kernel/mocks';
import { providers } from 'ethers';
import { mock } from 'jest-mock-extended';
import { when } from 'jest-when';

import { ITransactionFactory } from '../../../transactions/adapters/ITransactionFactory';
import {
  mockSelfFundedProtocolTransactionRequest,
  mockTypedData,
} from '../../../transactions/adapters/__helpers__/mocks';
import {
  ConcreteWallet,
  ISignerFactory,
  ITransactionRequest,
  SignedVote,
  UnsignedProtocolCall,
} from '../ConcreteWallet';
import { IProviderFactory } from '../IProviderFactory';

export function mockConcreteWallet() {
  return ConcreteWallet.create(
    mockEvmAddress(),
    mock<ISignerFactory>(),
    mock<ITransactionFactory<AnyTransactionRequestModel>>(),
  );
}

class ErrorWithCode<T extends number | string> extends Error {
  name = 'ErrorWithCode' as const;

  constructor(readonly code: T) {
    super();
  }
}

export function mockErrorWithCode<T extends number | string>(code: T) {
  return new ErrorWithCode(code);
}

export function mockUnsignedProtocolCall<T extends ProtocolTransactionRequestModel>({
  typedData,
  request,
}: {
  typedData: TypedData;
  request: T;
}) {
  return UnsignedProtocolCall.create({
    id: faker.datatype.uuid(),
    request,
    typedData,
    fallback: mockSelfFundedProtocolTransactionRequest<T>(),
  });
}

class MockedUnsignedTransactionRequest<T extends AnyTransactionRequestModel>
  extends UnsignedTransaction<T>
  implements ITransactionRequest
{
  constructor(chainType: ChainType, request: T, readonly transactionRequest: TransactionRequest) {
    super(faker.datatype.uuid(), chainType, request);
  }
}

export function mockUnsignedTransactionRequest({
  chainType,
  txRequest,
}: {
  chainType: ChainType;
  txRequest: TransactionRequest;
}) {
  return new MockedUnsignedTransactionRequest(
    chainType,
    mockAnyTransactionRequestModel(),
    txRequest,
  );
}

type MockedISignerFactoryConfig = {
  address: EvmAddress;
  chainType?: ChainType;
  signerResult: Result<providers.JsonRpcSigner, WalletConnectionError>;
};

export function mockISignerFactory({
  signerResult,
  ...config
}: MockedISignerFactoryConfig): ISignerFactory {
  const factory = mock<ISignerFactory>();

  when(factory.createSigner)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    .calledWith(expect.objectContaining(config))
    .mockResolvedValue(signerResult);

  return factory;
}

export function mockSignedVote(): SignedVote {
  return new SignedVote(mockPollId(), mockSignature(), mockTypedData(), mockEvmAddress());
}

type MockedIProviderFactoryConfig = {
  chainType: ChainType;
  provider: providers.JsonRpcProvider;
};

export function mockIProviderFactory({
  chainType,
  provider,
}: MockedIProviderFactoryConfig): IProviderFactory {
  const factory = mock<IProviderFactory>();

  when(factory.createProvider)
    .calledWith(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      expect.objectContaining({ chainType }),
    )
    .mockResolvedValue(provider);

  return factory;
}
