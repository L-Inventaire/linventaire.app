// This function is also in frontend and should be kept in sync
export const supportedUnits = {
  general: ["unit"],
  time: ["min", "h", "d", "w", "mo", "y"],
  length: ["mm", "cm", "m", "km"],
  mass: ["mg", "g", "kg", "t"],
  volume: ["l", "m³"],
  area: ["cm²", "m²", "ha", "km²"],
};

// This function is also in frontend and should be kept in sync
export const convertUnit = (value: number, from: string, to: string) => {
  if (from === to) return value;
  if (from === "unit" || to === "unit") return value;

  // Time related
  const factors: any = {
    min: 1,
    h: 60,
    d: 24 * 60,
    w: 24 * 7 * 60,
    mo: 24 * 30 * 60,
    y: 24 * 365 * 60,
  };
  if (supportedUnits.time.includes(from) && supportedUnits.time.includes(to)) {
    return (value * (factors[from] || 0)) / (factors[to] || 1);
  }

  // Length related
  const lengthFactors: any = {
    mm: 1,
    cm: 10,
    m: 1000,
    km: 1000000,
  };
  if (
    supportedUnits.length.includes(from) &&
    supportedUnits.length.includes(to)
  ) {
    return (value * (lengthFactors[from] || 0)) / (lengthFactors[to] || 1);
  }

  // Mass related
  const massFactors: any = {
    mg: 1,
    g: 1000,
    kg: 1000000,
    t: 1000000000,
  };
  if (supportedUnits.mass.includes(from) && supportedUnits.mass.includes(to)) {
    return (value * (massFactors[from] || 0)) / (massFactors[to] || 1);
  }

  // Volume related
  const volumeFactors: any = {
    l: 1,
    "m³": 1000,
  };
  if (
    supportedUnits.volume.includes(from) &&
    supportedUnits.volume.includes(to)
  ) {
    return (value * (volumeFactors[from] || 0)) / (volumeFactors[to] || 1);
  }

  // Area related
  const areaFactors: any = {
    "cm²": 1,
    "m²": 10000,
    ha: 1000000,
    "km²": 100000000,
  };
  if (supportedUnits.area.includes(from) && supportedUnits.area.includes(to)) {
    return (value * (areaFactors[from] || 0)) / (areaFactors[to] || 1);
  }

  return value;
};
