import { Profile } from '@lens-protocol/api-bindings';
import { ProfileId } from '@lens-protocol/domain/entities';

export interface IProfileCacheManager {
  fetchProfile(id: ProfileId): Promise<Profile | null>;

  refreshProfile(id: ProfileId): Promise<Profile>;

  updateProfile(id: ProfileId, updateFn: (current: Profile) => Profile): void;
}
