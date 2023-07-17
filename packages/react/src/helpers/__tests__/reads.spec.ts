import { ApolloError, QueryResult as ApolloQueryResult, gql, useQuery } from '@apollo/client';
import { MockedResponse } from '@apollo/client/testing';
import { UnspecifiedError } from '@lens-protocol/api-bindings';
import { mockLensApolloClient } from '@lens-protocol/api-bindings/mocks';
import { renderHook, waitFor } from '@testing-library/react';

import { PaginatedQueryData, QueryData, usePaginatedReadResult, useReadResult } from '../reads';

const document = gql`
  query Ping {
    result: ping
  }
`;

function mockQueryResponse<T extends QueryData<unknown>>(data: T): MockedResponse<T> {
  return {
    request: {
      query: document,
    },
    result: { data },
  };
}

describe(`Given the read hook helpers`, () => {
  describe(`when running an hook created via the ${useReadResult.name} helper`, () => {
    it('should return the data at the end of the initial loading phase', async () => {
      const client = mockLensApolloClient([mockQueryResponse({ result: true })]);
      const { result } = renderHook(() => useReadResult(useQuery(document, { client })));

      expect(result.current).toMatchObject({
        error: undefined,
        data: undefined,
        loading: true,
      });

      await waitFor(() => expect(result.current.loading).toBeFalsy());

      expect(result.current).toMatchObject({
        data: true,
        loading: false,
      });
    });

    it(`should wrap any error into ${UnspecifiedError.name}`, async () => {
      const cause = new ApolloError({ graphQLErrors: [] });
      const queryResult = { error: cause, data: undefined, loading: false } as ApolloQueryResult<
        QueryData<void>
      >;
      const { result } = renderHook(() => useReadResult(queryResult));

      expect(result.current).toMatchObject({
        error: expect.any(UnspecifiedError),
        data: undefined,
        loading: false,
      });
    });
  });

  describe(`when re-rendering an hook created via the ${useReadResult.name} helper`, () => {
    const client = mockLensApolloClient([
      mockQueryResponse({ result: true }),
      mockQueryResponse({ result: false }),
    ]);

    it(`should interoperate w/ the ${client.constructor.name} so to return cached data and then update it with fresh data from the API`, async () => {
      const first = renderHook(() => useReadResult(useQuery(document, { client })));
      await waitFor(() => expect(first.result.current.loading).toBeFalsy());

      const second = renderHook(() => useReadResult(useQuery(document, { client })));

      expect(second.result.current).toMatchObject({
        data: true,
        loading: false,
      });
      await waitFor(() => expect(first.result.current.data).toBeFalsy());
    });
  });

  describe(`when running an hook created via the ${usePaginatedReadResult.name} helper`, () => {
    it(`should wrap any error into ${UnspecifiedError.name}`, async () => {
      const cause = new ApolloError({ graphQLErrors: [] });
      const queryResult = { error: cause, data: undefined, loading: false } as ApolloQueryResult<
        PaginatedQueryData<void>
      >;
      const { result } = renderHook(() => usePaginatedReadResult(queryResult));

      expect(result.current).toMatchObject({
        error: expect.any(UnspecifiedError),
        data: undefined,
        loading: false,
      });
    });
  });
});
