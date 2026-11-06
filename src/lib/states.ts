// USPS codes to names, as us-atlas and OpenStreetMap write them, for the states that have stops. The codes are what
// the data holds; the names let a search for "Texas" find a TX stop, and match a stop's state to its outline and its
// geocoding result. A store in a new state: add a line here (check:data fails until it is listed).
export const STATE_NAMES: Record<string, string> = {
  AL: 'Alabama',
  CA: 'California',
  DC: 'District of Columbia',
  GA: 'Georgia',
  IL: 'Illinois',
  LA: 'Louisiana',
  MN: 'Minnesota',
  NY: 'New York',
  SC: 'South Carolina',
  TN: 'Tennessee',
  TX: 'Texas',
}
