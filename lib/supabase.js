// Builds headers for Supabase REST calls that work with both key styles:
//  - Legacy service_role keys are JWTs and ride in the Authorization header.
//  - New secret keys (sb_secret_...) must NOT be sent as a Bearer token; they
//    authorize through the apikey header only.
// Passing either kind of key here produces valid headers without you having to
// know which one you copied.
export function supabaseHeaders(key, extra = {}) {
  const headers = { apikey: key, ...extra };
  const isNewStyle =
    String(key).startsWith("sb_secret_") || String(key).startsWith("sb_publishable_");
  if (!isNewStyle) {
    headers.authorization = "Bearer " + key;
  }
  return headers;
}
