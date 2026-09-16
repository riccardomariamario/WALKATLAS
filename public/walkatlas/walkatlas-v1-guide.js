/* WALKATLAS v1 — motore puro della Vista Guida GPS.
   Non disegna la UI: produce un solo stato condiviso da camera e bussola di rotta. */
(function (global) {
  'use strict';

  const GUIDE_PHASE = Object.freeze({
    ATLAS: 'ATLAS',
    GUIDE: 'GUIDE',
    OFF_ROUTE: 'OFF_ROUTE',
    ARRIVED: 'ARRIVED'
  });
  const SNAP_THRESHOLD_M = 35;
  const SNAP_ENTER_THRESHOLD_M = 25;
  const SNAP_EXIT_THRESHOLD_M = 40;
  const LOOK_AHEAD_M = 22;
  const TURN_LOOK_AHEAD_M = 12;
  const TURN_IMMINENT_M = 32;
  const ARRIVAL_THRESHOLD_M = 18;
  const GPS_WEAK_ACCURACY_M = 45;
  const MIN_HEADING_MOVE_M = 3;

  function number(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function radians(value) { return value * Math.PI / 180; }
  function normalizeHeading(value) {
    const parsed = number(value);
    return parsed === null ? null : ((parsed % 360) + 360) % 360;
  }

  function distanceMeters(a, b) {
    if (!a || !b) return Infinity;
    const lat1 = number(a.lat), lon1 = number(a.lon), lat2 = number(b.lat), lon2 = number(b.lon);
    if ([lat1, lon1, lat2, lon2].some(value => value === null)) return Infinity;
    const earth = 6371000;
    const dLat = radians(lat2 - lat1);
    const dLon = radians(lon2 - lon1);
    const x = Math.sin(dLat / 2) ** 2 + Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(dLon / 2) ** 2;
    return earth * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  }

  function bearingDegrees(a, b) {
    if (!a || !b) return null;
    const lat1 = number(a.lat), lon1 = number(a.lon), lat2 = number(b.lat), lon2 = number(b.lon);
    if ([lat1, lon1, lat2, lon2].some(value => value === null)) return null;
    const phi1 = radians(lat1), phi2 = radians(lat2), deltaLon = radians(lon2 - lon1);
    const y = Math.sin(deltaLon) * Math.cos(phi2);
    const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLon);
    return normalizeHeading(Math.atan2(y, x) * 180 / Math.PI);
  }

  function normalizeCoordinate(value) {
    if (!Array.isArray(value) || value.length < 2) return null;
    const lon = number(value[0]), lat = number(value[1]);
    if (lat === null || lon === null || lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
    return [lon, lat];
  }

  function asPoint(coordinate) { return { lon: coordinate[0], lat: coordinate[1] }; }

  function cumulativeDistances(coordinates) {
    const cumulative = [0];
    for (let index = 1; index < coordinates.length; index += 1) {
      cumulative.push(cumulative[index - 1] + distanceMeters(asPoint(coordinates[index - 1]), asPoint(coordinates[index])));
    }
    return cumulative;
  }

  function nearestOnCoordinates(coordinates, cumulative, point, options) {
    if (!coordinates.length || !point) return null;
    if (coordinates.length === 1) {
      return { segmentIndex: 0, t: 0, coordinate: coordinates[0].slice(), distanceM: distanceMeters(point, asPoint(coordinates[0])), alongM: 0 };
    }
    const minAlongM = options && Number.isFinite(Number(options.minAlongM)) ? Number(options.minAlongM) : -Infinity;
    const maxAlongM = options && Number.isFinite(Number(options.maxAlongM)) ? Number(options.maxAlongM) : Infinity;
    let best = null;
    for (let index = 0; index < coordinates.length - 1; index += 1) {
      const start = coordinates[index], end = coordinates[index + 1];
      const segmentLength = cumulative[index + 1] - cumulative[index];
      const allowedFrom = Math.max(cumulative[index], minAlongM);
      const allowedTo = Math.min(cumulative[index + 1], maxAlongM);
      if (allowedFrom > allowedTo) continue;
      const latRef = radians((start[1] + end[1] + point.lat) / 3);
      const xScale = 111320 * Math.max(0.1, Math.cos(latRef));
      const yScale = 110540;
      const ax = start[0] * xScale, ay = start[1] * yScale;
      const bx = end[0] * xScale, by = end[1] * yScale;
      const px = point.lon * xScale, py = point.lat * yScale;
      const dx = bx - ax, dy = by - ay;
      const denominator = dx * dx + dy * dy;
      let t = denominator ? clamp(((px - ax) * dx + (py - ay) * dy) / denominator, 0, 1) : 0;
      if (segmentLength > 0) {
        const candidateAlongM = cumulative[index] + segmentLength * t;
        const boundedAlongM = clamp(candidateAlongM, allowedFrom, allowedTo);
        t = (boundedAlongM - cumulative[index]) / segmentLength;
      }
      const coordinate = [start[0] + (end[0] - start[0]) * t, start[1] + (end[1] - start[1]) * t];
      const distanceM = distanceMeters(point, asPoint(coordinate));
      const candidate = { segmentIndex: index, t, coordinate, distanceM, alongM: cumulative[index] + segmentLength * t };
      if (!best || candidate.distanceM < best.distanceM) best = candidate;
    }
    return best;
  }

  function pointAtAlong(model, alongM) {
    const target = clamp(number(alongM) || 0, 0, model.totalDistanceM);
    if (target <= 0) return { coordinate: model.coordinates[0].slice(), alongM: 0, segmentIndex: 0 };
    for (let index = 0; index < model.cumulative.length - 1; index += 1) {
      const from = model.cumulative[index], to = model.cumulative[index + 1];
      if (target > to && index < model.cumulative.length - 2) continue;
      const ratio = to > from ? (target - from) / (to - from) : 0;
      const start = model.coordinates[index], end = model.coordinates[index + 1];
      return {
        coordinate: [start[0] + (end[0] - start[0]) * ratio, start[1] + (end[1] - start[1]) * ratio],
        alongM: target,
        segmentIndex: index
      };
    }
    const last = model.coordinates.length - 1;
    return { coordinate: model.coordinates[last].slice(), alongM: model.totalDistanceM, segmentIndex: Math.max(0, last - 1) };
  }

  function maneuverAlong(modelCoordinates, cumulative, maneuver) {
    const location = normalizeCoordinate(maneuver && maneuver.location);
    if (!location) return null;
    const nearest = nearestOnCoordinates(modelCoordinates, cumulative, asPoint(location));
    return nearest ? nearest.alongM : null;
  }

  function createRouteModel(walk, stops, origin, returnToBase) {
    if (!walk || walk.source !== 'osrm' || walk.profile !== 'foot') throw new Error('La Vista Guida richiede un percorso pedonale reale.');
    const rawCoordinates = walk.polyline && walk.polyline.type === 'LineString'
      ? walk.polyline.coordinates
      : Array.isArray(walk.latlngs) ? walk.latlngs.map(pair => [pair[1], pair[0]]) : [];
    const coordinates = rawCoordinates.map(normalizeCoordinate).filter(Boolean);
    if (coordinates.length < 2) throw new Error('Il percorso pedonale non contiene una polilinea valida.');
    const cumulative = cumulativeDistances(coordinates);
    const totalDistanceM = cumulative[cumulative.length - 1];
    if (!Number.isFinite(totalDistanceM) || totalDistanceM < 1) throw new Error('Il percorso pedonale è troppo breve.');

    const legs = (Array.isArray(walk.legs) ? walk.legs : []).map((leg, index) => ({
      ...leg,
      legIndex: Math.max(0, number(leg && leg.legIndex) ?? index),
      distanceM: Math.max(0, number(leg && leg.distanceM) || 0),
      durationSec: Math.max(0, number(leg && leg.durationSec) || 0)
    }));
    if (!legs.length) throw new Error('Il percorso pedonale non contiene i tratti tra le tappe.');
    const legDistanceTotal = legs.reduce((sum, leg) => sum + leg.distanceM, 0);
    let legDistanceCursor = 0;
    const legEnds = legs.map(leg => {
      legDistanceCursor += leg.distanceM;
      return legDistanceTotal > 0 ? totalDistanceM * legDistanceCursor / legDistanceTotal : null;
    });

    const normalizedStops = (Array.isArray(stops) ? stops : []).map((stop, index) => {
      const lat = number(stop && stop.lat), lon = number(stop && stop.lon);
      if (lat === null || lon === null) return null;
      const previousEnd = index > 0 ? legEnds[index - 1] : 0;
      const nearest = nearestOnCoordinates(coordinates, cumulative, { lat, lon }, { minAlongM: Math.max(0, Number(previousEnd || 0) - 20) });
      return {
        id: String(stop.id || `stop-${index + 1}`),
        slug: String(stop.slug || ''),
        name: String(stop.name || `Tappa ${index + 1}`),
        sequence: index + 1,
        lat,
        lon,
        routeAlongM: Number.isFinite(Number(legEnds[index])) ? Number(legEnds[index]) : nearest ? nearest.alongM : null
      };
    }).filter(Boolean);
    if (!normalizedStops.length || legs.length < normalizedStops.length) throw new Error('Il percorso pedonale non descrive tutte le tappe in ordine.');

    const maneuvers = (Array.isArray(walk.maneuvers) ? walk.maneuvers : []).map((maneuver, index) => {
      const alongM = maneuverAlong(coordinates, cumulative, maneuver);
      if (alongM === null) return null;
      return {
        id: String(maneuver.id || `maneuver-${index + 1}`),
        type: String(maneuver.type || 'continue'),
        modifier: String(maneuver.modifier || ''),
        instruction: String(maneuver.instruction || 'Continua sul percorso'),
        streetName: String(maneuver.streetName || ''),
        distanceM: Math.max(0, number(maneuver.distanceM) || 0),
        durationSec: Math.max(0, number(maneuver.durationSec) || 0),
        location: normalizeCoordinate(maneuver.location),
        legIndex: Math.max(0, number(maneuver.legIndex) || 0),
        stepIndex: Math.max(0, number(maneuver.stepIndex) || 0),
        alongM
      };
    }).filter(Boolean).sort((a, b) => a.alongM - b.alongM);
    if (!maneuvers.length) throw new Error('Il percorso pedonale non contiene le indicazioni di svolta.');

    return Object.freeze({
      id: String(walk.id || `walk-${Date.now()}`),
      source: 'osrm',
      profile: 'foot',
      origin: origin && Number.isFinite(Number(origin.lat)) && Number.isFinite(Number(origin.lon))
        ? { lat: Number(origin.lat), lon: Number(origin.lon), label: String(origin.label || 'La mia base') }
        : null,
      returnToBase: returnToBase === true,
      stops: normalizedStops,
      polyline: { type: 'LineString', coordinates: coordinates.map(coordinate => coordinate.slice()) },
      coordinates,
      cumulative,
      totalDistanceM,
      durationSec: Math.max(0, number(walk.durationSec) || (number(walk.durationMin) || 0) * 60),
      legs,
      maneuvers
    });
  }

  function atlasState() {
    return {
      phase: GUIDE_PHASE.ATLAS,
      position_raw: null,
      position_snapped: null,
      heading: null,
      heading_source: 'none',
      on_route: false,
      next_point: null,
      bearing_to_next: null,
      distance_to_next: null,
      next_maneuver: null,
      progress_pct: 0,
      gps_accuracy: null,
      gps_weak: true,
      snap_distance_m: null,
      route_along_m: 0,
      current_stop_index: -1,
      reached_stop: null,
      off_route_streak: 0,
      on_route_streak: 0,
      timestamp: null
    };
  }

  function chooseHeading(previous, raw, coords) {
    const direct = normalizeHeading(coords.heading);
    if (direct !== null) return { value: direct, source: 'gps' };
    if (previous && previous.position_raw) {
      const moved = distanceMeters(previous.position_raw, raw);
      if (moved >= MIN_HEADING_MOVE_M) return { value: bearingDegrees(previous.position_raw, raw), source: 'movement' };
    }
    const device = normalizeHeading(coords.deviceHeading);
    if (device !== null) return { value: device, source: 'device' };
    if (previous && normalizeHeading(previous.heading) !== null) return { value: normalizeHeading(previous.heading), source: 'held' };
    return { value: null, source: 'none' };
  }

  function nextManeuver(model, alongM) {
    return model.maneuvers.find(maneuver => maneuver.alongM > alongM + 2) || null;
  }

  function reachedStop(model, raw, alongM, currentStopIndex) {
    const nextIndex = Math.max(-1, Number.isFinite(Number(currentStopIndex)) ? Number(currentStopIndex) : -1) + 1;
    const stop = model.stops[nextIndex];
    if (!stop || stop.routeAlongM === null) return null;
    const distance = distanceMeters(raw, stop);
    if (distance > ARRIVAL_THRESHOLD_M || stop.routeAlongM > alongM + ARRIVAL_THRESHOLD_M) return null;
    return { stop, index: nextIndex, distanceM: distance };
  }

  function updateState(model, previousState, coords) {
    if (!model || !Array.isArray(model.coordinates)) throw new Error('Modello percorso mancante.');
    const latitude = number(coords && (coords.latitude ?? coords.lat));
    const longitude = number(coords && (coords.longitude ?? coords.lon));
    if (latitude === null || longitude === null) throw new Error('Posizione GPS non valida.');
    const previous = previousState || atlasState();
    const raw = { lat: latitude, lon: longitude };
    const accuracy = Math.max(0, number(coords.accuracy) || 0);
    const previousAlongM = Number(previous.route_along_m || 0);
    const gpsWeak = !accuracy || accuracy > GPS_WEAK_ACCURACY_M;
    const globalSnap = nearestOnCoordinates(model.coordinates, model.cumulative, raw);
    const searchWindow = previous.phase === GUIDE_PHASE.ATLAS || !previous.on_route
      ? null
      : { minAlongM: Math.max(0, previousAlongM - 18), maxAlongM: Math.min(model.totalDistanceM, previousAlongM + 220) };
    const localSnap = searchWindow ? nearestOnCoordinates(model.coordinates, model.cumulative, raw, searchWindow) : globalSnap;
    const candidateSnap = previous.on_route ? (localSnap || globalSnap) : globalSnap;
    const heading = gpsWeak
      ? { value: normalizeHeading(previous.heading), source: normalizeHeading(previous.heading) === null ? 'none' : 'held' }
      : chooseHeading(previous, raw, coords || {});
    const candidateOnRoute = Boolean(candidateSnap && candidateSnap.distanceM <= (previous.on_route ? SNAP_EXIT_THRESHOLD_M : SNAP_ENTER_THRESHOLD_M));
    let offRouteStreak = 0;
    let onRouteStreak = 0;
    let onRoute;
    if (previous.phase === GUIDE_PHASE.ATLAS) {
      onRoute = !gpsWeak && Boolean(candidateSnap && candidateSnap.distanceM <= SNAP_THRESHOLD_M);
      onRouteStreak = onRoute ? 1 : 0;
      offRouteStreak = gpsWeak || onRoute ? 0 : 1;
    } else if (gpsWeak) {
      onRoute = Boolean(previous.on_route);
      onRouteStreak = Number(previous.on_route_streak || 0);
      offRouteStreak = Number(previous.off_route_streak || 0);
    } else if (previous.on_route) {
      offRouteStreak = candidateOnRoute ? 0 : Number(previous.off_route_streak || 0) + 1;
      onRoute = offRouteStreak < 2;
      onRouteStreak = onRoute ? Number(previous.on_route_streak || 0) + 1 : 0;
    } else {
      onRouteStreak = candidateOnRoute ? Number(previous.on_route_streak || 0) + 1 : 0;
      onRoute = onRouteStreak >= 2;
      offRouteStreak = onRoute ? 0 : Number(previous.off_route_streak || 0) + 1;
    }
    let snap = onRoute ? candidateSnap : globalSnap;
    if (gpsWeak && previous.position_snapped && previous.phase !== GUIDE_PHASE.ATLAS) {
      const held = pointAtAlong(model, previousAlongM);
      snap = {
        segmentIndex: held.segmentIndex,
        t: 0,
        coordinate: held.coordinate,
        distanceM: globalSnap ? globalSnap.distanceM : Infinity,
        alongM: held.alongM
      };
    } else if (gpsWeak && previous.phase === GUIDE_PHASE.ATLAS) {
      const held = pointAtAlong(model, 0);
      snap = {
        segmentIndex: held.segmentIndex,
        t: 0,
        coordinate: held.coordinate,
        distanceM: globalSnap ? globalSnap.distanceM : Infinity,
        alongM: 0
      };
    }
    const displayPoint = onRoute ? asPoint(snap.coordinate) : raw;
    const progress = snap ? clamp(snap.alongM / model.totalDistanceM, 0, 1) : 0;
    const remainingM = snap ? Math.max(0, model.totalDistanceM - snap.alongM) : model.totalDistanceM;
    const finalPoint = asPoint(model.coordinates[model.coordinates.length - 1]);
    const stopReached = !gpsWeak && snap ? reachedStop(model, raw, snap.alongM, previous.current_stop_index) : null;
    const previousStopIndex = Number.isFinite(Number(previous.current_stop_index)) ? Number(previous.current_stop_index) : -1;
    const lastReachedIndex = stopReached ? Math.max(previousStopIndex, stopReached.index) : previousStopIndex;
    const allStopsReached = !model.stops.length || lastReachedIndex >= model.stops.length - 1;
    const arrived = !gpsWeak && onRoute && allStopsReached && remainingM <= ARRIVAL_THRESHOLD_M * 1.5 && distanceMeters(raw, finalPoint) <= ARRIVAL_THRESHOLD_M;

    let phase = previous.phase === GUIDE_PHASE.ATLAS && gpsWeak
      ? GUIDE_PHASE.ATLAS
      : arrived ? GUIDE_PHASE.ARRIVED : onRoute ? GUIDE_PHASE.GUIDE : GUIDE_PHASE.OFF_ROUTE;
    let target;
    let maneuver = null;
    if (phase === GUIDE_PHASE.ATLAS) {
      const waiting = globalSnap || pointAtAlong(model, 0);
      target = { coordinate: waiting.coordinate.slice(), alongM: waiting.alongM, kind: 'waiting' };
    } else if (phase === GUIDE_PHASE.ARRIVED) {
      target = { coordinate: model.coordinates[model.coordinates.length - 1].slice(), alongM: model.totalDistanceM, kind: 'arrival' };
    } else if (!onRoute) {
      target = { coordinate: snap.coordinate.slice(), alongM: snap.alongM, kind: 'rejoin' };
      maneuver = { type: 'rejoin', modifier: '', instruction: 'Rientra sul percorso', alongM: snap.alongM };
    } else {
      maneuver = nextManeuver(model, snap.alongM);
      let targetAlongM = Math.min(model.totalDistanceM, snap.alongM + LOOK_AHEAD_M);
      if (maneuver && maneuver.alongM - snap.alongM <= TURN_IMMINENT_M) {
        targetAlongM = Math.min(model.totalDistanceM, Math.max(targetAlongM, maneuver.alongM + TURN_LOOK_AHEAD_M));
      }
      const ahead = pointAtAlong(model, targetAlongM);
      target = { coordinate: ahead.coordinate, alongM: ahead.alongM, kind: maneuver && maneuver.alongM - snap.alongM <= TURN_IMMINENT_M ? 'turn-exit' : 'ahead' };
    }

    const targetPoint = asPoint(target.coordinate);
    const routeDistanceToTarget = onRoute && snap ? Math.max(0, target.alongM - snap.alongM) : distanceMeters(displayPoint, targetPoint);
    return {
      phase,
      position_raw: raw,
      position_snapped: snap ? { lat: snap.coordinate[1], lon: snap.coordinate[0] } : null,
      heading: heading.value,
      heading_source: heading.source,
      on_route: onRoute,
      next_point: { lat: target.coordinate[1], lon: target.coordinate[0], alongM: target.alongM, kind: target.kind },
      bearing_to_next: phase === GUIDE_PHASE.ARRIVED || phase === GUIDE_PHASE.ATLAS ? null : bearingDegrees(displayPoint, targetPoint),
      distance_to_next: phase === GUIDE_PHASE.ARRIVED ? 0 : phase === GUIDE_PHASE.ATLAS ? null : routeDistanceToTarget,
      next_maneuver: phase === GUIDE_PHASE.ARRIVED
        ? { type: 'arrive', modifier: '', instruction: 'Sei arrivato', alongM: model.totalDistanceM }
        : maneuver,
      progress_pct: Math.round(progress * 1000) / 10,
      gps_accuracy: accuracy || null,
      gps_weak: gpsWeak,
      snap_distance_m: snap ? Math.round(snap.distanceM * 10) / 10 : null,
      route_along_m: snap ? snap.alongM : 0,
      current_stop_index: stopReached ? Math.max(Number.isFinite(Number(previous.current_stop_index)) ? Number(previous.current_stop_index) : -1, stopReached.index) : previous.current_stop_index,
      reached_stop: stopReached ? stopReached.stop : null,
      off_route_streak: offRouteStreak,
      on_route_streak: onRouteStreak,
      timestamp: number(coords.timestamp) || Date.now()
    };
  }

  function routeParts(model, state) {
    if (!model || !state || !state.position_snapped) {
      return { completed: [], remaining: model ? model.coordinates.map(coordinate => coordinate.slice()) : [] };
    }
    const snapCoordinate = [state.position_snapped.lon, state.position_snapped.lat];
    const nearest = nearestOnCoordinates(model.coordinates, model.cumulative, state.position_snapped);
    const segmentIndex = nearest ? nearest.segmentIndex : 0;
    return {
      completed: model.coordinates.slice(0, segmentIndex + 1).concat([snapCoordinate]),
      remaining: [snapCoordinate].concat(model.coordinates.slice(segmentIndex + 1))
    };
  }

  global.WalkatlasGuide = Object.freeze({
    GUIDE_PHASE,
    SNAP_THRESHOLD_M,
    SNAP_ENTER_THRESHOLD_M,
    SNAP_EXIT_THRESHOLD_M,
    LOOK_AHEAD_M,
    atlasState,
    createRouteModel,
    updateState,
    routeParts,
    nearestOnCoordinates,
    pointAtAlong,
    distanceMeters,
    bearingDegrees,
    normalizeHeading
  });
})(window);
