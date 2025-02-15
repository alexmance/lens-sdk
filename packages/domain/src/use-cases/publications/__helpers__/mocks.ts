import { faker } from '@faker-js/faker';
import { ChainType } from '@lens-protocol/shared-kernel';
import { mockDaiAmount, mockEvmAddress, mockUsdcAmount } from '@lens-protocol/shared-kernel/mocks';

import { ReportReason, TransactionKind } from '../../../entities';
import { mockProfileId, mockPublicationId } from '../../../entities/__helpers__/mocks';
import { CollectType, FreeCollectRequest, PaidCollectRequest } from '../CollectPublication';
import { CreateCommentRequest } from '../CreateComment';
import { CreateMirrorRequest } from '../CreateMirror';
import { CreatePostRequest } from '../CreatePost';
import { HidePublicationRequest } from '../HidePublication';
import { ReferencePolicyType } from '../ReferencePolicyConfig';
import { ReportPublicationRequest } from '../ReportPublication';
import { TogglePropertyRequest } from '../ToggleProperty';
import { ImageType } from '../config';
import {
  ChargeCollectPolicyConfig,
  CollectPolicyType,
  ContentFocus,
  FreeCollectPolicyConfig,
  MediaObject,
  MetadataAttribute,
  MetadataAttributeDisplayType,
  MetadataImage,
  NftMetadata,
  NoCollectPolicyConfig,
  SimpleChargeCollectPolicyConfig,
} from '../types';

export function mockCreateCommentRequest(
  overrides?: Partial<CreateCommentRequest>,
): CreateCommentRequest {
  return {
    kind: TransactionKind.CREATE_COMMENT,

    contentFocus: ContentFocus.TEXT_ONLY,
    publicationId: mockPublicationId(),
    content: faker.lorem.paragraph(),
    reference: {
      type: ReferencePolicyType.ANYONE,
    },
    collect: {
      type: CollectPolicyType.NO_COLLECT,
    },
    profileId: mockProfileId(),
    delegate: false,
    locale: 'en',
    offChain: true,

    ...overrides,
  } as CreateCommentRequest;
}

export function mockMediaObject(overrides?: Partial<MediaObject>): MediaObject {
  return {
    url: faker.image.imageUrl(),
    mimeType: ImageType.JPEG,
    ...overrides,
  };
}

export function mockMetadataImage(overrides?: Partial<MetadataImage>): MetadataImage {
  return {
    url: faker.image.imageUrl(),
    mimeType: ImageType.JPEG,
    ...overrides,
  };
}

export function mockDateMetadataAttribute(): MetadataAttribute {
  return {
    displayType: MetadataAttributeDisplayType.Date,
    traitType: faker.lorem.word(),
    value: faker.date.past(),
  };
}

export function mockNumberMetadataAttribute(): MetadataAttribute {
  return {
    displayType: MetadataAttributeDisplayType.Number,
    traitType: faker.lorem.word(),
    value: faker.datatype.number(),
  };
}

export function mockStringMetadataAttribute(): MetadataAttribute {
  return {
    displayType: MetadataAttributeDisplayType.String,
    traitType: faker.lorem.word(),
    value: faker.lorem.word(),
  };
}

export function mockNftMetadata(overrides?: Partial<NftMetadata>): NftMetadata {
  return {
    name: faker.lorem.words(),
    attributes: [],
    ...overrides,
  };
}

export function mockNoCollectPolicyConfig(): NoCollectPolicyConfig {
  return {
    type: CollectPolicyType.NO_COLLECT,
  };
}

export function mockFreeCollectPolicyConfig(
  overrides?: Partial<FreeCollectPolicyConfig>,
): FreeCollectPolicyConfig {
  return {
    metadata: mockNftMetadata(),
    followersOnly: true,
    type: CollectPolicyType.FREE,
    ...overrides,
  };
}

export function mockChargeCollectPolicyConfig(
  overrides?: Partial<ChargeCollectPolicyConfig>,
): SimpleChargeCollectPolicyConfig {
  return {
    type: CollectPolicyType.CHARGE,
    fee: mockUsdcAmount(42),
    followersOnly: false,
    metadata: mockNftMetadata(),
    mirrorReward: faker.datatype.float({
      min: 0,
      max: 100,
      precision: 0.01,
    }),
    recipient: mockEvmAddress(),
    timeLimited: false,
    ...overrides,
  };
}

export function mockCreateMirrorRequest(
  overrides?: Partial<CreateMirrorRequest>,
): CreateMirrorRequest {
  return {
    kind: TransactionKind.MIRROR_PUBLICATION,

    profileId: mockProfileId(),
    publicationId: mockPublicationId(),
    delegate: false,
    offChain: false,

    ...overrides,
  };
}

export function mockCreatePostRequest(overrides?: Partial<CreatePostRequest>): CreatePostRequest {
  return {
    kind: TransactionKind.CREATE_POST,

    contentFocus: ContentFocus.TEXT_ONLY,
    content: faker.lorem.paragraph(),
    reference: {
      type: ReferencePolicyType.ANYONE,
    },
    collect: {
      type: CollectPolicyType.NO_COLLECT,
    },
    profileId: mockProfileId(),
    delegate: false,
    locale: 'en',
    offChain: false,

    ...overrides,
  } as CreatePostRequest;
}

export function mockTogglePropertyRequest(
  overrides?: Partial<TogglePropertyRequest>,
): TogglePropertyRequest {
  return {
    profileId: mockProfileId(),
    publicationId: mockPublicationId(),
    ...overrides,
  };
}

export function mockHidePublicationRequest(
  overrides?: Partial<HidePublicationRequest>,
): HidePublicationRequest {
  return {
    publicationId: mockPublicationId(),
    ...overrides,
  };
}

export function mockFreeCollectRequest(
  overrides?: Partial<FreeCollectRequest>,
): FreeCollectRequest {
  return {
    profileId: mockProfileId(),
    type: CollectType.FREE,
    publicationId: mockPublicationId(),
    followerOnly: false,
    ...overrides,
    kind: TransactionKind.COLLECT_PUBLICATION,
  };
}

export function mockPaidCollectRequest(
  overrides?: Partial<PaidCollectRequest>,
): PaidCollectRequest {
  return {
    profileId: mockProfileId(),
    type: CollectType.PAID,
    publicationId: mockPublicationId(),
    fee: {
      amount: mockDaiAmount(1, ChainType.POLYGON),
      contractAddress: mockEvmAddress(),
    },
    ...overrides,
    kind: TransactionKind.COLLECT_PUBLICATION,
  };
}

export function mockReportPublicationRequest(
  overrides?: Partial<ReportPublicationRequest>,
): ReportPublicationRequest {
  return {
    publicationId: mockPublicationId(),
    reason: ReportReason.FAKE_ENGAGEMENT,
    additionalComments: faker.lorem.sentence(),
    ...overrides,
  };
}
