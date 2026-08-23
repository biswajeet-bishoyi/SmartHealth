import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import RiskBadge from './RiskBadge';
import useSocket from '../hooks/useSocket';

// Fix Leaflet marker icons path issue in Vite
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
};

function MapViewController({ targetCenter, targetZoom }) {
  const map = useMap();
  useEffect(() => {
    if (targetCenter && targetCenter[0] && targetCenter[1]) {
      map.flyTo(targetCenter, targetZoom || 8, { duration: 1.2 });
    }
  }, [targetCenter, targetZoom, map]);
  return null;
}

const createColoredIcon = (score, color, isCritical) => {
  return L.divIcon({
    className: 'custom-map-pin',
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; display:flex; align-items:center; justify-content:center; color:white; font-size:10px; font-weight:900; box-shadow: 0 2px 6px rgba(0,0,0,0.35); ${isCritical ? 'animation: pulse 1.5s infinite;' : ''}">${score || ''}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const riskColors = {
  LOW: '#10b981',
  MEDIUM: '#f59e0b',
  HIGH: '#f97316',
  CRITICAL: '#ef4444',
};

const RiskMap = ({ assessments = [], center = [26.2006, 92.9376], zoom = 7 }) => {
  const { socket } = useSocket();
  const [mapCenter, setMapCenter] = useState(center);
  const [mapZoom, setMapZoom] = useState(zoom);
  const [activeState, setActiveState] = useState('All');
  const [liveAssessments, setLiveAssessments] = useState(assessments);

  useEffect(() => {
    setLiveAssessments(assessments);
  }, [assessments]);

  // Live Socket listener
  useEffect(() => {
    if (!socket) return;
    const handleRiskUpdate = (newAssessment) => {
      setLiveAssessments((prev) => {
        const idx = prev.findIndex((a) => a.village === newAssessment.village);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = newAssessment;
          return updated;
        }
        return [newAssessment, ...prev];
      });
    };

    socket.on('RISK_UPDATED', handleRiskUpdate);
    return () => socket.off('RISK_UPDATED', handleRiskUpdate);
  }, [socket]);

  const handleRegionClick = (region) => {
    setActiveState(region.state);
    setMapCenter(region.center);
    setMapZoom(region.zoom);
  };

  const getCoords = (village, idx = 0) => {
    if (VILLAGE_COORDS[village]) return VILLAGE_COORDS[village];
    return {
      lat: 26.2006 + ((idx * 0.13) % 1.5) - 0.7,
      lng: 92.9376 + ((idx * 0.17) % 2.0) - 1.0,
    };
  };

  const filteredAssessments = activeState === 'All'
    ? liveAssessments
    : liveAssessments.filter((a) => a.state === activeState);

  return (
    <div className="space-y-3">
      {/* State Filter Buttons */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <span className="text-[11px] font-bold text-gray-500 shrink-0 mr-1">Filter Region:</span>
        {NE_REGIONS.map((region) => {
          const isSelected = activeState === region.state;
          return (
            <button
              key={region.name}
              type="button"
              onClick={() => handleRegionClick(region)}
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

      <div className="w-full h-96 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-800 relative z-0 isolate">
        <MapContainer center={mapCenter} zoom={mapZoom} scrollWheelZoom={true} className="w-full h-full z-0">
          <MapViewController targetCenter={mapCenter} targetZoom={mapZoom} />

          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {filteredAssessments.map((item, idx) => {
            const coords = item.latitude && item.longitude
              ? { lat: item.latitude, lng: item.longitude }
              : getCoords(item.village, idx);
            const color = riskColors[item.riskLevel] || '#10b981';

            return (
              <React.Fragment key={item._id || idx}>
                <Marker
                  position={[coords.lat, coords.lng]}
                  icon={createColoredIcon(item.riskScore, color, item.riskLevel === 'CRITICAL')}
                >
                  <Popup>
                    <div className="p-1 max-w-xs">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <h4 className="font-bold text-sm text-gray-900">{item.village}</h4>
                        <RiskBadge level={item.riskLevel} score={item.riskScore} />
                      </div>
                      <p className="text-xs text-gray-500 mb-1">
                        District: <span className="font-semibold text-gray-700">{item.district}</span>, {item.state}
                      </p>
                      <div className="grid grid-cols-2 gap-1 text-[11px] bg-gray-50 p-2 rounded border mt-2">
                        <div>Symptom: <b>{item.symptomScore || 0}</b></div>
                        <div>Growth: <b>{item.growthScore || 0}</b></div>
                        <div>Water: <b>{item.waterScore || 0}</b></div>
                        <div>Cluster: <b>{item.clusterScore || 0}</b></div>
                      </div>
                    </div>
                  </Popup>
                </Marker>

                <Circle
                  center={[coords.lat, coords.lng]}
                  radius={Math.max(2000, (item.riskScore || 20) * 100)}
                  pathOptions={{ color, fillColor: color, fillOpacity: 0.12 }}
                />
              </React.Fragment>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
};

export default RiskMap;
