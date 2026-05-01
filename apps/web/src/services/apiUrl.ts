type QueryParamValue = string | number | boolean | null | undefined;

export function withQuery(path: string, params: Record<string, QueryParamValue>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === '') continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `${path}?${query}` : path;
}
