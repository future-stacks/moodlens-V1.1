import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, Lock, X, LogIn, UserPlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface AuthViewProps {
  onClose: () => void;
  onAuthSuccess: (username: string) => void;
}

export function AuthView({ onClose, onAuthSuccess }: AuthViewProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    // Simple local auth logic
    const users = JSON.parse(localStorage.getItem('moodlens_users') || '{}');

    if (isLogin) {
      if (users[username] && users[username] === password) {
        toast.success(`Welcome back, ${username}!`);
        onAuthSuccess(username);
        onClose();
      } else {
        toast.error("Invalid username or password");
      }
    } else {
      if (users[username]) {
        toast.error("Username already exists");
      } else {
        users[username] = password;
        localStorage.setItem('moodlens_users', JSON.stringify(users));
        toast.success("Account created successfully!");
        onAuthSuccess(username);
        onClose();
      }
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
        className="bg-[#13131f] border border-white/10 rounded-[32px] p-8 max-w-sm w-full shadow-2xl relative"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-[#6b6b85] hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-8">
          <div className="inline-flex p-4 bg-[#7c6af7]/10 rounded-2xl mb-4">
            {isLogin ? <LogIn className="w-8 h-8 text-[#7c6af7]" /> : <UserPlus className="w-8 h-8 text-[#7c6af7]" />}
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="text-[#6b6b85] text-sm mt-2">
            {isLogin ? "Sign in to sync your progress" : "Join MoodLens to track your growth"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b6b85]" />
              <Input 
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-11 bg-white/5 border-white/10 h-12 rounded-xl focus:border-[#7c6af7]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b6b85]" />
              <Input 
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-11 bg-white/5 border-white/10 h-12 rounded-xl focus:border-[#7c6af7]"
              />
            </div>
          </div>

          <Button 
            type="submit"
            className="w-full h-12 rounded-xl bg-[#7c6af7] hover:bg-[#6b58e6] text-white font-bold"
          >
            {isLogin ? "Sign In" : "Register"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-[#6b6b85] hover:text-[#7c6af7] transition-colors"
          >
            {isLogin ? "Don't have an account? Register" : "Already have an account? Sign In"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
