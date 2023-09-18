import { PromiseResult } from '@lens-protocol/shared-kernel';

import type { Authentication } from '../../authentication';
import type { LensConfig } from '../../consts/config';
import { CredentialsExpiredError, NotAuthenticatedError } from '../../consts/errors';
import { FetchGraphQLClient } from '../../graphql/FetchGraphQLClient';
import {
  CreateMomokaPublicationResultFragment,
  LensProfileManagerRelayErrorFragment,
  RelaySuccessFragment,
} from '../../graphql/fragments.generated';
import { AnyPublicationFragment } from '../../graphql/types';
import type {
  HidePublicationRequest,
  LegacyCollectRequest,
  MomokaCommentRequest,
  MomokaMirrorRequest,
  MomokaPostRequest,
  MomokaQuoteRequest,
  OnchainCommentRequest,
  OnchainMirrorRequest,
  OnchainPostRequest,
  OnchainQuoteRequest,
  PublicationRequest,
  PublicationsRequest,
  PublicationsTagsRequest,
  RefreshPublicationMetadataRequest,
  RefreshPublicationMetadataResultType,
  ReportPublicationRequest,
  TypedDataOptions,
  ValidatePublicationMetadataRequest,
} from '../../graphql/types.generated';
import {
  buildImageTransformsFromConfig,
  buildPaginatedQueryResult,
  PaginatedResult,
  requireAuthHeaders,
  sdkAuthHeaderWrapper,
} from '../../helpers';
import {
  CreateLegacyCollectBroadcastItemResultFragment,
  CreateMomokaCommentBroadcastItemResultFragment,
  CreateMomokaMirrorBroadcastItemResultFragment,
  CreateMomokaPostBroadcastItemResultFragment,
  CreateMomokaQuoteBroadcastItemResultFragment,
  CreateOnchainCommentBroadcastItemResultFragment,
  CreateOnchainMirrorBroadcastItemResultFragment,
  CreateOnchainPostBroadcastItemResultFragment,
  CreateOnchainQuoteBroadcastItemResultFragment,
  getSdk,
  PublicationStatsFragment,
  PublicationValidateMetadataResultFragment,
  Sdk,
  TagResultFragment,
} from './graphql/publication.generated';
import { isMirrorPublication } from './helpers';
import { Bookmarks, Reactions, NotInterested, Actions } from './submodules';
import { PublicationStatsVariables } from './types';

/**
 * Publications are the posts, comments, mirrors and quotes that a profile creates.
 *
 * @group LensClient Modules
 */
export class Publication {
  private readonly authentication: Authentication | undefined;
  private readonly sdk: Sdk;

  constructor(
    private readonly config: LensConfig,
    authentication?: Authentication,
  ) {
    const client = new FetchGraphQLClient(config.environment.gqlEndpoint);

    this.sdk = getSdk(client, sdkAuthHeaderWrapper(authentication));
    this.authentication = authentication;
  }

  /**
   * The Bookmarks module
   */
  get bookmarks(): Bookmarks {
    return new Bookmarks(this.config, this.authentication);
  }

  /**
   * The Reactions module
   */
  get reactions(): Reactions {
    return new Reactions(this.config, this.authentication);
  }

  /**
   * The NotInterested module
   */
  get notInterested(): NotInterested {
    return new NotInterested(this.config, this.authentication);
  }

  /**
   * The Actions module
   */
  get actions(): Actions {
    return new Actions(this.config, this.authentication);
  }

  /**
   * Fetch a publication
   *
   * @param request - Request object for the query
   * @returns {@link AnyPublicationFragment} or null if not found
   *
   * @example
   * ```ts
   * const result = await client.publication.fetch({
   *   for: '0x123-0x456',
   * });
   * ```
   */
  async fetch(request: PublicationRequest): Promise<AnyPublicationFragment | null> {
    const result = await this.sdk.Publication({
      request,
      ...buildImageTransformsFromConfig(this.config.mediaTransforms),
    });

    return result.data.result;
  }

  /**
   * Fetch all publications by requested criteria
   *
   * @param request - Request object for the query
   * @returns {@link AnyPublicationFragment} wrapped in {@link PaginatedResult}
   *
   * @example
   * ```ts
   * const result = await client.publication.fetchAll({
   *   where: {
   *     from: ['0x123'],
   *   },
   * });
   * ```
   */
  async fetchAll(
    request: PublicationsRequest,
  ): Promise<PaginatedResult<AnyPublicationFragment | null>> {
    return buildPaginatedQueryResult(async (currRequest) => {
      const result = await this.sdk.Publications({
        request: currRequest,
        ...buildImageTransformsFromConfig(this.config.mediaTransforms),
      });

      return result.data.result;
    }, request);
  }

  /**
   * Fetch a publication's stats
   *
   * @param vars - Object defining all variables for the query
   * @returns {@link PublicationStatsFragment} or undefined if not found or publication is a mirror
   *
   * @example
   * ```ts
   * const result = await client.publication.stats({
   *   request: {
   *     for: '0x123',
   *   },
   * });
   * ```
   */
  async stats(vars: PublicationStatsVariables): Promise<PublicationStatsFragment | undefined> {
    const { request, statsRequest = {}, openActionsRequest = { anyOf: [] } } = vars;

    const result = await this.sdk.PublicationStats({
      request,
      statsRequest,
      openActionsRequest,
    });

    const data = result.data.result;

    if (data === null || isMirrorPublication(data)) {
      return undefined;
    }
    return data.stats;
  }

  /**
   * Fetch tags
   *
   * @param request - Request object for the query
   * @returns {@link TagResultFragment} wrapped in {@link PaginatedResult}
   *
   * @example
   * ```ts
   * const result = await client.publication.tags({});
   * ```
   */
  async tags(request: PublicationsTagsRequest): Promise<PaginatedResult<TagResultFragment>> {
    return buildPaginatedQueryResult(async (currRequest) => {
      const result = await this.sdk.PublicationsTags({
        request: currRequest,
      });

      return result.data.result;
    }, request);
  }

  /**
   * Validate a publication's metadata before creating it
   *
   * @param request - Request object for the query
   * @returns Validation result
   *
   * @example
   * ```ts
   * const result = await client.publication.validateMetadata(metadata);
   *
   * if (!result.valid) {
   *   throw new Error(`Metadata is not valid because of ${result.reason}`);
   * }
   * ```
   */
  async validateMetadata(
    request: ValidatePublicationMetadataRequest,
  ): Promise<PublicationValidateMetadataResultFragment> {
    const result = await this.sdk.ValidatePublicationMetadata({
      request,
    });

    return result.data.result;
  }

  /**
   * Refresh a publication's metadata stored by the API
   *
   * @param request - Request object for the mutation
   * @returns Refresh mutation result
   *
   * @example
   * ```ts
   * const result = await client.publication.refreshMetadata({
   *   for: '0x123-0x456',
   * });
   * ```
   */
  async refreshMetadata(
    request: RefreshPublicationMetadataRequest,
  ): Promise<RefreshPublicationMetadataResultType> {
    const result = await this.sdk.RefreshPublicationMetadata({
      request,
    });

    return result.data.result.result;
  }

  /**
   * Hide a publication
   *
   * ⚠️ Requires authenticated LensClient.
   *
   * @param request - Request object for the mutation
   * @returns {@link PromiseResult} with void
   *
   * @example
   * ```ts
   * await client.publication.hide({
   *   for: '0x014e-0x0a',
   * });
   * ```
   */
  async hide(
    request: HidePublicationRequest,
  ): PromiseResult<void, CredentialsExpiredError | NotAuthenticatedError> {
    return requireAuthHeaders(this.authentication, async (headers) => {
      await this.sdk.HidePublication({ request }, headers);
    });
  }

  /**
   * Report a publication with a reason
   *
   * ⚠️ Requires authenticated LensClient.
   *
   * @param request - Request object for the mutation
   * @returns {@link PromiseResult} with void
   *
   * @example
   * ```ts
   * import { PublicationReportingReason, PublicationReportingSpamSubreason } from '@lens-protocol/client';
   *
   * await client.publication.report({
   *   for: '0x014e-0x0a',
   *   reason: {
   *     spamReason: {
   *       reason: PublicationReportingReason.Spam,
   *       subreason: PublicationReportingSpamSubreason.FakeEngagement,
   *     },
   *   },
   *   additionalComments: 'comment',
   * });
   * ```
   */
  async report(
    request: ReportPublicationRequest,
  ): PromiseResult<void, CredentialsExpiredError | NotAuthenticatedError> {
    return requireAuthHeaders(this.authentication, async (headers) => {
      await this.sdk.ReportPublication({ request }, headers);
    });
  }

  /**
   * Create a post onchain.
   *
   * ⚠️ Requires authenticated LensClient.
   *
   * @param request - Request object for the mutation
   * @returns {@link PromiseResult} with {@link RelaySuccessFragment} or {@link LensProfileManagerRelayErrorFragment}
   *
   * @example
   * ```ts
   * const result = await client.publication.postOnchain({
   *   contentURI: 'ipfs://Qm...', // or arweave
   *   referenceModule: {
   *     followerOnlyReferenceModule: false, // anybody can comment or mirror
   *   },
   * });
   * ```
   */
  async postOnchain(
    request: OnchainPostRequest,
  ): PromiseResult<
    RelaySuccessFragment | LensProfileManagerRelayErrorFragment,
    CredentialsExpiredError | NotAuthenticatedError
  > {
    return requireAuthHeaders(this.authentication, async (headers) => {
      const result = await this.sdk.PostOnchain({ request }, headers);
      return result.data.result;
    });
  }

  /**
   * Create a comment onchain.
   *
   * ⚠️ Requires authenticated LensClient.
   *
   * @param request - Request object for the mutation
   * @returns {@link PromiseResult} with {@link RelaySuccessFragment} or {@link LensProfileManagerRelayErrorFragment}
   *
   * @example
   * ```ts
   * const result = await client.publication.commentOnchain({
   *   commentOn: '0x123-0x456',
   *   contentURI: 'ipfs://Qm...', // or arweave
   * });
   * ```
   */
  async commentOnchain(
    request: OnchainCommentRequest,
  ): PromiseResult<
    RelaySuccessFragment | LensProfileManagerRelayErrorFragment,
    CredentialsExpiredError | NotAuthenticatedError
  > {
    return requireAuthHeaders(this.authentication, async (headers) => {
      const result = await this.sdk.CommentOnchain({ request }, headers);
      return result.data.result;
    });
  }

  /**
   * Create a mirror onchain.
   *
   * ⚠️ Requires authenticated LensClient.
   *
   * @param request - Request object for the mutation
   * @returns {@link PromiseResult} with {@link RelaySuccessFragment} or {@link LensProfileManagerRelayErrorFragment}
   *
   * @example
   * ```ts
   * const result = await client.publication.mirrorOnchain({
   *   mirrorOn: '0x123-0x456',
   * });
   * ```
   */
  async mirrorOnchain(
    request: OnchainMirrorRequest,
  ): PromiseResult<
    RelaySuccessFragment | LensProfileManagerRelayErrorFragment,
    CredentialsExpiredError | NotAuthenticatedError
  > {
    return requireAuthHeaders(this.authentication, async (headers) => {
      const result = await this.sdk.MirrorOnchain({ request }, headers);
      return result.data.result;
    });
  }

  /**
   * Create a quote onchain.
   *
   * ⚠️ Requires authenticated LensClient.
   *
   * @param request - Request object for the mutation
   * @returns {@link PromiseResult} with {@link RelaySuccessFragment} or {@link LensProfileManagerRelayErrorFragment}
   *
   * @example
   * ```ts
   * const result = await client.publication.quoteOnchain({
   *   quoteOn: '0x123-0x456',
   *   contentURI: 'ipfs://Qm...', // or arweave
   * });
   * ```
   */
  async quoteOnchain(
    request: OnchainQuoteRequest,
  ): PromiseResult<
    RelaySuccessFragment | LensProfileManagerRelayErrorFragment,
    CredentialsExpiredError | NotAuthenticatedError
  > {
    return requireAuthHeaders(this.authentication, async (headers) => {
      const result = await this.sdk.QuoteOnchain({ request }, headers);
      return result.data.result;
    });
  }

  /**
   * Create a post on Momoka.
   *
   * ⚠️ Requires authenticated LensClient.
   *
   * @param request - Request object for the mutation
   * @returns {@link PromiseResult} with {@link CreateMomokaPublicationResultFragment} or {@link LensProfileManagerRelayErrorFragment}
   *
   * @example
   * ```ts
   * const result = await client.publication.postOnMomoka({
   *   contentURI: 'ipfs://Qm...', // or arweave
   * });
   * ```
   */
  async postOnMomoka(
    request: MomokaPostRequest,
  ): PromiseResult<
    CreateMomokaPublicationResultFragment | LensProfileManagerRelayErrorFragment,
    CredentialsExpiredError | NotAuthenticatedError
  > {
    return requireAuthHeaders(this.authentication, async (headers) => {
      const result = await this.sdk.PostOnMomoka({ request }, headers);
      return result.data.result;
    });
  }

  /**
   * Create a comment on Momoka.
   *
   * ⚠️ Requires authenticated LensClient.
   *
   * @param request - Request object for the mutation
   * @returns {@link PromiseResult} with {@link CreateMomokaPublicationResultFragment} or {@link LensProfileManagerRelayErrorFragment}
   *
   * @example
   * ```ts
   * const result = await client.publication.commentOnMomoka({
   *   commentOn: '0x123-0x456',
   *   contentURI: 'ipfs://Qm...', // or arweave
   * });
   * ```
   */
  async commentOnMomoka(
    request: MomokaCommentRequest,
  ): PromiseResult<
    CreateMomokaPublicationResultFragment | LensProfileManagerRelayErrorFragment,
    CredentialsExpiredError | NotAuthenticatedError
  > {
    return requireAuthHeaders(this.authentication, async (headers) => {
      const result = await this.sdk.CommentOnMomoka({ request }, headers);
      return result.data.result;
    });
  }

  /**
   * Create a mirror on Momoka.
   *
   * ⚠️ Requires authenticated LensClient.
   *
   * @param request - Request object for the mutation
   * @returns {@link PromiseResult} with {@link CreateMomokaPublicationResultFragment} or {@link LensProfileManagerRelayErrorFragment}
   *
   * @example
   * ```ts
   * const result = await client.publication.mirrorOnMomoka({
   *   mirrorOn: '0x123-0x456',
   * });
   * ```
   */
  async mirrorOnMomoka(
    request: MomokaMirrorRequest,
  ): PromiseResult<
    CreateMomokaPublicationResultFragment | LensProfileManagerRelayErrorFragment,
    CredentialsExpiredError | NotAuthenticatedError
  > {
    return requireAuthHeaders(this.authentication, async (headers) => {
      const result = await this.sdk.MirrorOnMomoka({ request }, headers);
      return result.data.result;
    });
  }

  /**
   * Create a quote on Momoka.
   *
   * ⚠️ Requires authenticated LensClient.
   *
   * @param request - Request object for the mutation
   * @returns {@link PromiseResult} with {@link CreateMomokaPublicationResultFragment} or {@link LensProfileManagerRelayErrorFragment}
   *
   * @example
   * ```ts
   * const result = await client.publication.quoteOnMomoka({
   *   quoteOn: '0x123-0x456',
   *   contentURI: 'ipfs://Qm...', // or arweave
   * });
   * ```
   */
  async quoteOnMomoka(
    request: MomokaQuoteRequest,
  ): PromiseResult<
    CreateMomokaPublicationResultFragment | LensProfileManagerRelayErrorFragment,
    CredentialsExpiredError | NotAuthenticatedError
  > {
    return requireAuthHeaders(this.authentication, async (headers) => {
      const result = await this.sdk.QuoteOnMomoka({ request }, headers);
      return result.data.result;
    });
  }

  /**
   * Fetch typed data to create a post onchain.
   *
   * Typed data has to be signed by the profile's wallet and broadcasted with {@link Transaction.broadcastOnchain}.
   *
   * ⚠️ Requires authenticated LensClient.
   *
   * @param request - Request object for the mutation
   * @param options - Configure returned typed data
   * @returns Typed data for creating a post
   *
   * @example
   * ```ts
   * const result = await client.publication.createOnchainPostTypedData({
   *   contentURI: 'ipfs://Qm...', // or arweave
   *   referenceModule: {
   *     followerOnlyReferenceModule: false, // anybody can comment or mirror
   *   },
   * });
   * ```
   */
  async createOnchainPostTypedData(
    request: OnchainPostRequest,
    options?: TypedDataOptions,
  ): PromiseResult<
    CreateOnchainPostBroadcastItemResultFragment,
    CredentialsExpiredError | NotAuthenticatedError
  > {
    return requireAuthHeaders(this.authentication, async (headers) => {
      const result = await this.sdk.CreateOnchainPostTypedData(
        {
          request,
          options,
        },
        headers,
      );

      return result.data.result;
    });
  }

  /**
   * Fetch typed data to create a comment onchain.
   *
   * Typed data has to be signed by the profile's wallet and broadcasted with {@link Transaction.broadcastOnchain}.
   *
   * ⚠️ Requires authenticated LensClient.
   *
   * @param request - Request object for the mutation
   * @param options - Configure returned typed data
   * @returns Typed data for creating a post
   *
   * @example
   * ```ts
   * const result = await client.publication.createOnchainCommentTypedData({
   *   commentOn: '0x123-0x456',
   *   contentURI: 'ipfs://Qm...', // or arweave
   * });
   * ```
   */
  async createOnchainCommentTypedData(
    request: OnchainCommentRequest,
    options?: TypedDataOptions,
  ): PromiseResult<
    CreateOnchainCommentBroadcastItemResultFragment,
    CredentialsExpiredError | NotAuthenticatedError
  > {
    return requireAuthHeaders(this.authentication, async (headers) => {
      const result = await this.sdk.CreateOnchainCommentTypedData(
        {
          request,
          options,
        },
        headers,
      );

      return result.data.result;
    });
  }

  /**
   * Fetch typed data to create a mirror onchain.
   *
   * Typed data has to be signed by the profile's wallet and broadcasted with {@link Transaction.broadcastOnchain}.
   *
   * ⚠️ Requires authenticated LensClient.
   *
   * @param request - Request object for the mutation
   * @param options - Configure returned typed data
   * @returns Typed data for creating a post
   *
   * @example
   * ```ts
   * const result = await client.publication.createOnchainMirrorTypedData({
   *   mirrorOn: '0x123-0x456',
   * });
   * ```
   */
  async createOnchainMirrorTypedData(
    request: OnchainMirrorRequest,
    options?: TypedDataOptions,
  ): PromiseResult<
    CreateOnchainMirrorBroadcastItemResultFragment,
    CredentialsExpiredError | NotAuthenticatedError
  > {
    return requireAuthHeaders(this.authentication, async (headers) => {
      const result = await this.sdk.CreateOnchainMirrorTypedData(
        {
          request,
          options,
        },
        headers,
      );

      return result.data.result;
    });
  }

  /**
   * Fetch typed data to create a quote onchain.
   *
   * Typed data has to be signed by the profile's wallet and broadcasted with {@link Transaction.broadcastOnchain}.
   *
   * ⚠️ Requires authenticated LensClient.
   *
   * @param request - Request object for the mutation
   * @param options - Configure returned typed data
   * @returns Typed data for creating a post
   *
   * @example
   * ```ts
   * const result = await client.publication.createOnchainQuoteTypedData({
   *   quoteOn: '0x123-0x456',
   *   contentURI: 'ipfs://Qm...', // or arweave
   * });
   * ```
   */
  async createOnchainQuoteTypedData(
    request: OnchainQuoteRequest,
    options?: TypedDataOptions,
  ): PromiseResult<
    CreateOnchainQuoteBroadcastItemResultFragment,
    CredentialsExpiredError | NotAuthenticatedError
  > {
    return requireAuthHeaders(this.authentication, async (headers) => {
      const result = await this.sdk.CreateOnchainQuoteTypedData(
        {
          request,
          options,
        },
        headers,
      );

      return result.data.result;
    });
  }

  /**
   * Fetch typed data to create a post on Momoka.
   *
   * Typed data has to be signed by the profile's wallet and broadcasted with {@link Transaction.broadcastOnMomoka}.
   *
   * ⚠️ Requires authenticated LensClient.
   *
   * @param request - Request object for the mutation
   * @returns Typed data for creating a post
   *
   * @example
   * ```ts
   * const result = await client.publication.createMomokaPostTypedData({
   *   contentURI: 'ipfs://Qm...', // or arweave
   * });
   * ```
   */
  async createMomokaPostTypedData(
    request: MomokaPostRequest,
  ): PromiseResult<
    CreateMomokaPostBroadcastItemResultFragment,
    CredentialsExpiredError | NotAuthenticatedError
  > {
    return requireAuthHeaders(this.authentication, async (headers) => {
      const result = await this.sdk.CreateMomokaPostTypedData(
        {
          request,
        },
        headers,
      );

      return result.data.result;
    });
  }

  /**
   * Fetch typed data to create a comment on Momoka.
   *
   * Typed data has to be signed by the profile's wallet and broadcasted with {@link Transaction.broadcastOnMomoka}.
   *
   * ⚠️ Requires authenticated LensClient.
   *
   * @param request - Request object for the mutation
   * @returns Typed data for creating a post
   *
   * @example
   * ```ts
   * const result = await client.publication.createMomokaCommentTypedData({
   *   commentOn: '0x123-0x456',
   *   contentURI: 'ipfs://Qm...', // or arweave
   * });
   * ```
   */
  async createMomokaCommentTypedData(
    request: MomokaCommentRequest,
  ): PromiseResult<
    CreateMomokaCommentBroadcastItemResultFragment,
    CredentialsExpiredError | NotAuthenticatedError
  > {
    return requireAuthHeaders(this.authentication, async (headers) => {
      const result = await this.sdk.CreateMomokaCommentTypedData(
        {
          request,
        },
        headers,
      );

      return result.data.result;
    });
  }

  /**
   * Fetch typed data to create a mirror on Momoka.
   *
   * Typed data has to be signed by the profile's wallet and broadcasted with {@link Transaction.broadcastOnMomoka}.
   *
   * ⚠️ Requires authenticated LensClient.
   *
   * @param request - Request object for the mutation
   * @returns Typed data for creating a post
   *
   * @example
   * ```ts
   * const result = await client.publication.createMomokaMirrorTypedData({
   *   mirrorOn: '0x123-0x456',
   * });
   * ```
   */
  async createMomokaMirrorTypedData(
    request: MomokaMirrorRequest,
  ): PromiseResult<
    CreateMomokaMirrorBroadcastItemResultFragment,
    CredentialsExpiredError | NotAuthenticatedError
  > {
    return requireAuthHeaders(this.authentication, async (headers) => {
      const result = await this.sdk.CreateMomokaMirrorTypedData(
        {
          request,
        },
        headers,
      );

      return result.data.result;
    });
  }

  /**
   * Fetch typed data to create a quote on Momoka.
   *
   * Typed data has to be signed by the profile's wallet and broadcasted with {@link Transaction.broadcastOnMomoka}.
   *
   * ⚠️ Requires authenticated LensClient.
   *
   * @param request - Request object for the mutation
   * @returns Typed data for creating a post
   *
   * @example
   * ```ts
   * const result = await client.publication.createMomokaQuoteTypedData({
   *   quoteOn: '0x123-0x456',
   *   contentURI: 'ipfs://Qm...', // or arweave
   * });
   * ```
   */
  async createMomokaQuoteTypedData(
    request: MomokaQuoteRequest,
  ): PromiseResult<
    CreateMomokaQuoteBroadcastItemResultFragment,
    CredentialsExpiredError | NotAuthenticatedError
  > {
    return requireAuthHeaders(this.authentication, async (headers) => {
      const result = await this.sdk.CreateMomokaQuoteTypedData(
        {
          request,
        },
        headers,
      );

      return result.data.result;
    });
  }

  /**
   * Collect a publication.
   *
   * ⚠️ Requires authenticated LensClient.
   *
   * @param request - Request object for the mutation
   * @returns {@link PromiseResult} with {@link RelaySuccessFragment} or {@link LensProfileManagerRelayErrorFragment}
   *
   * @example
   * ```ts
   * const result = await client.publication.legacyCollect({
   *   on: '0x123-0x456',
   * });
   * ```
   */
  async legacyCollect(
    request: LegacyCollectRequest,
  ): PromiseResult<
    RelaySuccessFragment | LensProfileManagerRelayErrorFragment,
    CredentialsExpiredError | NotAuthenticatedError
  > {
    return requireAuthHeaders(this.authentication, async (headers) => {
      const result = await this.sdk.LegacyCollectPublication({ request }, headers);
      return result.data.result;
    });
  }

  /**
   * Fetch typed data to collect a publication.
   *
   * Typed data has to be signed by the profile's wallet and broadcasted with {@link Transaction.broadcastOnchain}.
   *
   * ⚠️ Requires authenticated LensClient.
   *
   * @param request - Request object for the mutation
   * @param options - Configure returned typed data
   * @returns Typed data for collecting a publication
   *
   * @example
   * ```ts
   * const result = await client.publication.createLegacyCollectTypedData({
   *   on: '0x123-0x456',
   * });
   * ```
   */
  async createLegacyCollectTypedData(
    request: LegacyCollectRequest,
    options?: TypedDataOptions,
  ): PromiseResult<
    CreateLegacyCollectBroadcastItemResultFragment,
    CredentialsExpiredError | NotAuthenticatedError
  > {
    return requireAuthHeaders(this.authentication, async (headers) => {
      const result = await this.sdk.CreateLegacyCollectTypedData(
        {
          request,
          options,
        },
        headers,
      );

      return result.data.result;
    });
  }
}
