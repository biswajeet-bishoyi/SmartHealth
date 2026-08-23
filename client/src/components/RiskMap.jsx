import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import RiskBadge from './RiskBadge';

// Fix Leaflet marker icons path issue in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom colored SVG markers for risk levels
const createColoredIcon = (color) => {
  return L.divIcon({
    className: 'custom-map-pin',
    html: `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
};

const riskColors = {
  LOW: '#22c55e',
  MEDIUM: '#eab308',
  HIGH: '#f97316',
  CRITICAL: '#ef4444',
};

const RiskMap = ({ assessments = [], center = [26.2006, 92.9376], zoom = 7 }) => {
  return (
    <div className="w-full h-96 rounded-xl overflow-hidden shadow-sm border border-gray-200 relative z-0 isolate">
      <MapContainer center={center} zoom={zoom} scrollWheelZoom={false} className="w-full h-full z-0">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {assessments.map((item, idx) => {
          // Default lat/long fallback per NE state/district if not present
          const lat = item.latitude || 26.2006 + (idx * 0.1) % 1.5;
          const lng = item.longitude || 92.9376 + (idx * 0.15) % 2.0;

          return (
            <Marker
              key={item._id || idx}
              position={[lat, lng]}
              icon={createColoredIcon(riskColors[item.riskLevel] || '#22c55e')}
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
                    <div>Symptom score: <b>{item.symptomScore}</b></div>
                    <div>Growth score: <b>{item.growthScore}</b></div>
                    <div>Water score: <b>{item.waterScore}</b></div>
                    <div>Cluster score: <b>{item.clusterScore}</b></div>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2 italic">
                    Public-health monitoring indicator. No personal data shown.
                  </p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default RiskMap;
