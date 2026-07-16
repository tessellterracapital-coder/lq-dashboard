/**
 * Metro identity types and BLS series helpers.
 *
 * This module used to export a hand-maintained `METROS` list of ~33 metros.
 * It has been retired: it covered a fraction of the 431 metros in the dataset
 * (so search silently hid most of the country), its slugs did not match the
 * generated data files, and three of its area codes were copy-paste errors
 * that resolved to a real but different metro — New York rendered Nassau
 * County-Suffolk County data under the New York name.
 *
 * Metros are now resolved exclusively from public/data/lq_all_metros.json,
 * which is built from BLS CES data by scripts/build-screening-data.mjs:
 *   - client: `loadScreeningData()` in @/lib/screeningData
 *   - server: read the JSON directly (see app/metro/[slug]/page.tsx)
 *
 * Legacy slugs are redirected via @/data/legacyMetroSlugs.
 */

export interface Metro {
  stateCode: string;
  areaCode: string;
  name: string;
  slug: string;
}

export function buildMetroSeriesId(stateCode: string, areaCode: string, supersectorCode: string): string {
  return `SMU${stateCode}${areaCode}${supersectorCode}01`;
}
