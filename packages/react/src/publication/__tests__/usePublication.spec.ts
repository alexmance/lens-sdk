import { mockPostFragment, mockPublicationResponse } from '@lens-protocol/api-bindings/mocks';
import { waitFor } from '@testing-library/react';

import { NotFoundError } from '../../NotFoundError';
import { setupHookTestScenario } from '../../__helpers__/setupHookTestScenario';
import { usePublication } from '../usePublication';

describe(`Given the ${usePublication.name} hook`, () => {
  const publication = mockPostFragment();
  const expectations = { __typename: 'Post', id: publication.id };

  describe('when the queried publication exists', () => {
    const { renderHook } = setupHookTestScenario([
      mockPublicationResponse({
        variables: {
          request: {
            forId: publication.id,
          },
        },
        result: publication,
      }),
    ]);

    it('should settle with the publication data', async () => {
      const { result } = renderHook(() => usePublication({ forId: publication.id }));

      await waitFor(() => expect(result.current.loading).toBeFalsy());
      expect(result.current.data).toMatchObject(expectations);
    });
  });

  describe('when the queried publication does not exist', () => {
    const { renderHook } = setupHookTestScenario([
      mockPublicationResponse({
        variables: {
          request: {
            forId: publication.id,
          },
        },
        result: null,
      }),
    ]);

    it(`should settle with a ${NotFoundError.name} state`, async () => {
      const { result } = renderHook(() => usePublication({ forId: publication.id }));

      await waitFor(() => expect(result.current.loading).toBeFalsy());
      expect(result.current.error).toBeInstanceOf(NotFoundError);
    });
  });
});
