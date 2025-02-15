import { isRelaySuccess } from '@lens-protocol/client';

import { getAuthenticatedClientFromEthersWallet } from '../shared/getAuthenticatedClient';
import { setupWallet } from '../shared/setupWallet';

async function main() {
  const wallet = setupWallet();
  const client = await getAuthenticatedClientFromEthersWallet(wallet);

  const result = await client.profile.unblock({
    profiles: ['PROFILE_ID_TO_BLOCK'],
  });

  const data = result.unwrap();

  if (!isRelaySuccess(data)) {
    console.log(`Something went wrong`, data);
    return;
  }

  await client.transaction.waitUntilComplete({ forTxId: data.txId });
}

main();
