import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import api from '../utils/axiosInstance';
import useSocket from '../hooks/useSocket';
import RiskBadge from './RiskBadge';

// Fix Leaflet marker icons path issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Northeast State Centroids & Zooms
const NE_REGIONS = [
  { name: 'All NE', state: 'All', center: [26.2006, 92.9376], zoom: 7 },
  { name: 'Assam', state: 'Assam', center: [26.2006, 92.9376], zoom: 8 },
  { name: 'Meghalaya', state: 'Meghalaya', center: [25.5788, 91.8933], zoom: 9 },
  { name: 'Manipur', state: 'Manipur', center: [24.7808, 93.9063], zoom: 9 },
  { name: 'Nagaland', state: 'Nagaland', center: [25.6701, 94.1077], zoom: 9 },
  { name: 'Tripura', state: 'Tripura', center: [23.8315, 91.2868], zoom: 9 },
  { name: 'Mizoram', state: 'Mizoram', center: [23.7307, 92.7173], zoom: 9 },
  { name: 'Arunachal', state: 'Arunachal Pradesh', center: [27.0844, 93.6053], zoom: 8 },
  { name: 'Sikkim', state: 'Sikkim', center: [27.5330, 88.5122], zoom: 9 },
];

// Accurate Northeast village coordinates
const VILLAGE_COORDS = {
  'Majuli Village': { lat: 26.9194, lng: 91.7362, state: 'Assam', district: 'Kamrup' },
  'Barpeta Road':   { lat: 26.5023, lng: 90.9739, state: 'Assam', district: 'Kamrup' },
  'Teok':           { lat: 26.7459, lng: 94.2082, state: 'Assam', district: 'Jorhat' },
  'Mariani':        { lat: 26.6634, lng: 94.3128, state: 'Assam', district: 'Jorhat' },
  'Mawlai':         { lat: 25.5788, lng: 91.8933, state: 'Meghalaya', district: 'East Khasi Hills' },
  'Smit':           { lat: 25.6063, lng: 91.8400, state: 'Meghalaya', district: 'East Khasi Hills' },
  'Nambol':         { lat: 24.7808, lng: 93.7630, state: 'Manipur', district: 'Imphal West' },
  'Viswema':        { lat: 25.6486, lng: 94.0939, state: 'Nagaland', district: 'Kohima' },
  'Jirania':        { lat: 23.8103, lng: 91.3882, state: 'Tripura', district: 'West Tripura' },
  'Durtlang':       { lat: 23.7307, lng: 92.7173, state: 'Mizoram', district: 'Aizawl' },
  'Guwahati':       { lat: 26.1445, lng: 91.7362, state: 'Assam', district: 'Kamrup' },
  'Naharlagun':     { lat: 27.1044, lng: 93.6934, state: 'Arunachal Pradesh', district: 'Papum Pare' },
  'Gangtok':        { lat: 27.3389, lng: 88.6065, state: 'Sikkim', district: 'East Sikkim' },
};

// Custom Leaflet View Controller for smooth animated fly-to
function MapViewController({ targetCenter, targetZoom }) {
  const map = useMap();
  useEffect(() => {
    if (targetCenter && targetCenter[0] && targetCenter[1]) {
      map.flyTo(targetCenter, targetZoom || 8, { duration: 1.2, easeLinearity: 0.25 });
    }
  }, [targetCenter, targetZoom, map]);
  return null;
}

const createMarkerIcon = (symbol, bg, border = 'white', pulse = false) => {
  return L.divIcon({
    className: 'custom-adv-pin',
    html: `<div style="background:${bg};border:2px solid ${border};color:white;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;box-shadow:0 3px 8px rgba(0,0,0,0.35);${pulse ? 'animation: pulse 1.5s infinite;' : ''}">${symbol}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
};

const RISK_COLORS = {
  LOW: '#10b981',
  MEDIUM: '#f59e0b',
  HIGH: '#f97316',
  CRITICAL: '#ef4444',
};

export default function AdvancedMap({ center = [26.2006, 92.9376], zoom = 7 }) {
  const { socket } = useSocket();

  // Active view target
  const [mapCenter, setMapCenter] = useState(center);
  const [mapZoom, setMapZoom] = useState(zoom);
  const [activeStateFilter, setActiveStateFilter] = useState('All');
  const [searchLocation, setSearchLocation] = useState('');

  // Layer toggles
  const [layers, setLayers] = useState({
    risk: true,
    reports: true,
    predicted: true,
    vulnerability: false,
    waterSources: true,
    environment: true,
    alerts: true,
    density: true,
  });

  const [assessments, setAssessments] = useState([]);
  const [reports, setReports] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [vulnerabilities, setVulnerabilities] = useState([]);
  const [waterSources, setWaterSources] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastLiveEvent, setLastLiveEvent] = useState(null);

  // Fetch initial map datasets
  const fetchMapData = async () => {
    try {
      setLoading(true);
      const [riskRes, repRes, predRes, vulnRes, waterRes, alertRes] = await Promise.allSettled([
        api.get('/risk'),
        api.get('/reports?limit=25'),
        api.get('/predictions'),
        api.get('/vulnerability'),
        api.get('/water-sources'),
        api.get('/alerts?status=BROADCAST'),
      ]);

      if (riskRes.status === 'fulfilled' && riskRes.value.data?.success) {
        setAssessments(riskRes.value.data.data.assessments || []);
      }
      if (repRes.status === 'fulfilled' && repRes.value.data?.success) {
        setReports(repRes.value.data.data.reports || []);
      }
      if (predRes.status === 'fulfilled' && predRes.value.data?.success) {
        setPredictions(predRes.value.data.data.predictions || []);
      }
      if (vulnRes.status === 'fulfilled' && vulnRes.value.data?.success) {
        setVulnerabilities(vulnRes.value.data.data || []);
      }
      if (waterRes.status === 'fulfilled' && waterRes.value.data?.success) {
        setWaterSources(waterRes.value.data.data || []);
      }
      if (alertRes.status === 'fulfilled' && alertRes.value.data?.success) {
        setAlerts(alertRes.value.data.data.alerts || []);
      }
    } catch (err) {
      console.error('Failed to load multi-layer map data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMapData();
  }, []);

  // Real-time WebSocket Listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewReport = (newRep) => {
      setLastLiveEvent(`📍 New report logged in ${newRep.village || 'Northeast'}`);
      setReports((prev) => [newRep, ...prev.slice(0, 30)]);
      // Trigger risk recalculation fetch
      api.get('/risk').then((res) => {
        if (res.data?.success) setAssessments(res.data.data.assessments || []);
      });
    };

    const handleRiskUpdate = (newAssessment) => {
      setLastLiveEvent(`⚡ Risk score updated for ${newAssessment.village}`);
      setAssessments((prev) => {
        const idx = prev.findIndex((a) => a.village === newAssessment.village);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = newAssessment;
          return updated;
        }
        return [newAssessment, ...prev];
      });
    };

    const handleAlertBroadcast = (newAlert) => {
      setLastLiveEvent(`📢 Broadcast alert triggered for ${newAlert.village || newAlert.district}`);
      setAlerts((prev) => [newAlert, ...prev]);
    };

    socket.on('NEW_REPORT', handleNewReport);
    socket.on('WATER_REPORT_CREATED', handleNewReport);
    socket.on('RISK_UPDATED', handleRiskUpdate);
    socket.on('ALERT_BROADCAST', handleAlertBroadcast);

    return () => {
      socket.off('NEW_REPORT', handleNewReport);
      socket.off('WATER_REPORT_CREATED', handleNewReport);
      socket.off('RISK_UPDATED', handleRiskUpdate);
      socket.off('ALERT_BROADCAST', handleAlertBroadcast);
    };
  }, [socket]);

  const toggleLayer = (layerKey) => {
    setLayers((prev) => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };

  const handleStateClick = (region) => {
    setActiveStateFilter(region.state);
    setMapCenter(region.center);
    setMapZoom(region.zoom);
    setSearchLocation('');
  };

  const getCoords = (villageName, defaultIdx = 0) => {
    if (VILLAGE_COORDS[villageName]) return VILLAGE_COORDS[villageName];
    // Hash-based deterministic coordinates fallback within Northeast bounds
    let hash = 0;
    for (let i = 0; i < (villageName || '').length; i++) {
      hash = (hash << 5) - hash + villageName.charCodeAt(i);
    }
    const latOffset = ((Math.abs(hash) % 150) / 100) - 0.75;
    const lngOffset = ((Math.abs(hash >> 3) % 200) / 100) - 1.0;
    return {
      lat: center[0] + latOffset,
      lng: center[1] + lngOffset,
    };
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchLocation.trim()) return;

    const term = searchLocation.toLowerCase().trim();
    // Search in village coords or assessments
    const foundEntry = Object.entries(VILLAGE_COORDS).find(([k]) =>
      k.toLowerCase().includes(term)
    );

    if (foundEntry) {
      setMapCenter([foundEntry[1].lat, foundEntry[1].lng]);
      setMapZoom(11);
      setLastLiveEvent(`🎯 Focused on ${foundEntry[0]}`);
      return;
    }

    const foundAssessment = assessments.find(
      (a) =>
        a.village?.toLowerCase().includes(term) ||
        a.district?.toLowerCase().includes(term)
    );

    if (foundAssessment) {
      const c = getCoords(foundAssessment.village);
      setMapCenter([c.lat, c.lng]);
      setMapZoom(11);
      setLastLiveEvent(`🎯 Focused on ${foundAssessment.village}`);
    }
  };

  // State-filtered arrays
  const filterByState = (item) => {
    if (activeStateFilter === 'All') return true;
    return item.state === activeStateFilter || item.homeState === activeStateFilter;
  };

  const visibleAssessments = useMemo(() => assessments.filter(filterByState), [assessments, activeStateFilter]);
  const visibleReports = useMemo(() => reports.filter(filterByState), [reports, activeStateFilter]);
  const visibleWaterSources = useMemo(() => waterSources.filter(filterByState), [waterSources, activeStateFilter]);
  const visibleAlerts = useMemo(() => alerts.filter(filterByState), [alerts, activeStateFilter]);

  return (
    <div className="bg-white dark:bg-[#0c1f1c] border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm space-y-3.5 p-4">
      {/* ─── State Navigation Buttons & Live Status Bar ─────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#001e40] text-white flex items-center justify-center text-sm font-bold shadow-sm">
            🗺️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-extrabold text-gray-900 dark:text-white font-headline">
                Northeast India Real-Time Surveillance Map
              </h3>
              <span className="flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.2 rounded-full border border-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                LIVE SYNC
              </span>
            </div>
            <p className="text-[10px] text-gray-500">
              {lastLiveEvent || 'Click any Northeast state or toggle layers to inspect active field signals'}
            </p>
          </div>
        </div>

        {/* Quick Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-1.5">
          <input
            type="text"
            placeholder="Search village/district..."
            value={searchLocation}
            onChange={(e) => setSearchLocation(e.target.value)}
            className="form-input text-xs py-1.5 px-2.5 w-44 rounded-lg"
          />
          <button type="submit" className="btn btn-primary text-xs py-1.5 px-3 font-bold">
            Focus
          </button>
        </form>
      </div>

      {/* ─── Northeast State Quick Buttons ───────────────────────────────────── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <span className="text-[11px] font-bold text-gray-500 shrink-0 mr-1">States:</span>
        {NE_REGIONS.map((region) => {
          const isSelected = activeStateFilter === region.state;
          return (
            <button
              key={region.name}
              type="button"
              onClick={() => handleStateClick(region)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                isSelected
                  ? 'bg-[#001e40] text-white shadow-sm ring-2 ring-[#003366]/30'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {region.name}
            </button>
          );
        })}
      </div>

      {/* ─── Layer Controls Bar ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-1.5 text-[11px] pt-1">
        <span className="text-[11px] font-bold text-gray-500 mr-1">Layers:</span>
        {[
          { key: 'risk', label: '📊 Risk Scores', color: 'bg-emerald-500' },
          { key: 'reports', label: '📝 Incident Reports', color: 'bg-blue-500' },
          { key: 'waterSources', label: '💧 Water Sources', color: 'bg-cyan-500' },
          { key: 'alerts', label: '📢 Public Alerts', color: 'bg-rose-500' },
          { key: 'predicted', label: '🔮 Forecasts', color: 'bg-purple-500' },
          { key: 'density', label: '⭕ Impact Radius', color: 'bg-teal-500' },
        ].map((btn) => (
          <button
            key={btn.key}
            type="button"
            onClick={() => toggleLayer(btn.key)}
            className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
              layers[btn.key]
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-400 hover:bg-gray-200'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${layers[btn.key] ? btn.color : 'bg-gray-400'}`} />
            <span>{btn.label}</span>
          </button>
        ))}
      </div>

      {/* ─── Map Container ───────────────────────────────────────────────────── */}
      <div className="w-full h-[460px] rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 relative z-0 isolate">
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          scrollWheelZoom={true}
          className="w-full h-full z-0"
        >
          {/* Animated Fly-To Controller */}
          <MapViewController targetCenter={mapCenter} targetZoom={mapZoom} />

          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* LAYER 1: CURRENT RISK ASSESSMENTS */}
          {layers.risk &&
            visibleAssessments.map((item, idx) => {
              const coords = getCoords(item.village, idx);
              const color = RISK_COLORS[item.riskLevel] || '#10b981';

              return (
                <React.Fragment key={`risk-${item._id || idx}`}>
                  <Marker
                    position={[coords.lat, coords.lng]}
                    icon={createMarkerIcon(item.riskScore, color, 'white', item.riskLevel === 'CRITICAL')}
                  >
                    <Popup>
                      <div className="p-1 max-w-xs space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-bold text-xs text-gray-900">{item.village}</h4>
                          <RiskBadge level={item.riskLevel} score={item.riskScore} />
                        </div>
                        <p className="text-[11px] text-gray-600">
                          {item.district}, {item.state}
                        </p>
                        <div className="grid grid-cols-2 gap-1 text-[10px] bg-gray-50 p-1.5 rounded border">
                          <div>Priority: <b>{item.priorityScore || item.riskScore}</b></div>
                          <div>Symptom Score: <b>{item.symptomScore || 0}</b></div>
                          <div>Water Score: <b>{item.waterScore || 0}</b></div>
                          <div>Cluster: <b>{item.clusterScore || 0}</b></div>
                        </div>
                      </div>
                    </Popup>
                  </Marker>

                  {layers.density && (
                    <Circle
                      center={[coords.lat, coords.lng]}
                      radius={Math.max(2500, (item.riskScore || 20) * 120)}
                      pathOptions={{ color, fillColor: color, fillOpacity: 0.14 }}
                    />
                  )}
                </React.Fragment>
              );
            })}

          {/* LAYER 2: RECENT INCIDENT REPORTS */}
          {layers.reports &&
            visibleReports.map((rep, idx) => {
              const coords = rep.latitude && rep.longitude
                ? { lat: rep.latitude, lng: rep.longitude }
                : getCoords(rep.village, idx + 5);

              return (
                <Marker
                  key={`report-${rep._id || idx}`}
                  position={[coords.lat + 0.005, coords.lng - 0.005]}
                  icon={createMarkerIcon('📝', '#2563eb', 'white')}
                >
                  <Popup>
                    <div className="p-1 max-w-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xs text-blue-900">📝 Incident Report</h4>
                        <span className="text-[10px] font-mono font-bold bg-blue-100 text-blue-800 px-1.5 rounded">
                          {rep.sourceChannel || 'APP'}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-800">
                        Village: <b>{rep.village}</b> ({rep.district})
                      </p>
                      <p className="text-[10px] text-gray-600">
                        Symptoms: <b>{rep.symptoms?.join(', ') || 'Observed'}</b>
                      </p>
                      <p className="text-[10px] text-gray-600">
                        Affected: <b>{rep.affectedPeople || 1} people</b> | Water: <b>{rep.waterSource || 'Well'}</b>
                      </p>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

          {/* LAYER 3: WATER SOURCES */}
          {layers.waterSources &&
            visibleWaterSources.map((ws, idx) => {
              const coords = ws.latitude && ws.longitude
                ? { lat: ws.latitude, lng: ws.longitude }
                : getCoords(ws.village, idx + 60);

              const wsColor = ws.currentRiskScore >= 60 ? '#ef4444' : ws.currentRiskScore >= 30 ? '#06b6d4' : '#10b981';

              return (
                <Marker
                  key={`ws-${ws._id || idx}`}
                  position={[coords.lat, coords.lng + 0.008]}
                  icon={createMarkerIcon('💧', wsColor, 'white')}
                >
                  <Popup>
                    <div className="p-1 max-w-xs space-y-1">
                      <h4 className="font-bold text-xs text-cyan-900">💧 {ws.name}</h4>
                      <p className="text-[11px]">Type: <b>{ws.type}</b> | Status: <b>{ws.status}</b></p>
                      <p className="text-[10px] text-gray-600">Risk Score: <b>{ws.currentRiskScore}/100</b></p>
                      {ws.lastInspectionResult && (
                        <p className="text-[10px] bg-cyan-50 p-1 rounded italic text-cyan-900">{ws.lastInspectionResult}</p>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })}

          {/* LAYER 4: ACTIVE PUBLIC ALERTS */}
          {layers.alerts &&
            visibleAlerts.map((alt, idx) => {
              const coords = getCoords(alt.village || alt.district, idx + 80);
              return (
                <Marker
                  key={`alert-${alt._id || idx}`}
                  position={[coords.lat - 0.008, coords.lng + 0.012]}
                  icon={createMarkerIcon('📢', '#e11d48', 'yellow', true)}
                >
                  <Popup>
                    <div className="p-1 max-w-xs space-y-1">
                      <div className="flex items-center gap-1.5 text-rose-700 font-extrabold text-xs">
                        <span>📢</span>
                        <span>LIVE BROADCAST ALERT</span>
                      </div>
                      <p className="font-bold text-[11px] text-gray-900">{alt.title}</p>
                      <p className="text-[10px] text-gray-600 leading-snug">{alt.message}</p>
                      {alt.village && (
                        <span className="text-[9px] bg-rose-50 text-rose-800 px-1.5 py-0.5 rounded font-semibold block">
                          📍 {alt.village}, {alt.district}
                        </span>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })}

          {/* LAYER 5: PREDICTIONS (Forecasts) */}
          {layers.predicted &&
            predictions.map((pred, idx) => {
              if (pred.insufficientData || !pred.predictedScore) return null;
              const coords = getCoords(pred.village, idx + 20);
              const pColor = RISK_COLORS[pred.predictedLevel] || '#a855f7';

              return (
                <Marker
                  key={`pred-${pred._id || idx}`}
                  position={[coords.lat + 0.012, coords.lng + 0.012]}
                  icon={createMarkerIcon('🔮', '#8b5cf6', pColor)}
                >
                  <Popup>
                    <div className="p-1 max-w-xs space-y-1.5">
                      <h4 className="font-bold text-xs text-purple-900">🔮 7-Day Forecast: {pred.village}</h4>
                      <p className="text-[11px] text-gray-600">
                        Projected Level: <span className="font-bold text-purple-700">{pred.predictedLevel} ({pred.predictedScore}/100)</span>
                      </p>
                      <p className="text-[10px] text-gray-500">Confidence: <b>{pred.confidence}%</b></p>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
        </MapContainer>
      </div>

      <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 pt-1">
        <span>📍 Map auto-syncs live incident reports, water testing results, and broadcast warnings across Northeast India.</span>
        <span className="font-semibold text-[#003366] dark:text-[#a7c8ff]">
          {visibleAssessments.length} Risk Points • {visibleReports.length} Reports Active
        </span>
      </div>
    </div>
  );
}
