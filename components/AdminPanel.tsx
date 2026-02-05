import React, { useState } from 'react';
import { Balise, Level } from '../types';
import { Trash2, Plus, AlertCircle } from 'lucide-react';

interface AdminPanelProps {
  balises: Balise[];
  onAdd: (number: string, level: Level) => void;
  onRemove: (id: string) => void;
  onResetAll: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ balises, onAdd, onRemove, onResetAll }) => {
  const [newNumber, setNewNumber] = useState('');
  const [newLevel, setNewLevel] = useState<Level>('N1');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newNumber.trim()) {
      onAdd(newNumber.trim(), newLevel);
      setNewNumber('');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Danger Zone */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <h3 className="text-lg font-bold text-red-800 flex items-center gap-2 mb-2">
          <AlertCircle className="w-5 h-5" /> Zone de danger
        </h3>
        <p className="text-red-600 mb-4 text-sm">Réinitialiser toutes les balises effacera tous les chronomètres et les statuts actuels.</p>
        <button 
          onClick={onResetAll}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition font-medium text-sm"
        >
          Réinitialiser la course
        </button>
      </div>

      {/* Add New */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Ajouter une Balise</h3>
        <form onSubmit={handleSubmit} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">Numéro</label>
            <input 
              type="text" 
              value={newNumber}
              onChange={(e) => setNewNumber(e.target.value)}
              placeholder="Ex: 42"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
              required
            />
          </div>
          <div className="w-32">
            <label className="block text-sm font-medium text-slate-700 mb-1">Niveau</label>
            <select 
              value={newLevel}
              onChange={(e) => setNewLevel(e.target.value as Level)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
            >
              <option value="N1">N1 (Facile)</option>
              <option value="N2">N2 (Moyen)</option>
              <option value="N3">N3 (Difficile)</option>
            </select>
          </div>
          <button 
            type="submit"
            className="bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition flex items-center gap-2 font-medium"
          >
            <Plus className="w-4 h-4" /> Ajouter
          </button>
        </form>
      </div>

      {/* List */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
          <h3 className="font-bold text-slate-700">Liste des Balises ({balises.length})</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {balises.length === 0 ? (
            <div className="p-8 text-center text-slate-400">Aucune balise configurée.</div>
          ) : (
            balises.map(balise => (
              <div key={balise.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition">
                <div className="flex items-center gap-4">
                  <span className="font-mono font-bold text-lg bg-slate-100 px-3 py-1 rounded text-slate-700">{balise.number}</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded ${
                    balise.level === 'N1' ? 'bg-green-100 text-green-700' :
                    balise.level === 'N2' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                  }`}>
                    {balise.level}
                  </span>
                  <span className="text-sm text-slate-500 capitalize">{balise.status === 'inactive' ? 'En attente' : balise.status}</span>
                </div>
                <button 
                  onClick={() => onRemove(balise.id)}
                  className="text-slate-400 hover:text-red-500 transition p-2 hover:bg-red-50 rounded-full"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
