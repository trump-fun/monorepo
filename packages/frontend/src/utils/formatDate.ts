export const formatDate = (dateString: string) => {
  const date = new Date(dateString);

  const now = new Date();

  const diffMs = now.getTime() - date.getTime();

  const diffMins = Math.floor(diffMs / (1000 * 60));

  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';

  if (diffMins < 60) return `${diffMins}m ago`;

  if (diffHrs < 24) return `${diffHrs}h ago`;

  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
};
