import React from 'react';
import { Flame } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface StreakDisplayProps {
  streak: number;
  lastCompleted?: string;
}

export function StreakDisplay({ streak, lastCompleted }: StreakDisplayProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-2xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-orange-100 rounded-full">
          <Flame className="w-6 h-6 text-orange-600 fill-orange-600" />
        </div>
        <div>
          <div className="text-2xl font-black leading-none">{streak}</div>
          <div className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">Day Streak</div>
        </div>
      </div>
      
      <div className="flex-1 max-w-[100px] ml-4">
        <div className="flex justify-between text-[10px] font-bold uppercase mb-1">
          <span>Progress</span>
          <span>{Math.min(streak, 7)}/7</span>
        </div>
        <Progress value={(Math.min(streak, 7) / 7) * 100} className="h-2" />
      </div>
    </div>
  );
}
