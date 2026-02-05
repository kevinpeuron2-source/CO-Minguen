import React, { useMemo } from 'react';
import { Balise } from '../types';
import { POINTS_PER_LEVEL } from '../constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Award, Clock, AlertTriangle } from 'lucide-react';

interface StatsDashboardProps {
  balises: Balise[];
}

export const StatsDashboard: React.FC<StatsDashboardProps> = ({ balises }) => {
  const stats = useMemo(() => {
    const found = balises.filter(b => b.status === 'found');
    const timeouts = balises.filter(b => b.status === 'timeout');
    
    const totalPoints = found.reduce((sum, b) => sum + POINTS_PER_LEVEL[b.level], 0);
    const totalDuration = found.reduce((sum, b) => sum + b.duration, 0);
    const avgTime = found.length > 0 ? Math.round(totalDuration / found.length) : 0;

    return {
      totalFound: found.length,
      totalTimeout: timeouts.length,
      totalPoints,
      avgTime,
      count: balises.length
    };
  }, [balises]);

  const chartData = useMemo(() => {
    const levels = ['N1', 'N2', 'N3'];
    return levels.map(level => {
      const levelBalises = balises.filter(b => b.level === level);
      const found = levelBalises.filter(b => b.status === 'found').length;
      return {
        name: level,
        trouvé: found,
        total: levelBalises.length,
        color: level === 'N1' ? '#16a34a' : level === 'N2' ? '#2563eb' : '#9333ea'
      };
    });
  }, [balises]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-full">
            <Award className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Score Total</p>
            <p className="text-2xl font-bold text-slate-900">{stats.totalPoints} pts</p>
            <p className="text-xs text-slate-400">{stats.totalFound} balises trouvées</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
            <Clock className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Temps Moyen</p>
            <p className="text-2xl font-bold text-slate-900">{formatTime(stats.avgTime)}</p>
            <p className="text-xs text-slate-400">par balise validée</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-red-100 text-red-600 rounded-full">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Échecs / Timeout</p>
            <p className="text-2xl font-bold text-slate-900">{stats.totalTimeout}</p>
            <p className="text-xs text-slate-400">sur {stats.count} tentatives possibles</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-6">Performance par Niveau</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} allowDecimals={false} />
              <Tooltip 
                cursor={{ fill: '#f1f5f9' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="trouvé" name="Balises Trouvées" radius={[4, 4, 0, 0]} maxBarSize={60}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};