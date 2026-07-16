/**
 * Legacy metro slugs -> canonical slugs.
 *
 * These are the hand-crafted slugs from the retired METROS constant. They
 * were published in the sitemap and linked from the screening table, so they
 * are redirected rather than dropped. This is a redirect table only: metro data
 * is resolved exclusively from public/data/lq_all_metros.json.
 *
 * Do not add to this map. New metros come from the BLS build.
 */
export const LEGACY_METRO_SLUGS: Record<string, string> = {
  "washington-dc-md": "washington-dc-md-metropolitan-division",
  "arlington-nova": "arlington-alexandria-reston-va-wv-metropolitan-division",
  "frederick-bethesda-md": "frederick-gaithersburg-bethesda-md-metropolitan-division",
  "washington-full-msa": "washington-arlington-alexandria-dc-va-md-wv",
  "virginia-beach-norfolk": "virginia-beach-chesapeake-norfolk-va-nc",
  "atlanta-ga": "atlanta-sandy-springs-roswell-ga",
  "charlotte-nc": "charlotte-concord-gastonia-nc-sc",
  "des-moines-ia": "des-moines-west-des-moines-ia",
  "new-york-ny": "new-york-newark-jersey-city-ny-nj",
  "los-angeles-ca": "los-angeles-long-beach-anaheim-ca",
  "chicago-il": "chicago-naperville-elgin-il-in",
  "houston-tx": "houston-pasadena-the-woodlands-tx",
  "dallas-tx": "dallas-fort-worth-arlington-tx",
  "miami-fl": "miami-fort-lauderdale-west-palm-beach-fl",
  "san-francisco-ca": "san-francisco-oakland-fremont-ca",
  "boston-ma": "boston-cambridge-newton-ma-nh",
  "seattle-wa": "seattle-tacoma-bellevue-wa",
  "minneapolis-mn": "minneapolis-st-paul-bloomington-mn-wi",
  "nashville-tn": "nashville-davidson-murfreesboro-franklin-tn",
  "salt-lake-city-ut": "salt-lake-city-murray-ut",
  "raleigh-nc": "raleigh-cary-nc",
  "cincinnati-oh": "cincinnati-oh-ky-in",
  "st-louis-mo": "st-louis-mo-il",
  "baltimore-md": "baltimore-columbia-towson-md",
  "denver-co": "denver-aurora-centennial-co",
  "portland-or": "portland-vancouver-hillsboro-or-wa",
  "austin-tx": "austin-round-rock-san-marcos-tx",
  "phoenix-az": "phoenix-mesa-chandler-az",
  "detroit-mi": "detroit-warren-dearborn-mi",
  "orlando-fl": "orlando-kissimmee-sanford-fl",
  "tampa-fl": "tampa-st-petersburg-clearwater-fl",
};

/** Canonical slug for a legacy slug, or null if it is already canonical. */
export function canonicalSlug(slug: string): string | null {
  return LEGACY_METRO_SLUGS[slug] ?? null;
}
