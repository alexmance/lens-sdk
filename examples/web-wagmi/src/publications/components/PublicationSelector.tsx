import { usePublications } from '@lens-protocol/react';

type SelectPublicationIdProps = {
  onPublicationSelected: (publicationId: string) => void;
  profileId: string;
};

export function SelectPublicationId({
  onPublicationSelected,
  profileId,
}: SelectPublicationIdProps) {
  const { data: publications, loading } = usePublications({ profileId, limit: 30 });

  if (loading) return null;

  return (
    <select
      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onPublicationSelected(e.target.value)}
    >
      <option value="default">Select a publication</option>
      {publications.map((publication) => (
        <option key={publication.id} value={publication.id}>
          {publication.id} ({publication.metadata.content?.slice(0, 10)})
        </option>
      ))}
    </select>
  );
}
