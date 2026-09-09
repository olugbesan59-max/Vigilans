import React, { useState, useEffect } from 'react';
import { Search, X, Users, CheckSquare, MessageSquare, Bell, ArrowRight } from 'lucide-react';
import { apiRequest } from '../../api';

export const GlobalSearchModal = ({ isOpen, onClose, onSelectResult, onNavigate }) => {
  const [query, setQuery] = useState('');
  const [staff, setStaff] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    if (isOpen) {
      // Pre-load searchable data
      apiRequest('/staff').then(res => setStaff(res || [])).catch(() => {});
      apiRequest('/tasks').then(res => setTasks(res?.tasks || res || [])).catch(() => {});
      apiRequest('/announcements').then(res => setAnnouncements(res || [])).catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const cleanQuery = query.trim().toLowerCase();

  const handleSelect = (tab, item) => {
    if (onSelectResult) {
      onSelectResult(tab, item);
    }
    if (onNavigate) {
      onNavigate(tab);
    }
    onClose();
  };

  const filteredStaff = cleanQuery
    ? staff.filter(s => 
        `${s.first_name || s.fullName || ''} ${s.last_name || ''}`.toLowerCase().includes(cleanQuery) || 
        (s.role_title || s.roleTitle || '').toLowerCase().includes(cleanQuery) || 
        (s.department || '').toLowerCase().includes(cleanQuery)
      )
    : [];

  const filteredTasks = cleanQuery
    ? tasks.filter(t => 
        (t.title || '').toLowerCase().includes(cleanQuery) || 
        (t.description || '').toLowerCase().includes(cleanQuery)
      )
    : [];

  const filteredAnnouncements = cleanQuery
    ? announcements.filter(a => 
        (a.title || '').toLowerCase().includes(cleanQuery) || 
        (a.content || '').toLowerCase().includes(cleanQuery)
      )
    : [];

  const hasResults = filteredStaff.length > 0 || filteredTasks.length > 0 || filteredAnnouncements.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden animate-slide-down">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-800">
          <Search size={20} className="text-slate-400 flex-shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Type to search staff, roles, tasks, announcements..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-xs text-slate-500 hover:text-slate-300 px-1.5 py-0.5 rounded"
            >
              Clear
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Results Container */}
        <div className="p-4 max-h-96 overflow-y-auto space-y-4">
          {!query ? (
            <div className="py-10 text-center text-slate-500 text-xs">
              Search by employee name, job title (e.g. Product Designer), task, or company broadcast.
            </div>
          ) : !hasResults ? (
            <div className="py-10 text-center text-slate-500 text-xs">
              No matching records found for "{query}".
            </div>
          ) : (
            <>
              {/* Staff Matches */}
              {filteredStaff.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
                    <Users size={14} className="text-indigo-400" />
                    <span>Staff Directory ({filteredStaff.length})</span>
                  </div>
                  <div className="space-y-1">
                    {filteredStaff.map(s => (
                      <div
                        key={s.id}
                        onClick={() => handleSelect('staff', s)}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800/80 cursor-pointer transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <img 
                            src={s.profile_picture || s.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'} 
                            alt="" 
                            className="w-8 h-8 rounded-full object-cover border border-slate-700" 
                          />
                          <div>
                            <p className="font-semibold text-xs text-white group-hover:text-indigo-400">
                              {s.first_name ? `${s.first_name} ${s.last_name}` : s.fullName}
                            </p>
                            <p className="text-[11px] text-slate-400">{s.role_title || s.roleTitle} • {s.department}</p>
                          </div>
                        </div>
                        <ArrowRight size={14} className="text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tasks Matches */}
              {filteredTasks.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
                    <CheckSquare size={14} className="text-indigo-400" />
                    <span>Tasks ({filteredTasks.length})</span>
                  </div>
                  <div className="space-y-1">
                    {filteredTasks.map(t => (
                      <div
                        key={t.id}
                        onClick={() => handleSelect('tasks', t)}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800/80 cursor-pointer transition-colors group"
                      >
                        <div>
                          <p className="font-semibold text-xs text-white group-hover:text-indigo-400">{t.title}</p>
                          <p className="text-[11px] text-slate-400 capitalize">Status: {(t.status || '').replace('_', ' ')} • Priority: {t.priority}</p>
                        </div>
                        <ArrowRight size={14} className="text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Announcements Matches */}
              {filteredAnnouncements.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
                    <Bell size={14} className="text-indigo-400" />
                    <span>Announcements ({filteredAnnouncements.length})</span>
                  </div>
                  <div className="space-y-1">
                    {filteredAnnouncements.map(a => (
                      <div
                        key={a.id}
                        onClick={() => handleSelect('announcements', a)}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800/80 cursor-pointer transition-colors group"
                      >
                        <div>
                          <p className="font-semibold text-xs text-white group-hover:text-indigo-400">{a.title}</p>
                          <p className="text-[11px] text-slate-400 line-clamp-1">{a.content}</p>
                        </div>
                        <ArrowRight size={14} className="text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GlobalSearchModal;
