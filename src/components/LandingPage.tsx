import React from 'react';
import { motion } from 'motion/react';
import { Brain, Zap, Flame, History, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export function LandingPage({ onGetStarted, onLogin }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-[#0d0d14] text-[#e8e8f0] overflow-x-hidden">
      {/* Navigation Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0d0d14]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#7c6af7]/10 rounded-xl">
              <Brain className="w-6 h-6 text-[#7c6af7]" />
            </div>
            <span className="text-xl font-bold tracking-tight">MoodLens</span>
          </div>
          
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              className="text-[#6b6b85] hover:text-white transition-colors"
              onClick={onLogin}
            >
              Login
            </Button>
            <Button 
              className="rounded-full bg-[#7c6af7] hover:bg-[#6b58e6] text-white px-6"
              onClick={onGetStarted}
            >
              Sign Up
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-6">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-radial-gradient(circle, rgba(124,106,247,0.15) 0%, transparent 70%) pointer-events-none" />
        
        <div className="max-w-4xl mx-auto text-center space-y-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#7c6af7]/10 border border-[#7c6af7]/20 text-[#a78bfa] text-xs font-bold uppercase tracking-widest"
          >
            <Sparkles className="w-3 h-3" />
            Action Over Reflection
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-8xl font-bold tracking-tight leading-[1.1] bg-gradient-to-br from-white via-white to-[#7c6af7] bg-clip-text text-transparent"
          >
            Master your mood,<br />one micro-habit at a time.
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-[#6b6b85] text-lg md:text-xl max-w-2xl mx-auto leading-relaxed"
          >
            MoodLens turns your emotional state into a productive signal. 
            Get instant, actionable interventions designed for high-functioning minds.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <Button 
              size="lg"
              className="h-16 px-10 rounded-2xl bg-[#7c6af7] hover:bg-[#6b58e6] text-white font-bold text-lg shadow-xl shadow-purple-900/20 w-full sm:w-auto"
              onClick={onGetStarted}
            >
              Get Started Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <p className="text-[#6b6b85] text-sm">No credit card required.</p>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: Zap,
              title: "Micro-Interventions",
              desc: "Actions that take less than 2 minutes to break inertia and build momentum."
            },
            {
              icon: History,
              title: "Growth Tracking",
              desc: "See patterns in your emotional states and how you overcame them over time."
            },
            {
              icon: Flame,
              title: "Streak System",
              desc: "Gamified consistency that rewards daily action over long-term perfection."
            }
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-[#13131f] border border-white/5 rounded-[32px] p-8 space-y-4 hover:border-[#7c6af7]/30 transition-all group"
            >
              <div className="p-4 bg-[#7c6af7]/10 rounded-2xl w-fit group-hover:scale-110 transition-transform">
                <feature.icon className="w-6 h-6 text-[#7c6af7]" />
              </div>
              <h3 className="text-xl font-bold text-white">{feature.title}</h3>
              <p className="text-[#6b6b85] leading-relaxed">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Social Proof / Philosophy */}
      <section className="py-20 px-6 bg-[#13131f]/30 border-y border-white/5">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
            Designed for the disciplined,<br />built for the overwhelmed.
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">
            {[
              "Reduce thinking, increase doing",
              "Bypass cognitive resistance",
              "Build self-awareness without friction",
              "Focus on the next smallest win"
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#7c6af7]" />
                <span className="text-[#b8b8d0] font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 text-center space-y-8">
        <div className="flex items-center justify-center gap-3">
          <div className="p-2 bg-[#7c6af7]/10 rounded-xl">
            <Brain className="w-6 h-6 text-[#7c6af7]" />
          </div>
          <span className="text-xl font-bold tracking-tight">MoodLens</span>
        </div>
        
        <div className="flex flex-wrap justify-center gap-8 text-sm text-[#6b6b85]">
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-white transition-colors">Contact</a>
        </div>
        
        <p className="text-xs text-[#6b6b85] opacity-50">
          © 2026 MoodLens. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
