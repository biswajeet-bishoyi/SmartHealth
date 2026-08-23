import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import api from '../utils/axiosInstance';
import RiskBadge from './RiskBadge';
import DataQualityBadge from './DataQualityBadge';

// Coordinate lookup for Northeast India demo villages
const VILLAGE_COORDS = {
  'Majuli Village': { lat: 26.9194, lng: 91.7362 },
  'Barpeta Road':   { lat: 26.5023, lng: 90.9739 },
  'Teok':           { lat: 26.7459, lng: 94.2082 },
  'Mariani':        { lat: 26.6634, lng: 94.3128 },
  'Mawlai':         { lat: 25.5788, lng: 91.8933 },
  'Smit':           { lat: 25.6063, lng: 91.8400 },
  'Nambol':         { lat: 24.7808, lng: 93.7630 },
  'Viswema':        { lat: 25.6486, lng: 94.0939 },
  'Jirania':        { lat: 23.8103, lng: 91.3882 },
  'Durtlang':       { lat: 23.7307, lng: 92.7173 },
};

const createMarkerIcon = (symbol, bg, border = 'white') => {
  return L.divIcon({
    className: 'custom-adv-pin',
    html: `<div style="background:${bg};border:2px solid ${border};color:white;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:bold;box-shadow:0 3px 6px rgba(0,0,0,0.3);">${symbol}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const RISK_COLORS = {
  LOW: '#10b981',
  MEDIUM: '#f59e0b',
  HIGH: '#f97316',
  CRITICAL: '#ef4444',
};

export default function AdvancedMap({ center = [26.2006, 92.9376], zoom = 7 }) {
  // Layer toggles
  const [layers, setLayers] = useState({
    risk: true,
    predicted: true,
    vulnerability: false,
    waterSources: true,
    environment: true,
    alerts: false,
    density: false,
  });

  const [assessments, setAssessments] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [vulnerabilities, setVulnerabilities] = useState([]);
  const [waterSources, setWaterSources] = useState([]);
  const [envObservations, setEnvObservations] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMapData = async () => {
      try {
        setLoading(true);
        const [riskRes, predRes, vulnRes, waterRes, alertRes] = await Promise.allSettled([
          api.get('/risk'),
          api.get('/predictions'),
          api.get('/vulnerability'),
          api.get('/water-sources'),
          api.get('/alerts?status=BROADCAST'),
        ]);

        if (riskRes.status === 'fulfilled' && riskRes.value.data?.success) {
          setAssessments(riskRes.value.data.data.assessments || []);
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

    fetchMapData();
  }, []);

  const toggleLayer = (layerKey) => {
    setLayers(prev => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };

  const getCoords = (village, defaultIdx = 0) => {
    if (VILLAGE_COORDS[village]) return VILLAGE_COORDS[village];
    return {
      lat: center[0] + ((defaultIdx * 0.13) % 1.5) - 0.7,
      lng: center[1] + ((defaultIdx * 0.17) % 2.0) - 1.0,
    };
  };

  return (
    <div className="bg-white dark:bg-[#0c1f1c] border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm space-y-3 p-4">
      {/* Layer Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
        <div>
          <h3 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
            <span>🗺️</span> 7-Layer Surveillance Map (Northeast India)
          </h3>
          <p className="text-[10px] text-gray-500">Toggle surveillance overlays in real-time</p>
        </div>

        <div className="flex flex-wrap gap-1 text-[11px]">
          {[
            { key: 'risk', label: '📊 Risk Score', color: 'bg-emerald-500' },
            { key: 'predicted', label: '🔮 Predicted Risk', color: 'bg-purple-500' },
            { key: 'vulnerability', label: '🏘️ Vulnerability', color: 'bg-amber-500' },
            { key: 'waterSources', label: '💧 Water Sources', color: 'bg-cyan-500' },
            { key: 'environment', label: '🌧️ Flood/Rain', color: 'bg-indigo-500' },
            { key: 'alerts', label: '📢 Active Alerts', color: 'bg-rose-500' },
            { key: 'density', label: '⭕ Impact Radius', color: 'bg-teal-500' },
          ].map(btn => (
            <button
              key={btn.key}
              type="button"
              onClick={() => toggleLayer(btn.key)}
              className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                layers[btn.key]
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${layers[btn.key] ? btn.color : 'bg-gray-400'}`} />
              <span>{btn.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Map Container */}
      <div className="w-full h-[420px] rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 relative z-0 isolate">
        <MapContainer center={center} zoom={zoom} scrollWheelZoom={false} className="w-full h-full z-0">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* LAYER 1: CURRENT RISK ASSESSMENTS */}
          {layers.risk && assessments.map((item, idx) => {
            const coords = getCoords(item.village, idx);
            const color = RISK_COLORS[item.riskLevel] || '#10b981';

            return (
              <React.Fragment key={`risk-${item._id || idx}`}>
                <Marker
                  position={[coords.lat, coords.lng]}
                  icon={createMarkerIcon(item.riskScore, color)}
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
                        <div>Priority Score: <b>{item.priorityScore || item.riskScore}</b></div>
                        <div>Env Risk: <b>{item.environmentalRisk || 0}</b></div>
                        <div>Vuln Score: <b>{item.vulnerabilityScore || 0}</b></div>
                        <div>Reports: <b>{item.reportCount || 0}</b></div>
                      </div>
                    </div>
                  </Popup>
                </Marker>

                {layers.density && (
                  <Circle
                    center={[coords.lat, coords.lng]}
                    radius={Math.max(2000, (item.riskScore || 20) * 100)}
                    pathOptions={{ color, fillColor: color, fillOpacity: 0.12 }}
                  />
                )}
              </React.Fragment>
            );
          })}

          {/* LAYER 2: PREDICTIONS (3-7 day forecast) */}
          {layers.predicted && predictions.map((pred, idx) => {
            if (pred.insufficientData || !pred.predictedScore) return null;
            const coords = getCoords(pred.village, idx + 20);
            const pColor = RISK_COLORS[pred.predictedLevel] || '#a855f7';

            return (
              <Marker
                key={`pred-${pred._id || idx}`}
                position={[coords.lat + 0.015, coords.lng + 0.015]}
                icon={createMarkerIcon('🔮', '#8b5cf6', pColor)}
              >
                <Popup>
                  <div className="p-1 max-w-xs space-y-1.5">
                    <h4 className="font-bold text-xs text-purple-900">🔮 7-Day Forecast: {pred.village}</h4>
                    <p className="text-[11px] text-gray-600">
                      Projected Level: <span className="font-bold text-purple-700">{pred.predictedLevel} ({pred.predictedScore}/100)</span>
                    </p>
                    <p className="text-[10px] text-gray-500">Confidence: <b>{pred.confidence}%</b></p>
                    <p className="text-[9px] text-gray-400 italic">Statistical extrapolation — experimental prototype.</p>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* LAYER 3: VULNERABILITY PROFILES */}
          {layers.vulnerability && vulnerabilities.map((v, idx) => {
            const coords = getCoords(v.village, idx + 40);
            return (
              <Marker
                key={`vuln-${v._id || idx}`}
                position={[coords.lat - 0.015, coords.lng - 0.015]}
                icon={createMarkerIcon('🏘️', '#d97706', '#fbbf24')}
              >
                <Popup>
                  <div className="p-1 max-w-xs space-y-1">
                    <h4 className="font-bold text-xs text-amber-900">🏘️ Vulnerability: {v.village}</h4>
                    <p className="text-[11px]">Score: <b>{v.vulnerabilityScore}/100</b> ({v.vulnerabilityLevel})</p>
                    <p className="text-[10px] text-gray-500">Population: {v.population} | Dist to Clinic: {v.distanceToHealthFacilityKm}km</p>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* LAYER 4: WATER SOURCES */}
          {layers.waterSources && waterSources.map((ws, idx) => {
            const coords = ws.latitude && ws.longitude
              ? { lat: ws.latitude, lng: ws.longitude }
              : getCoords(ws.village, idx + 60);

            const wsColor = ws.currentRiskScore >= 60 ? '#ef4444' : ws.currentRiskScore >= 30 ? '#06b6d4' : '#10b981';

            return (
              <Marker
                key={`ws-${ws._id || idx}`}
                position={[coords.lat, coords.lng + 0.01]}
                icon={createMarkerIcon('💧', wsColor, 'white')}
              >
                <Popup>
                  <div className="p-1 max-w-xs space-y-1">
                    <h4 className="font-bold text-xs text-cyan-900">💧 {ws.name}</h4>
                    <p className="text-[11px]">Type: <b>{ws.type}</b> | Status: <b>{ws.status}</b></p>
                    <p className="text-[10px] text-gray-600">Risk: <b>{ws.currentRiskScore}/100 ({ws.currentRiskLevel})</b></p>
                    {ws.lastInspectionResult && (
                      <p className="text-[10px] bg-cyan-50 p-1 rounded italic text-cyan-900">{ws.lastInspectionResult}</p>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* LAYER 5: ACTIVE ALERTS */}
          {layers.alerts && alerts.map((alt, idx) => {
            const coords = getCoords(alt.village || alt.district, idx + 80);
            return (
              <Marker
                key={`alert-${alt._id || idx}`}
                position={[coords.lat - 0.01, coords.lng + 0.02]}
                icon={createMarkerIcon('📢', '#e11d48', 'yellow')}
              >
                <Popup>
                  <div className="p-1 max-w-xs space-y-1">
                    <h4 className="font-bold text-xs text-rose-800">📢 BROADCAST ALERT</h4>
                    <p className="font-semibold text-[11px] text-gray-900">{alt.title}</p>
                    <p className="text-[10px] text-gray-600">{alt.message}</p>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 pt-1">
        <span>📍 Map reflects real-time aggregated public health observations (no individual PII).</span>
        <span className="font-semibold text-primary">Prototype GIS Layer</span>
      </div>
    </div>
  );
}
