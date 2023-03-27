import { ProfileAttributeReader, Profile, FragmentProfile } from '@lens-protocol/api-bindings';
import {
  createMockApolloClientWithMultipleResponses,
  createGetProfileMockedResponse,
  mockProfileFragment,
  mockSources,
} from '@lens-protocol/api-bindings/mocks';
import {
  mockUpdateProfileDetailsRequest,
  mockBroadcastedTransactionData,
  mockPendingTransactionData,
} from '@lens-protocol/domain/mocks';
import { UpdateProfileDetailsRequest } from '@lens-protocol/domain/use-cases/profile';
import { TransactionData } from '@lens-protocol/domain/use-cases/transactions';

import { ProfileCacheManager } from '../../../infrastructure/ProfileCacheManager';
import { UpdateProfileMetadataResponder } from '../UpdateProfileMetadataResponder';

function setupUpdateProfileMetadataResponder({
  transactionData,
  existingProfile,
  updatedProfile = mockProfileFragment(),
}: {
  transactionData: TransactionData<UpdateProfileDetailsRequest>;
  existingProfile: Profile | null;
  updatedProfile?: Profile;
}) {
  const sources = mockSources();
  const apolloClient = createMockApolloClientWithMultipleResponses([
    createGetProfileMockedResponse({
      profile: updatedProfile,
      variables: {
        request: { profileId: updatedProfile.id },
        sources,
      },
    }),
  ]);

  const profileIdentifier = apolloClient.cache.identify({
    __typename: 'Profile',
    id: transactionData.request.profileId,
  });

  apolloClient.cache.writeFragment({
    id: profileIdentifier,
    fragment: FragmentProfile,
    fragmentName: 'Profile',
    data: existingProfile,
  });

  const profileCacheManager = new ProfileCacheManager(apolloClient, sources);
  const responder = new UpdateProfileMetadataResponder(profileCacheManager);

  return {
    responder,

    get profileFromCache() {
      return apolloClient.cache.readFragment({
        id: profileIdentifier,
        fragmentName: 'Profile',
        fragment: FragmentProfile,
      });
    },
  };
}

describe(`Given the ${UpdateProfileMetadataResponder.name}`, () => {
  const request = mockUpdateProfileDetailsRequest({
    attributes: {
      foo: 42,
    },
  });
  const pendingTransactionData = mockPendingTransactionData({ request });

  describe(`when "${UpdateProfileMetadataResponder.prototype.prepare.name}" method is invoked with PendingTransactionData<UpdateProfileDetailsRequest>`, () => {
    it(`should update the correct Profile in the Apollo Cache`, async () => {
      const existingProfile = mockProfileFragment({ id: request.profileId });
      const scenario = setupUpdateProfileMetadataResponder({
        existingProfile,
        transactionData: pendingTransactionData,
      });

      await scenario.responder.prepare(pendingTransactionData);

      expect(scenario.profileFromCache).toMatchObject({
        name: request.name,
        bio: request.bio,
        attributes: {
          foo: expect.any(ProfileAttributeReader),
        },
      });
    });

    it('should act robustly in case of empty cache entry', async () => {
      const existingProfile = null;
      const scenario = setupUpdateProfileMetadataResponder({
        existingProfile,
        transactionData: pendingTransactionData,
      });

      await scenario.responder.prepare(pendingTransactionData);

      expect(scenario.profileFromCache).toEqual({});
    });
  });

  describe(`when "${UpdateProfileMetadataResponder.prototype.rollback.name}" method is invoked with TransactionData<UpdateProfileDetailsRequest>`, () => {
    it(`should revert the previous changes to the correct Profile in the Apollo Cache`, async () => {
      const existingProfile = mockProfileFragment({ id: request.profileId });
      const scenario = setupUpdateProfileMetadataResponder({
        existingProfile,
        transactionData: pendingTransactionData,
      });
      await scenario.responder.prepare(pendingTransactionData);

      await scenario.responder.rollback(pendingTransactionData);

      expect(scenario.profileFromCache).toEqual(existingProfile);
    });

    it('should act robustly in case of empty cache entry', async () => {
      const existingProfile = null;
      const scenario = setupUpdateProfileMetadataResponder({
        existingProfile,
        transactionData: pendingTransactionData,
      });
      await scenario.responder.prepare(pendingTransactionData);

      await scenario.responder.rollback(pendingTransactionData);

      expect(scenario.profileFromCache).toEqual({});
    });
  });

  describe(`when "${UpdateProfileMetadataResponder.prototype.commit.name}" method is invoked with BroadcastedTransactionData<UpdateProfileDetailsRequest>`, () => {
    const transactionData = mockBroadcastedTransactionData({ request });

    it(`should confirm the cache changes on the correct Profile with fresh data from the server`, async () => {
      const existingProfile = mockProfileFragment({ id: request.profileId });
      const updatedProfile = mockProfileFragment({ id: request.profileId });
      const scenario = setupUpdateProfileMetadataResponder({
        existingProfile,
        transactionData,
        updatedProfile,
      });
      await scenario.responder.prepare(transactionData);

      await scenario.responder.commit(transactionData);

      expect(scenario.profileFromCache).toEqual(updatedProfile);
    });

    it('should clear any previous profile snapshot for the given request', async () => {
      const existingProfile = mockProfileFragment({ id: request.profileId });
      const updatedProfile = mockProfileFragment({ id: request.profileId });
      const scenario = setupUpdateProfileMetadataResponder({
        existingProfile,
        transactionData,
        updatedProfile,
      });

      await scenario.responder.prepare(transactionData);
      await scenario.responder.commit(transactionData);
      // although it's not a real use case to call "rollback" after "commit", to prove
      // the responder is clearing its internal state correctly, we test it here.
      await scenario.responder.rollback(transactionData);

      expect(scenario.profileFromCache).toEqual(updatedProfile);
    });
  });
});
