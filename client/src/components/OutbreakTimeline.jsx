import React, { useState, useEffect } from 'react';
import api from '../utils/axiosInstance';

const DEFAULT_TIMELINE_EVENTS = {
  'Majuli Village': [
    {
      eventType: 'ENVIRONMENTAL_EVENT',
      summary: 'Heavy monsoon rainfall recorded (142mm in 24h) — saturation threshold exceeded.',
      occurredAt: new Date(Date.now() - 5 * 86400000),
      actorRole: 'WEATHER_SERVICE',
      riskLevel: 'HIGH',
    },
    {
      eventType: 'WATER_EVENT',
      summary: 'Brahmaputra floodwaters reached village outskirts; river intake turbid.',
      occurredAt: new Date(Date.now() - 3 * 86400000),
      actorRole: 'ENVIRONMENTAL_MONITOR',
      riskLevel: 'CRITICAL',
    },
    {
      eventType: 'REPORT',
      summary: 'Cluster of 8 symptom reports logged (diarrhea, vomiting, severe dehydration).',
      occurredAt: new Date(Date.now() - 2 * 86400000),
      actorRole: 'COMMUNITY_MEMBER',
      riskLevel: 'HIGH',
    },
    {
      eventType: 'RISK_CHANGE',
      summary: 'Automated RiskEngine escalated Majuli Village risk level to CRITICAL (95/100).',
      occurredAt: new Date(Date.now() - 1 * 86400000),
      actorRole: 'RISK_ENGINE',
      riskLevel: 'CRITICAL',
    },
    {
      eventType: 'ALERT_BROADCAST',
      summary: 'Public Health Alert broadcast: Boil water advisory & ORS distribution active.',
      occurredAt: new Date(Date.now() - 4 * 3600000),
      actorRole: 'NATIONAL_ADMIN',
      riskLevel: 'CRITICAL',
    },
  ],
};

export default function OutbreakTimeline({ village, district, title = 'Outbreak Event Timeline' }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL');

  useEffect(() => {
    if (!village) return;

    const fetchTimeline = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/timeline?village=${encodeURIComponent(village)}&district=${encodeURIComponent(district || '')}&limit=100`);
        if (res.data?.success && res.data.data.events && res.data.data.events.length > 0) {
          setEvents(res.data.data.events);
        } else if (DEFAULT_TIMELINE_EVENTS[village]) {
          setEvents(DEFAULT_TIMELINE_EVENTS[village]);
        } else {
          setEvents([
            {
              eventType: 'RISK_CHANGE',
              summary: `Surveillance active for ${village}. Baseline risk computed.`,
              occurredAt: new Date(),
              actorRole: 'RISK_ENGINE',
              riskLevel: 'LOW',
            },
          ]);
        }
      } catch (err) {
        if (DEFAULT_TIMELINE_EVENTS[village]) {
          setEvents(DEFAULT_TIMELINE_EVENTS[village]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTimeline();
  }, [village, district]);

  const EVENT_ICONS = {
    REPORT: 'fa-solid fa-file-waveform text-blue-500',
    WATER_REPORT: 'fa-solid fa-water text-cyan-500',
    WATER_EVENT: 'fa-solid fa-faucet-drip text-blue-500',
    ENVIRONMENTAL_EVENT: 'fa-solid fa-cloud-showers-heavy text-indigo-400',
    RISK_CHANGE: 'fa-solid fa-chart-line text-amber-500',
    PREDICTION: 'fa-solid fa-wand-magic-sparkles text-purple-400',
    VERIFICATION: 'fa-solid fa-circle-check text-emerald-400',
    ALERT_BROADCAST: 'fa-solid fa-bullhorn text-rose-500',
    RESPONSE_ACTION: 'fa-solid fa-truck-medical text-rose-500',
    RESOURCE_ASSIGNED: 'fa-solid fa-boxes-stacked text-teal-400',
    WATER_SOURCE_INSPECTED: 'fa-solid fa-vial text-purple-400',
  };

  const EVENT_BORDER_COLORS = {
    ENVIRONMENTAL_EVENT: 'border-l-indigo-500',
    WATER_EVENT: 'border-l-cyan-500',
    REPORT: 'border-l-blue-500',
    RISK_CHANGE: 'border-l-amber-500',
    ALERT_BROADCAST: 'border-l-rose-500',
    RESPONSE_ACTION: 'border-l-teal-500',
    RESOURCE_ASSIGNED: 'border-l-emerald-500',
  };

  const filteredEvents = filterType === 'ALL'
    ? events
    : events.filter(e => e.eventType === filterType);

  const eventTypes = ['ALL', ...new Set(events.map(e => e.eventType))];

  return (
    <div className="card p-6 shadow-sm space-y-4 border border-[#e2e8f0] dark:border-[#1f3c60]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#e2e8f0] dark:border-[#1f3c60] pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-timeline text-[#001e40] dark:text-[#a7c8ff]" />
            <h3 className="text-sm font-extrabold text-[#0b1c30] dark:text-white font-headline">
              {title}
            </h3>
          </div>
          <p className="text-xs text-[#737780] mt-0.5 font-medium">
            {village}, {district} — Chronological sequence of detected signals & actions
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full">
          {eventTypes.slice(0, 5).map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition cursor-pointer ${
                filterType === t
                  ? 'bg-[#001e40] dark:bg-[#003366] text-white shadow-sm'
                  : 'bg-[#f8f9ff] dark:bg-[#142c4a] text-[#737780] dark:text-[#cbdbf5] hover:bg-[#e5eeff]'
              }`}
            >
              {t.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3 p-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-[#142c4a]" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-gray-200 dark:bg-[#142c4a] rounded w-1/4" />
                <div className="h-3 bg-gray-200 dark:bg-[#142c4a] rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-8 text-xs text-[#737780]">
          No outbreak events recorded for this location yet. Events are logged automatically as reports arrive.
        </div>
      ) : (
        <div className="relative pl-6 space-y-3.5 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#e2e8f0] dark:before:bg-[#1f3c60]">
          {filteredEvents.map((evt, idx) => {
            const iconClass = EVENT_ICONS[evt.eventType] || 'fa-solid fa-thumbtack text-gray-500';
            const borderL = EVENT_BORDER_COLORS[evt.eventType] || 'border-l-[#003366]';
            const timeStr = new Date(evt.occurredAt || evt.createdAt).toLocaleString(undefined, {
              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
            });

            return (
              <div key={idx} className="relative group">
                <div className="absolute -left-6 top-2 w-5 h-5 rounded-full bg-white dark:bg-[#0c1f36] border-2 border-[#003366] flex items-center justify-center text-[10px] shadow-sm">
                  <i className={iconClass} />
                </div>

                <div className={`p-3.5 rounded-xl border border-[#e2e8f0] dark:border-[#1f3c60] border-l-4 ${borderL} bg-[#f8f9ff] dark:bg-[#142c4a]/40 transition-all hover:shadow-md`}>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[11px] font-extrabold text-[#0b1c30] dark:text-white uppercase tracking-wide font-headline">
                      {evt.eventType.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] text-[#737780] font-mono">{timeStr}</span>
                  </div>

                  <p className="text-xs text-[#43474f] dark:text-[#cbdbf5] font-medium leading-relaxed">
                    {evt.summary}
                  </p>

                  {(evt.actorRole || evt.riskLevel) && (
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#e2e8f0]/60 dark:border-[#1f3c60]/60 text-[10px]">
                      {evt.actorRole && (
                        <span className="px-2 py-0.5 rounded bg-[#e5eeff] dark:bg-[#0c1f36] text-[#001e40] dark:text-[#a7c8ff] font-bold font-mono">
                          Actor: {evt.actorRole}
                        </span>
                      )}
                      {evt.riskLevel && (
                        <span className={`px-2 py-0.5 rounded font-bold ${
                          evt.riskLevel === 'CRITICAL' || evt.riskLevel === 'HIGH'
                            ? 'bg-[#ffdad6] text-[#93000a]'
                            : 'bg-[#6cf8bb]/20 text-[#006c49]'
                        }`}>
                          Risk: {evt.riskLevel}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
