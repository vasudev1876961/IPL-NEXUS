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
    primaryColor: "#FACC15",
    secondaryColor: "#EAB308",
    gradient: "from-amber-400 via-yellow-500 to-amber-600",
    textColor: "text-yellow-400",
    bgTint: "bg-yellow-500/10",
    borderTint: "border-yellow-500/30",
  },
  "Mumbai Indians": {
    name: "Mumbai Indians",
    short: "MI",
    primaryColor: "#005DA0",
    secondaryColor: "#0084DE",
    gradient: "from-blue-600 via-sky-500 to-blue-700",
    textColor: "text-sky-400",
    bgTint: "bg-blue-500/10",
    borderTint: "border-blue-500/30",
  },
  "Royal Challengers Bengaluru": {
    name: "Royal Challengers Bengaluru",
    short: "RCB",
    primaryColor: "#EC1C24",
    secondaryColor: "#D4AF37",
    gradient: "from-red-600 via-rose-600 to-amber-500",
    textColor: "text-red-400",
    bgTint: "bg-red-500/10",
    borderTint: "border-red-500/30",
  },
  "Kolkata Knight Riders": {
    name: "Kolkata Knight Riders",
    short: "KKR",
    primaryColor: "#3A225D",
    secondaryColor: "#F3A536",
    gradient: "from-purple-800 via-violet-700 to-amber-500",
    textColor: "text-purple-400",
    bgTint: "bg-purple-500/10",
    borderTint: "border-purple-500/30",
  },
  "Delhi Capitals": {
    name: "Delhi Capitals",
    short: "DC",
    primaryColor: "#17479E",
    secondaryColor: "#EF4444",
    gradient: "from-blue-700 via-blue-600 to-red-500",
    textColor: "text-blue-400",
    bgTint: "bg-blue-500/10",
    borderTint: "border-blue-500/30",
  },
  "Punjab Kings": {
    name: "Punjab Kings",
    short: "PBKS",
    primaryColor: "#ED1B24",
    secondaryColor: "#DCDDDF",
    gradient: "from-red-600 via-rose-600 to-red-700",
    textColor: "text-rose-400",
    bgTint: "bg-rose-500/10",
    borderTint: "border-rose-500/30",
  },
  "Rajasthan Royals": {
    name: "Rajasthan Royals",
    short: "RR",
    primaryColor: "#EA1A85",
    secondaryColor: "#254AA5",
    gradient: "from-pink-600 via-rose-500 to-blue-600",
    textColor: "text-pink-400",
    bgTint: "bg-pink-500/10",
    borderTint: "border-pink-500/30",
  },
  "Sunrisers Hyderabad": {
    name: "Sunrisers Hyderabad",
    short: "SRH",
    primaryColor: "#F26522",
    secondaryColor: "#000000",
    gradient: "from-orange-600 via-amber-500 to-orange-700",
    textColor: "text-orange-400",
    bgTint: "bg-orange-500/10",
    borderTint: "border-orange-500/30",
  },
  "Gujarat Titans": {
    name: "Gujarat Titans",
    short: "GT",
    primaryColor: "#1B2133",
    secondaryColor: "#D4AF37",
    gradient: "from-slate-800 via-cyan-900 to-amber-500",
    textColor: "text-cyan-400",
    bgTint: "bg-cyan-500/10",
    borderTint: "border-cyan-500/30",
  },
  "Lucknow Super Giants": {
    name: "Lucknow Super Giants",
    short: "LSG",
    primaryColor: "#37A1D2",
    secondaryColor: "#F26522",
    gradient: "from-cyan-600 via-sky-500 to-orange-500",
    textColor: "text-sky-300",
    bgTint: "bg-sky-500/10",
    borderTint: "border-sky-500/30",
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
