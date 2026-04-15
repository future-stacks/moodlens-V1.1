import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Settings, X, Bell, Clock, Trash2, Shield, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface SettingsViewProps {
  onClose: () => void;
  onClearHistory: () => void;
}

export function SettingsView({ onClose, onClearHistory }: SettingsViewProps) {
  const [reminderTime, setReminderTime] = useState('09:00');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');

  useEffect(() => {
    const savedTime = localStorage.getItem('moodlens_reminder_time');
    if (savedTime) setReminderTime(savedTime);

    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
      setNotificationsEnabled(Notification.permission === 'granted');
    }
  }, []);

  const handleSaveTime = () => {
    localStorage.setItem('moodlens_reminder_time', reminderTime);
    toast.success(`Reminder set for ${reminderTime}`);
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      toast.error("This browser does not support notifications.");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);
      if (permission === 'granted') {
        setNotificationsEnabled(true);
        toast.success("Notifications enabled!");
        
        // Test notification
        new Notification("MoodLens", {
          body: "Reminders are now active. We'll help you stay consistent.",
          icon: "/favicon.ico"
        });
      } else {
        setNotificationsEnabled(false);
        toast.error("Notification permission denied.");
      }
    } catch (error) {
      toast.error("Failed to request permission. Try opening in a new tab.");
    }
  };

  const confirmClearHistory = () => {
    if (window.confirm("Are you sure you want to clear all history and streaks? This cannot be undone.")) {
      onClearHistory();
      onClose();
    }
  };

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
        className="bg-[#13131f] border border-white/10 rounded-[32px] p-8 max-w-md w-full shadow-2xl relative flex flex-col"
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#7c6af7]/10 rounded-xl">
              <Settings className="w-6 h-6 text-[#7c6af7]" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Settings</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-[#6b6b85] hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 space-y-8 overflow-y-auto pr-2 custom-scrollbar">
          {/* Reminders Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[#7c6af7]">
              <Clock className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-widest">Daily Reminder</h3>
            </div>
            <div className="flex gap-3">
              <Input 
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="bg-white/5 border-white/10 h-12 rounded-xl focus:border-[#7c6af7] text-white"
              />
              <Button 
                onClick={handleSaveTime}
                className="h-12 px-6 rounded-xl bg-[#7c6af7] hover:bg-[#6b58e6] text-white font-bold"
              >
                Save
              </Button>
            </div>
            <p className="text-[11px] text-[#6b6b85]">
              Set a target time for your daily check-in to maintain your streak.
            </p>
          </div>

          {/* Notifications Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[#7c6af7]">
              <Bell className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-widest">Notifications</h3>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-2xl p-5 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-white">Browser Notifications</p>
                <p className="text-xs text-[#6b6b85]">
                  {permissionStatus === 'granted' ? 'Enabled' : 'Currently disabled'}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={requestNotificationPermission}
                className={`rounded-full border-white/10 ${notificationsEnabled ? 'text-green-500' : 'text-[#7c6af7]'}`}
              >
                {notificationsEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                <span className="ml-2">{notificationsEnabled ? 'Active' : 'Enable'}</span>
              </Button>
            </div>
            {permissionStatus === 'denied' && (
              <p className="text-[10px] text-red-400/70 italic">
                Notifications are blocked by your browser. Please enable them in your site settings.
              </p>
            )}
          </div>

          {/* Data Management */}
          <div className="space-y-4 pt-4 border-t border-white/5">
            <div className="flex items-center gap-2 text-red-400">
              <Shield className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-widest">Danger Zone</h3>
            </div>
            <Button
              variant="outline"
              onClick={confirmClearHistory}
              className="w-full h-12 rounded-xl border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 transition-all"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All Data
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
