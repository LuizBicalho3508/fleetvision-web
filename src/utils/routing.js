// Cálculo de distância Haversine (em km)
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Raio da Terra
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Algoritmo do Vizinho Mais Próximo (Nearest Neighbor)
export const optimizeRoute = (stops) => {
  if (stops.length < 3) return stops; // Não precisa otimizar se tiver poucos pontos

  const optimized = [stops[0]]; // Começa pelo primeiro ponto (Depósito/Saída)
  let remaining = stops.slice(1);
  let current = stops[0];

  while (remaining.length > 0) {
    let nearest = null;
    let minDist = Infinity;
    let nearestIndex = -1;

    // Encontra o ponto não visitado mais próximo do atual
    remaining.forEach((stop, index) => {
      const dist = getDistance(current.lat, current.lng, stop.lat, stop.lng);
      if (dist < minDist) {
        minDist = dist;
        nearest = stop;
        nearestIndex = index;
      }
    });

    if (nearest) {
      optimized.push(nearest);
      current = nearest;
      remaining.splice(nearestIndex, 1); // Remove da lista de pendentes
    } else {
      break;
    }
  }

  return optimized;
};
