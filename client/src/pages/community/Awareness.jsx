import React, { useState, useEffect } from 'react';
import { awarenessService } from '../../services/awarenessService';

const CATEGORIES = [
  'All',
  'Safe Water',
  'Hygiene',
  'Food Safety',
  'Water-Borne Disease Awareness',
  'Emergency Warning Signs',
];

const Awareness = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        const params = {};
        if (selectedCategory !== 'All') params.category = selectedCategory;
        const res = await awarenessService.getContent(params);
        if (res.success) {
          setContent(res.data.content || []);
        }
      } catch (err) {
        console.error('Error fetching awareness content:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [selectedCategory]);

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Health Awareness & Education</h1>
        <p className="page-subtitle">Verified preventive guidelines and safety tips for rural communities</p>
      </div>

      {/* Disclaimer Alert */}
      <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-xl text-amber-900 text-xs">
        <span className="font-bold block mb-1">📢 Educational Notice</span>
        The articles below provide public-health education and preventive guidelines from credible health authorities. They do not constitute personalized medical diagnosis or treatment.
      </div>

      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-brand-700 text-white shadow'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Articles Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-48 skeleton"></div>
          <div className="h-48 skeleton"></div>
        </div>
      ) : content.length === 0 ? (
        <div className="card text-center py-12 text-gray-500 text-sm">
          No educational content found for this category.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {content.map((item) => (
            <div key={item._id} className="card hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-brand-50 text-brand-800 border border-brand-200">
                    {item.category}
                  </span>
                  {item.source && (
                    <span className="text-[10px] text-gray-400">Source: {item.source}</span>
                  )}
                </div>
                <h3 className="font-bold text-gray-900 text-base mb-2">{item.title}</h3>
                <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Awareness;
