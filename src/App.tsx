import React, { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Zap, 
  Shield, 
  Cpu, 
  Globe, 
  BarChart3, 
  MessageSquare,
  AlertCircle,
  Clock
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { format } from "date-fns";
import { cn } from "@/src/lib/utils";

interface MarketUpdate {
  time: number;
  price: number;
  prediction: number;
}

export default function App() {
  const [updates, setUpdates] = useState<MarketUpdate[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [prediction, setPrediction] = useState<number>(0);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const socket: Socket = io();
    socketRef.current = socket;

    socket.on("connect", () => setIsConnected(true));
    socket.on("disconnect", () => setIsConnected(false));

    socket.on("init_state", (state) => {
      if (state.currentPrice) {
        setCurrentPrice(state.currentPrice);
      }
      if (state.priceHistory) {
        setUpdates(state.priceHistory.slice().reverse());
      }
    });

    socket.on("market_update", (update: MarketUpdate) => {
      setUpdates((prev) => [update, ...prev].slice(0, 100));
      setCurrentPrice(update.price);
      setPrediction(update.prediction);
      setLastUpdated(update.time);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const priceData = updates.slice().reverse().map(u => ({
    time: format(u.time, "HH:mm:ss"),
    price: u.price,
    prediction: u.prediction
  }));

  const priceChange = updates.length > 1 
    ? ((updates[0].price - updates[1].price) / updates[1].price) * 100 
    : 0;

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-slate-200 font-sans selection:bg-blue-500/30">
      {/* Header */}
      <header className="border-b border-white/5 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-600/20">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white uppercase">
              QUANTUM <span className="text-emerald-500 font-mono text-sm ml-2 opacity-80">REAL-TIME ML</span>
            </h1>
            <div className="ml-6 flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">BTC/USDT Binance Live</span>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            {lastUpdated && (
              <div className="flex flex-col items-end gap-0.5">
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500 uppercase">
                  <Clock className="w-3 h-3" /> Last Tick: {format(lastUpdated, "HH:mm:ss")}
                </div>
              </div>
            )}
            <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
              <div className={cn("w-2 h-2 rounded-full animate-pulse", isConnected ? "bg-emerald-500" : "bg-rose-500")} />
              <span className="text-xs font-medium uppercase tracking-wider opacity-70">
                {isConnected ? "WebSocket Connected" : "Connecting..."}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-6 grid grid-cols-12 gap-6">
        
        {/* Left Column: Stats & Sentiment */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-white/5 to-transparent p-6 rounded-2xl border border-white/10"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Current Price</span>
              <Activity className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-4xl font-mono font-bold text-white mb-2">
              ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className={cn(
              "flex items-center gap-1 text-sm font-medium",
              priceChange >= 0 ? "text-emerald-400" : "text-rose-400"
            )}>
              {priceChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {Math.abs(priceChange).toFixed(4)}% Change (Tick)
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/5 p-6 rounded-2xl border border-white/10"
          >
            <div className="flex items-center justify-between mb-6">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">ML Regression</span>
              <Cpu className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-slate-400 mb-1">Linear Prediction (Next Tick)</div>
                <div className="text-2xl font-mono font-bold text-white">
                  ${prediction.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-emerald-500"
                  animate={{ width: `${Math.min(100, Math.max(0, (prediction / currentPrice) * 100 - 99.5) * 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Statistical regression model analyzing price velocity and momentum.
              </p>
            </div>
          </motion.div>

          <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" /> Price Volatility
            </h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={updates.slice(0, 20)}>
                  <Bar dataKey="price">
                    {updates.slice(0, 20).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill="#10b981" fillOpacity={0.4} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Middle Column: Main Chart */}
        <div className="col-span-12 lg:col-span-6 space-y-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/5 p-6 rounded-2xl border border-white/10 h-[600px] flex flex-col"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-lg font-bold text-white">Live Market Feed</h2>
                <p className="text-xs text-slate-500">Direct Binance WebSocket Stream (BTC/USDT)</p>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1 text-[10px] font-bold bg-emerald-600/20 text-emerald-400 rounded border border-emerald-500/30">LIVE</button>
              </div>
            </div>

            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={priceData}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis 
                    dataKey="time" 
                    stroke="#475569" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    minTickGap={30}
                  />
                  <YAxis 
                    domain={['auto', 'auto']} 
                    stroke="#475569" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(val) => `$${val.toLocaleString()}`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }}
                    itemStyle={{ color: '#f8fafc' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="price" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorPrice)" 
                    animationDuration={0}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="prediction" 
                    stroke="#3b82f6" 
                    strokeDasharray="5 5"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Stream Latency", value: "8ms", icon: Zap, color: "text-amber-500" },
              { label: "Model Type", value: "Regression", icon: Cpu, color: "text-emerald-500" },
              { label: "Data Source", value: "Binance", icon: Globe, color: "text-blue-500" },
            ].map((item, i) => (
              <div key={i} className="bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="flex items-center gap-2 mb-1">
                  <item.icon className={cn("w-3 h-3", item.color)} />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{item.label}</span>
                </div>
                <div className="text-lg font-mono font-bold text-white">{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Live Feed */}
        <div className="col-span-12 lg:col-span-3 h-[750px] flex flex-col">
          <div className="bg-white/5 rounded-2xl border border-white/10 flex flex-col h-full overflow-hidden">
            <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Activity className="w-4 h-4" /> Raw Trade Stream
              </h3>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">REAL-TIME</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar" ref={scrollRef}>
              <AnimatePresence initial={false}>
                {updates.map((update, idx) => (
                  <motion.div
                    key={update.time + idx}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-[10px] font-mono text-slate-500">{format(update.time, "HH:mm:ss")}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-end">
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Price</div>
                        <div className="text-lg font-mono font-bold text-white">
                          ${update.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">ML Pred</div>
                        <div className="text-sm font-mono font-bold text-blue-400">
                          ${update.prediction.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {updates.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-3 opacity-50">
                  <Clock className="w-8 h-8 animate-spin-slow" />
                  <p className="text-xs font-medium">Awaiting stream ingestion...</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}} />
    </div>
  );
}
