import { faker } from '@faker-js/faker';
import { ChainType, Result } from '@lens-protocol/shared-kernel';
import { mockEvmAddress, mockDaiAmount, mockUsdcAmount } from '@lens-protocol/shared-kernel/mocks';
import { mock } from 'jest-mock-extended';
import { when } from 'jest-when';

import { TransactionKind, NftOwnershipChallenge, NativeTransaction } from '../../../entities';
import { mockProfileId, mockSignature } from '../../../entities/__helpers__/mocks';
import { BroadcastingError } from '../../transactions';
import {
  CreateProfileRequest,
  DuplicatedHandleError,
  IProfileTransactionGateway,
} from '../CreateProfile';
import {
  UnconstrainedFollowRequest,
  PaidFollowRequest,
  ProfileOwnerFollowRequest,
} from '../FollowProfiles';
import {
  INftOwnershipChallengeGateway,
  NftOwnershipSignature,
  ProveNftOwnershipRequest,
} from '../ProveNftOwnership';
import { UnfollowRequest } from '../UnfollowProfile';
import { UpdateDispatcherConfigRequest } from '../UpdateDispatcherConfig';
import { UpdateFollowPolicyRequest } from '../UpdateFollowPolicy';
import { UpdateProfileDetailsRequest } from '../UpdateProfileDetails';
import {
  UpdateNftProfileImageRequest,
  UpdateOffChainProfileImageRequest,
} from '../UpdateProfileImage';
import { ChargeFollowConfig, FollowPolicyType, NoFeeFollowConfig } from '../types';

export function mockCreateProfileRequest(
  overrides?: Partial<CreateProfileRequest>,
): CreateProfileRequest {
  return {
    handle: faker.internet.userName(),
    ...overrides,
    kind: TransactionKind.CREATE_PROFILE,
  };
}

export function mockIProfileTransactionGateway({
  request,
  result,
}: {
  request: CreateProfileRequest;
  result: Result<
    NativeTransaction<CreateProfileRequest>,
    DuplicatedHandleError | BroadcastingError
  >;
}) {
  const profileTransactionGateway = mock<IProfileTransactionGateway>();

  when(profileTransactionGateway.createProfileTransaction)
    .calledWith(request)
    .mockResolvedValue(result);

  return profileTransactionGateway;
}

export function mockChargeFollowConfig(
  overrides?: Partial<ChargeFollowConfig>,
): ChargeFollowConfig {
  return {
    amount: mockUsdcAmount(42),
    recipient: mockEvmAddress(),
    ...overrides,
    type: FollowPolicyType.CHARGE,
  };
}

export function mockNoFeeFollowConfig(overrides?: Partial<NoFeeFollowConfig>): NoFeeFollowConfig {
  return {
    type: FollowPolicyType.ANYONE,
    ...overrides,
  };
}

export function mockUpdateFollowPolicyRequest(
  overrides?: Partial<UpdateFollowPolicyRequest>,
): UpdateFollowPolicyRequest {
  return {
    profileId: mockProfileId(),
    policy: mockChargeFollowConfig(),
    ...overrides,
    kind: TransactionKind.UPDATE_FOLLOW_POLICY,
  };
}

export function mockUpdateProfileDetailsRequest(
  overrides?: Partial<UpdateProfileDetailsRequest>,
): UpdateProfileDetailsRequest {
  return {
    attributes: {},
    bio: faker.lorem.sentence(),
    coverPicture: faker.image.imageUrl(),
    name: faker.name.firstName(),
    profileId: mockProfileId(),
    delegate: true,
    ...overrides,
    kind: TransactionKind.UPDATE_PROFILE_DETAILS,
  };
}

export function mockUpdateDispatcherConfigRequest(
  overrides?: Partial<UpdateDispatcherConfigRequest>,
): UpdateDispatcherConfigRequest {
  return {
    profileId: mockProfileId(),
    enabled: true,
    ...overrides,
    kind: TransactionKind.UPDATE_DISPATCHER_CONFIG,
  };
}

export function mockUnconstrainedFollowRequest(
  overrides?: Partial<UnconstrainedFollowRequest>,
): UnconstrainedFollowRequest {
  return {
    followerAddress: mockEvmAddress(),
    profileId: mockProfileId(),
    ...overrides,
    kind: TransactionKind.FOLLOW_PROFILES,
  };
}

export function mockPaidFollowRequest(): PaidFollowRequest {
  return {
    followerAddress: mockEvmAddress(),
    profileId: mockProfileId(),
    fee: {
      amount: mockDaiAmount(1, ChainType.POLYGON),
      contractAddress: mockEvmAddress(),
      recipient: mockEvmAddress(),
    },
    kind: TransactionKind.FOLLOW_PROFILES,
  };
}

export function mockProfileOwnerFollowRequest(): ProfileOwnerFollowRequest {
  return {
    followerAddress: mockEvmAddress(),
    profileId: mockProfileId(),
    followerProfileId: mockProfileId(),
    kind: TransactionKind.FOLLOW_PROFILES,
  };
}

export function mockUnfollowRequest(overrides?: Partial<UnfollowRequest>): UnfollowRequest {
  return {
    profileId: mockProfileId(),
    ...overrides,
    kind: TransactionKind.UNFOLLOW_PROFILE,
  };
}

export function mockProveNftOwnershipRequest(): ProveNftOwnershipRequest {
  return {
    contractAddress: mockEvmAddress(),
    chainId: faker.datatype.number(),
    ownerAddress: mockEvmAddress(),
    tokenId: faker.datatype.uuid(),
  };
}

export function mockNftOwnershipSignature(
  overrides?: Partial<NftOwnershipSignature>,
): NftOwnershipSignature {
  return {
    id: faker.datatype.uuid(),
    signature: mockSignature(),
    ...overrides,
  };
}

export function mockINftOwnershipChallengeGateway({
  request,
  result,
}: {
  request: ProveNftOwnershipRequest;
  result: NftOwnershipChallenge;
}): INftOwnershipChallengeGateway {
  const gateway = mock<INftOwnershipChallengeGateway>();

  when(gateway.createOwnershipChallenge).calledWith(request).mockResolvedValue(result);

  return gateway;
}

export function mockUpdateNftProfileImageRequest(
  overrides?: Partial<UpdateNftProfileImageRequest>,
): UpdateNftProfileImageRequest {
  return {
    profileId: mockProfileId(),
    delegate: true,
    signature: mockNftOwnershipSignature(),
    ...overrides,
    kind: TransactionKind.UPDATE_PROFILE_IMAGE,
  };
}

export function mockUpdateOffChainProfileImageRequest(
  overrides?: Partial<UpdateOffChainProfileImageRequest>,
): UpdateOffChainProfileImageRequest {
  return {
    profileId: mockProfileId(),
    url: faker.image.imageUrl(),
    delegate: true,
    ...overrides,
    kind: TransactionKind.UPDATE_PROFILE_IMAGE,
  };
}
