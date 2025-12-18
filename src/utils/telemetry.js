export const SCORE_WEIGHTS = {
  deviceOverspeed: 10,
  hardBraking: 5,
  hardAcceleration: 5,
  hardCornering: 5,
  schedule_late_start: 20 // Penalidade pesada para atraso
};

export const calculateScores = (devices, events, customEvents = []) => {
  const scores = {};
  devices.forEach(dev => {
    scores[dev.id] = { 
      id: dev.id, name: dev.name, score: 100, 
      violations: { speeding: 0, braking: 0, acceleration: 0, cornering: 0, late: 0 } 
    };
  });

  // Eventos Traccar
  events.forEach(event => {
    const target = scores[event.deviceId];
    if (target) {
      const penalty = SCORE_WEIGHTS[event.type] || 0;
      target.score -= penalty;
      if (event.type === 'deviceOverspeed') target.violations.speeding++;
      if (event.type === 'hardBraking') target.violations.braking++;
      if (event.type === 'hardAcceleration') target.violations.acceleration++;
      if (event.type === 'hardCornering') target.violations.cornering++;
    }
  });

  // Eventos Customizados (Atrasos)
  customEvents.forEach(event => {
    const target = scores[event.deviceId];
    if (target) {
      const penalty = SCORE_WEIGHTS[event.type] || 15;
      target.score -= penalty;
      if (event.type === 'schedule_late_start') target.violations.late++;
    }
  });

  return Object.values(scores).map(s => ({ ...s, score: Math.max(0, s.score) })).sort((a, b) => b.score - a.score);
};
