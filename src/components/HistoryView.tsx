import React from 'react';
import { motion } from 'motion/react';
import { History, Calendar, CheckCircle2, X } from 'lucide-react';
import { format } from 'date-fns';

import type { CheckIn } from '../lib/storage';
import { actionTitle } from '../lib/insights';
import { moodLabel } from '../../shared/moods';

interface HistoryViewProps {
  checkIns: CheckIn[];
  onClose: () => void;
}

export function HistoryView({ checkIns: history, onClose }: HistoryViewProps) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#0d0d14]/90 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-[#13131f] border border-white/10 rounded-[32px] p-8 max-w-md w-full h-[80vh] shadow-2xl relative flex flex-col"
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#f76a8a]/10 rounded-xl">
              <History className="w-6 h-6 text-[#f76a8a]" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">History</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-[#6b6b85] hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
          {history.length === 0 ? (
            <div className="text-center py-20 space-y-4">
              <div className="p-4 bg-white/5 rounded-full w-fit mx-auto">
                <Calendar className="w-8 h-8 text-[#6b6b85]" />
              </div>
              <p className="text-[#6b6b85] font-medium">No interventions yet.<br/>Complete your first action to see it here.</p>
            </div>
          ) : (
            history.slice().reverse().map((item) => (
              <div 
                key={item.id}
                className="bg-white/5 border border-white/5 rounded-2xl p-5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7c6af7]/10 border border-[#7c6af7]/20 text-[#a78bfa] text-[10px] font-bold uppercase tracking-wider">
                    {moodLabel(item.mood)}
                  </div>
                  <div className="text-[10px] text-[#6b6b85] font-medium">
                    {format(new Date(item.createdAt), 'MMM d, h:mm a')}
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-[#b8b8d0] leading-relaxed">
                    {actionTitle(item) ?? 'No action recorded'}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
