export interface TeamInfo {
  name: string;
  short: string;
  primaryColor: string;
  secondaryColor: string;
  gradient: string;
  textColor: string;
  bgTint: string;
  borderTint: string;
}

export const TEAMS_DATA: Record<string, TeamInfo> = {
  "Chennai Super Kings": {
    name: "Chennai Super Kings",
    short: "CSK",
    primaryColor: "#f9ed25",
    secondaryColor: "#0668b3",
    gradient: "from-[#f9ed25] via-[#e9de23] to-[#0668b3]",
    textColor: "text-[#f9ed25]",
    bgTint: "bg-[#f9ed25]/15",
    borderTint: "border-[#f9ed25]/35",
  },
  "Mumbai Indians": {
    name: "Mumbai Indians",
    short: "MI",
    primaryColor: "#005289",
    secondaryColor: "#edce83",
    gradient: "from-[#005289] via-[#0066aa] to-[#edce83]",
    textColor: "text-[#56bdf9]",
    bgTint: "bg-[#005289]/20",
    borderTint: "border-[#005289]/40",
  },
  "Royal Challengers Bengaluru": {
    name: "Royal Challengers Bengaluru",
    short: "RCB",
    primaryColor: "#d6272e",
    secondaryColor: "#001f61",
    gradient: "from-[#d6272e] via-[#ca242a] to-[#001f61]",
    textColor: "text-[#ef4444]",
    bgTint: "bg-[#d6272e]/20",
    borderTint: "border-[#d6272e]/40",
  },
  "Kolkata Knight Riders": {
    name: "Kolkata Knight Riders",
    short: "KKR",
    primaryColor: "#602f92",
    secondaryColor: "#f2c028",
    gradient: "from-[#602f92] via-[#582884] to-[#f2c028]",
    textColor: "text-[#c084fc]",
    bgTint: "bg-[#602f92]/20",
    borderTint: "border-[#602f92]/40",
  },
  "Delhi Capitals": {
    name: "Delhi Capitals",
    short: "DC",
    primaryColor: "#253e8a",
    secondaryColor: "#f04945",
    gradient: "from-[#253e8a] via-[#223981] to-[#f04945]",
    textColor: "text-[#60a5fa]",
    bgTint: "bg-[#253e8a]/20",
    borderTint: "border-[#253e8a]/40",
  },
  "Punjab Kings": {
    name: "Punjab Kings",
    short: "PBKS",
    primaryColor: "#d52027",
    secondaryColor: "#ffdead",
    gradient: "from-[#d52027] via-[#c61d23] to-[#ffdead]",
    textColor: "text-[#f87171]",
    bgTint: "bg-[#d52027]/20",
    borderTint: "border-[#d52027]/40",
  },
  "Rajasthan Royals": {
    name: "Rajasthan Royals",
    short: "RR",
    primaryColor: "#ed1164",
    secondaryColor: "#26235e",
    gradient: "from-[#ed1164] via-[#de0d5e] to-[#26235e]",
    textColor: "text-[#f472b6]",
    bgTint: "bg-[#ed1164]/20",
    borderTint: "border-[#ed1164]/40",
  },
  "Sunrisers Hyderabad": {
    name: "Sunrisers Hyderabad",
    short: "SRH",
    primaryColor: "#f04e23",
    secondaryColor: "#ff7d19",
    gradient: "from-[#f04e23] via-[#ff7d19] to-[#040921]",
    textColor: "text-[#fb923c]",
    bgTint: "bg-[#f04e23]/20",
    borderTint: "border-[#f04e23]/40",
  },
  "Gujarat Titans": {
    name: "Gujarat Titans",
    short: "GT",
    primaryColor: "#0b1d34",
    secondaryColor: "#bd9e5e",
    gradient: "from-[#0b1d34] via-[#152a47] to-[#bd9e5e]",
    textColor: "text-[#38bdf8]",
    bgTint: "bg-[#0b1d34]/40",
    borderTint: "border-[#bd9e5e]/30",
  },
  "Lucknow Super Giants": {
    name: "Lucknow Super Giants",
    short: "LSG",
    primaryColor: "#aa003b",
    secondaryColor: "#002554",
    gradient: "from-[#aa003b] via-[#991739] to-[#f1a348]",
    textColor: "text-[#f43f5e]",
    bgTint: "bg-[#aa003b]/20",
    borderTint: "border-[#aa003b]/40",
  },
};

export function getTeamInfo(teamName: string): TeamInfo {
  if (TEAMS_DATA[teamName]) {
    return TEAMS_DATA[teamName];
  }
  // Try partial match
  const key = Object.keys(TEAMS_DATA).find((k) =>
    teamName.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(teamName.toLowerCase())
  );
  if (key) {
    return TEAMS_DATA[key];
  }
  return {
    name: teamName,
    short: teamName.split(" ").map((w) => w[0]).join("").slice(0, 4).toUpperCase(),
    primaryColor: "#3B82F6",
    secondaryColor: "#1D4ED8",
    gradient: "from-blue-600 to-indigo-700",
    textColor: "text-blue-400",
    bgTint: "bg-blue-500/10",
    borderTint: "border-blue-500/30",
  };
}
