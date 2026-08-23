import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="w-full bg-[#00142b] text-[#cbdbf5] border-t border-[#003366] mt-16 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Col 1: Brand & Tagline */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#003366] border border-[#799dd6]/30 flex items-center justify-center text-white text-base shadow-sm">
                <i className="fa-solid fa-shield-halved text-[#6cf8bb] text-sm" />
              </div>
              <span className="font-extrabold text-sm tracking-tight text-white font-headline">
                SmartHealth<span className="text-[#6cf8bb]">NE</span>
              </span>
            </div>
            <p className="text-xs text-[#a7c8ff] leading-relaxed max-w-sm">
              Integrated early warning sentinel surveillance and rapid response network across Northeast India.
            </p>
          </div>

          {/* Col 2: Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3 font-headline">
              Surveillance Links
            </h4>
            <ul className="space-y-2 text-xs text-[#cbdbf5]">
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  Command Overview
                </Link>
              </li>
              <li>
                <Link to="/report" className="hover:text-white transition-colors">
                  Report Incident
                </Link>
              </li>
              <li>
                <Link to="/alerts" className="hover:text-white transition-colors">
                  Active Broadcasts
                </Link>
              </li>
              <li>
                <Link to="/resources" className="hover:text-white transition-colors">
                  Knowledge Center
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Contact */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3 font-headline">
              Sentinel Command & Support
            </h4>
            <ul className="space-y-2 text-xs text-[#cbdbf5]">
              <li className="flex items-center gap-2">
                <i className="fa-solid fa-envelope text-[#799dd6] text-xs" />
                <a href="mailto:sentinel@smarthealthne.gov.in" className="hover:text-white">
                  sentinel@smarthealthne.gov.in
                </a>
              </li>
              <li className="flex items-center gap-2">
                <i className="fa-solid fa-phone text-[#799dd6] text-xs" />
                <span>1075 / 104 (24/7 National Health Emergency)</span>
              </li>
              <li className="flex items-center gap-2">
                <i className="fa-solid fa-location-dot text-[#799dd6] text-xs" />
                <span>Guwahati Regional Command Hub, Assam, India</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 mt-8 border-t border-[#003366] text-center text-[11px] text-[#799dd6]">
          © 2026 Smart Community Health Monitoring & Early Warning System • Integrated Northeast Sentinel Platform
        </div>
      </div>
    </footer>
  );
}
