import { MockedResponse } from '@apollo/client/testing';
import { faker } from '@faker-js/faker';

import { Cursor } from '../Cursor';
import {
  PaginatedResultInfo,
  Profile,
  ProfilesData,
  ProfilesDocument,
  ProfilesVariables,
  PublicationData,
  PublicationDocument,
  PublicationVariables,
  PublicationsData,
  PublicationsDocument,
  PublicationsVariables,
  SearchProfilesData,
  SearchProfilesDocument,
  SearchProfilesVariables,
  SearchPublicationsData,
  SearchPublicationsDocument,
  SearchPublicationsVariables,
} from '../graphql/generated';
import { AnyPublication, PrimaryPublication } from '../utils';
import { mockPaginatedResultInfo } from './fragments';

export function mockCursor(): Cursor {
  return faker.random.alphaNumeric(10) as Cursor;
}

export function mockPublicationResponse({
  variables,
  publication,
}: {
  variables: PublicationVariables;
  publication: AnyPublication | null;
}): MockedResponse<PublicationData> {
  return {
    request: {
      query: PublicationDocument,
      variables,
    },
    result: {
      data: {
        result: publication,
      },
    },
  };
}

export function mockPublicationsResponse({
  variables,
  publications,
  info = mockPaginatedResultInfo(),
}: {
  variables: PublicationsVariables;
  publications: Array<AnyPublication>;
  info?: PaginatedResultInfo;
}): MockedResponse<PublicationsData> {
  return {
    request: {
      query: PublicationsDocument,
      variables: {
        publicationImageTransform: {},
        publicationOperationsActedArgs: {},
        publicationStatsInput: {},
        publicationStatsCountOpenActionArgs: {},
        profileCoverTransform: {},
        profilePictureTransform: {},
        profileStatsArg: {},
        profileStatsCountOpenActionArgs: {},
        rateRequest: { for: 'USD' },
        ...variables,
      },
    },
    result: {
      data: {
        result: {
          items: publications,
          pageInfo: info,
        },
      },
    },
  };
}

export function mockSearchPublicationsResponse(args: {
  variables: SearchPublicationsVariables;
  items: Array<PrimaryPublication>;
}): MockedResponse<SearchPublicationsData> {
  return {
    request: {
      query: SearchPublicationsDocument,
      variables: {
        publicationImageTransform: {},
        publicationOperationsActedArgs: {},
        publicationStatsInput: {},
        publicationStatsCountOpenActionArgs: {},
        profileCoverTransform: {},
        profilePictureTransform: {},
        profileStatsArg: {},
        profileStatsCountOpenActionArgs: {},
        rateRequest: { for: 'USD' },
        ...args.variables,
      },
    },
    result: {
      data: {
        result: {
          items: args.items,
          pageInfo: mockPaginatedResultInfo(),
        },
      },
    },
  };
}

export function mockProfilesResponse({
  variables,
  profiles,
  info = mockPaginatedResultInfo(),
}: {
  variables: ProfilesVariables;
  profiles: Profile[];
  info?: PaginatedResultInfo;
}): MockedResponse<ProfilesData> {
  return {
    request: {
      query: ProfilesDocument,
      variables: {
        profileCoverTransform: {},
        profilePictureTransform: {},
        profileStatsArg: {},
        profileStatsCountOpenActionArgs: {},
        rateRequest: { for: 'USD' },
        ...variables,
      },
    },
    result: {
      data: {
        result: {
          items: profiles,
          pageInfo: info,
        },
      },
    },
  };
}

export function mockSearchProfilesResponse(args: {
  variables: SearchProfilesVariables;
  items: Profile[];
}): MockedResponse<SearchProfilesData> {
  return {
    request: {
      query: SearchProfilesDocument,
      variables: {
        profileCoverTransform: {},
        profilePictureTransform: {},
        profileStatsArg: {},
        profileStatsCountOpenActionArgs: {},
        rateRequest: { for: 'USD' },
        ...args.variables,
      },
    },
    result: {
      data: {
        result: {
          items: args.items,
          pageInfo: mockPaginatedResultInfo(),
        },
      },
    },
  };
}
