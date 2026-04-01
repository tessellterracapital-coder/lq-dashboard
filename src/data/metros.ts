export interface Metro {
  stateCode: string;
  areaCode: string;
  name: string;
  slug: string;
}

export const METROS: Metro[] = [
  { stateCode: "11", areaCode: "47764", name: "Washington, DC-MD (Division)", slug: "washington-dc-md" },
  { stateCode: "51", areaCode: "11694", name: "Arlington-Alexandria-Reston, VA-WV (NoVA Division)", slug: "arlington-nova" },
  { stateCode: "24", areaCode: "23224", name: "Frederick-Gaithersburg-Bethesda, MD (Division)", slug: "frederick-bethesda-md" },
  { stateCode: "11", areaCode: "12580", name: "Washington-Arlington-Alexandria, DC-VA-MD-WV (Full MSA)", slug: "washington-full-msa" },
  { stateCode: "51", areaCode: "47260", name: "Virginia Beach-Norfolk-Newport News, VA-NC", slug: "virginia-beach-norfolk" },
  { stateCode: "13", areaCode: "12060", name: "Atlanta-Sandy Springs-Alpharetta, GA", slug: "atlanta-ga" },
  { stateCode: "37", areaCode: "16740", name: "Charlotte-Concord-Gastonia, NC-SC", slug: "charlotte-nc" },
  { stateCode: "19", areaCode: "19780", name: "Des Moines-West Des Moines, IA", slug: "des-moines-ia" },
  { stateCode: "55", areaCode: "31540", name: "Madison, WI", slug: "madison-wi" },
  { stateCode: "36", areaCode: "35004", name: "New York-Newark-Jersey City, NY-NJ-PA", slug: "new-york-ny" },
  { stateCode: "06", areaCode: "31080", name: "Los Angeles-Long Beach-Anaheim, CA", slug: "los-angeles-ca" },
  { stateCode: "17", areaCode: "16980", name: "Chicago-Naperville-Elgin, IL-IN-WI", slug: "chicago-il" },
  { stateCode: "48", areaCode: "26420", name: "Houston-The Woodlands-Sugar Land, TX", slug: "houston-tx" },
  { stateCode: "48", areaCode: "19100", name: "Dallas-Fort Worth-Arlington, TX", slug: "dallas-tx" },
  { stateCode: "12", areaCode: "33100", name: "Miami-Fort Lauderdale-Pompano Beach, FL", slug: "miami-fl" },
  { stateCode: "06", areaCode: "41860", name: "San Francisco-Oakland-Berkeley, CA", slug: "san-francisco-ca" },
  { stateCode: "25", areaCode: "14460", name: "Boston-Cambridge-Newton, MA-NH", slug: "boston-ma" },
  { stateCode: "53", areaCode: "42660", name: "Seattle-Tacoma-Bellevue, WA", slug: "seattle-wa" },
  { stateCode: "27", areaCode: "33460", name: "Minneapolis-St. Paul-Bloomington, MN-WI", slug: "minneapolis-mn" },
  { stateCode: "47", areaCode: "34980", name: "Nashville-Davidson-Murfreesboro-Franklin, TN", slug: "nashville-tn" },
  { stateCode: "49", areaCode: "41620", name: "Salt Lake City, UT", slug: "salt-lake-city-ut" },
  { stateCode: "37", areaCode: "39580", name: "Raleigh-Cary, NC", slug: "raleigh-nc" },
  { stateCode: "39", areaCode: "17140", name: "Cincinnati, OH-KY-IN", slug: "cincinnati-oh" },
  { stateCode: "29", areaCode: "41180", name: "St. Louis, MO-IL", slug: "st-louis-mo" },
  { stateCode: "24", areaCode: "12580", name: "Baltimore-Columbia-Towson, MD", slug: "baltimore-md" },
  { stateCode: "42", areaCode: "38300", name: "Pittsburgh, PA", slug: "pittsburgh-pa" },
  { stateCode: "08", areaCode: "19740", name: "Denver-Aurora-Lakewood, CO", slug: "denver-co" },
  { stateCode: "41", areaCode: "38900", name: "Portland-Vancouver-Hillsboro, OR-WA", slug: "portland-or" },
  { stateCode: "48", areaCode: "12420", name: "Austin-Round Rock-Georgetown, TX", slug: "austin-tx" },
  { stateCode: "04", areaCode: "33100", name: "Phoenix-Mesa-Chandler, AZ", slug: "phoenix-az" },
  { stateCode: "26", areaCode: "19820", name: "Detroit-Warren-Dearborn, MI", slug: "detroit-mi" },
  { stateCode: "12", areaCode: "36740", name: "Orlando-Kissimmee-Sanford, FL", slug: "orlando-fl" },
  { stateCode: "12", areaCode: "45300", name: "Tampa-St. Petersburg-Clearwater, FL", slug: "tampa-fl" },
];

export function getMetroBySlug(slug: string): Metro | undefined {
  return METROS.find((m) => m.slug === slug);
}

export function buildMetroSeriesId(stateCode: string, areaCode: string, supersectorCode: string): string {
  return `SMU${stateCode}${areaCode}${supersectorCode}01`;
}
