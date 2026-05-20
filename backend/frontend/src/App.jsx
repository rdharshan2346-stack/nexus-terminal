import { useState, useEffect, useRef } from 'react'
import { createChart, CandlestickSeries } from 'lightweight-charts'
import { AreaChart, Area, ResponsiveContainer, YAxis, XAxis, BarChart, Bar, Cell, RadarChart, PolarGrid, PolarAngleAxis, Radar, Tooltip } from 'recharts'
import { Activity, Cpu, BarChart2, Layers, ShoppingCart, Globe2, Percent, PieChart as PieIcon, MessageSquare, X, Newspaper, Eye, GitBranch } from 'lucide-react'
import './index.css'

function App() {
  const [currentWorkspace, setCurrentWorkspace] = useState('CORE');

  // ==========================================
  // STATE: MARKET, CHARTS & ORDER BOOK
  // ==========================================
  const [activeMarket, setActiveMarket] = useState('US');
  const [marketState, setMarketState] = useState({ NIFTY_50: { price: 0 }, SP_500: { price: 0 } });
  const [domData, setDomData] = useState({ asks: [], bids: [] });

  const chartContainerRef = useRef(null);
  const candlestickSeriesRef = useRef(null);
  const chartRef = useRef(null);

  // ==========================================
  // STATE: TELEMETRY DATA ARRAYS
  // ==========================================
  const [liveNews, setLiveNews] = useState([]);
  const [blockTrades, setBlockTrades] = useState([]);
  const [optionsData, setOptionsData] = useState(null);

  // ==========================================
  // STATE: DATABASE & EXECUTION ENGINE
  // ==========================================
  const [cashBalance, setCashBalance] = useState(100000.00);
  const [tradeAmount, setTradeAmount] = useState(1);
  const [positions, setPositions] = useState([]);

  // ==========================================
  // STATE: AI DEPLOYER & ALGO BUILDER
  // ==========================================
  const [ticker, setTicker] = useState('NVDA');
  const [report, setReport] = useState('');
  const [isDeploying, setIsDeploying] = useState(false);

  const [algoRule, setAlgoRule] = useState({ indicator: 'RSI', condition: 'GREATER_THAN', value: 70, action: 'SHORT_SELL' });
  const [algoResult, setAlgoResult] = useState(null);
  const [isBuildingAlgo, setIsBuildingAlgo] = useState(false);

  // ==========================================
  // STATE: NEWS HUB & BACKTEST SIMULATOR
  // ==========================================
  const [newsRegion, setNewsRegion] = useState('GLOBAL');
  const [regionalNews, setRegionalNews] = useState([]);
  const [isNewsLoading, setIsNewsLoading] = useState(false);

  const [isSimulating, setIsSimulating] = useState(false);
  const [simRunComplete, setSimRunComplete] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState('LSTM_TREND');
  const [backtestAsset, setBacktestAsset] = useState('SPY');
  const [backtestResults, setBacktestResults] = useState(null);

  // ==========================================
  // STATE: QUANT COPILOT
  // ==========================================
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState([{ role: 'assistant', content: 'Nexus Copilot online. Structural parameters stable.' }]);
  const chatEndRef = useRef(null);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // ==========================================
  // EFFECT 1: TRADINGVIEW CANDLESTICK ENGINE (RESIZE OBSERVER FIX)
  // ==========================================
  useEffect(() => {
    if (currentWorkspace !== 'CORE' || !chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: { background: { type: 'solid', color: 'transparent' }, textColor: '#d1d4dc' },
      grid: { vertLines: { color: 'rgba(42, 46, 57, 0.05)' }, horzLines: { color: 'rgba(42, 46, 57, 0.05)' } },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false, timeVisible: true, secondsVisible: true },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#30d158', downColor: '#ff453a',
      borderVisible: false,
      wickUpColor: '#30d158', wickDownColor: '#ff453a'
    });

    chartRef.current = chart;
    candlestickSeriesRef.current = candleSeries;

    // Force chart to fit container dynamically to prevent blank boxes
    const resizeObserver = new ResizeObserver(entries => {
      if (entries.length === 0 || entries[0].target !== chartContainerRef.current) return;
      const newRect = entries[0].contentRect;
      chart.applyOptions({ width: newRect.width, height: newRect.height });
    });
    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      candlestickSeriesRef.current = null;
    };
  }, [currentWorkspace, activeMarket]);

  // ==========================================
  // EFFECT 2: WEBSOCKET MASTER DATA LOOP
  // ==========================================
  useEffect(() => {
    const ws = new WebSocket('wss://nexus-terminal-engine.onrender.com/stream');
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'MARKET_DATA') {
        setMarketState({ NIFTY_50: data.NIFTY_50, SP_500: data.SP_500 });
        setDomData(activeMarket === 'US' ? data.DOM_US : data.DOM_IN);

        if (candlestickSeriesRef.current) {
          const tickData = activeMarket === 'US' ? data.SP_500 : data.NIFTY_50;
          candlestickSeriesRef.current.update({
            time: data.time,
            open: tickData.open,
            high: tickData.high,
            low: tickData.low,
            close: tickData.price
          });
        }
      }
      else if (data.type === 'NEWS') {
        setLiveNews(prev => [data, ...prev].slice(0, 5));
      }
      else if (data.type === 'BLOCK_TRADE') {
        setBlockTrades(prev => [{ time: new Date().toLocaleTimeString(), ...data }, ...prev].slice(0, 15));
      }
    };
    return () => ws.close();
  }, [activeMarket]);

  // ==========================================
  // EFFECT 3 & 4: PORTFOLIO & AUTO-SCROLL
  // ==========================================
  useEffect(() => {
    const loadPortfolio = async () => {
      try {
        const res = await fetch('https://nexus-terminal-engine.onrender.com/api/portfolio');
        const data = await res.json();
        setPositions(data.trades);
      } catch (e) {
        console.error("Database connection dropped.");
      }
    };
    loadPortfolio();
  }, []);

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isCopilotOpen]);

  // ==========================================
  // API CONTROLLERS
  // ==========================================
  const fetchRegionalNews = async (region) => {
    setIsNewsLoading(true);
    try {
      const res = await fetch(`https://nexus-terminal-engine.onrender.com/api/news/${region}`);
      if (!res.ok) throw new Error("Connection failed.");
      const data = await res.json();
      if (!data.news || data.news.length === 0) throw new Error("Empty Array.");
      setRegionalNews(data.news);
    } catch {
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setRegionalNews([
        { time: now, source: "REUTERS [LOCAL CACHE]", impact: "HIGH", headline: `Systemic liquidity variance detected in ${region} pipelines.`, url: "#" },
        { time: now, source: "BLOOMBERG [LOCAL CACHE]", impact: "MED", headline: "Algorithmic execution thresholds recalibrated amid volatile pre-market metrics.", url: "#" },
        { time: now, source: "WSJ [LOCAL CACHE]", impact: "LOW", headline: "Institutional dark pool volume spikes preceding scheduled reports.", url: "#" }
      ]);
    }
    setIsNewsLoading(false);
  };

  useEffect(() => { if (currentWorkspace === 'NEWS') fetchRegionalNews(newsRegion); }, [currentWorkspace, newsRegion]);

  useEffect(() => {
    if (currentWorkspace === 'OPTIONS') {
      fetch(`https://nexus-terminal-engine.onrender.com/api/options/${ticker}`)
        .then(r => r.json())
        .then(data => setOptionsData(data))
        .catch(() => { });
    }
  }, [currentWorkspace, ticker]);

  const executeTrade = async (type) => {
    const price = activeMarket === 'US' ? marketState.SP_500.price : marketState.NIFTY_50.price;
    const tkr = activeMarket === 'US' ? 'SPY' : 'NIFTY';

    if (type === 'BUY' && cashBalance >= (price * tradeAmount)) {
      setCashBalance(prev => prev - (price * tradeAmount));
      const order = { ticker: tkr, action: 'BUY', shares: tradeAmount, price: price };
      setPositions(prev => [order, ...prev]);

      try {
        await fetch('https://nexus-terminal-engine.onrender.com/api/trade', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(order)
        });
      } catch (e) {
        console.error("Trade failed to persist to ledger.");
      }
    }
  };

  const handleExecuteAI = async () => {
    setIsDeploying(true); setReport('');
    try {
      const res = await fetch(`https://nexus-terminal-engine.onrender.com/api/analyze/${ticker}`);
      const data = await res.json();
      setReport(data.analysis);
    } catch {
      setReport("CRITICAL CONNECTION FAILURE: AI Node Unresponsive.");
    }
    setIsDeploying(false);
  };

  const handleAlgoDeploy = async () => {
    setIsBuildingAlgo(true); setAlgoResult(null);
    try {
      const res = await fetch(`https://nexus-terminal-engine.onrender.com/api/algo/deploy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(algoRule)
      });
      setAlgoResult(await res.json());
    } catch (e) {
      console.error("Algo deployment failed.");
    }
    setIsBuildingAlgo(false);
  };

  const handleRunBacktest = async () => {
    setIsSimulating(true);
    setSimRunComplete(false);
    setBacktestResults(null);

    try {
      const res = await fetch('https://nexus-terminal-engine.onrender.com/api/backtest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strategy: selectedStrategy, asset: backtestAsset })
      });
      const data = await res.json();
      setBacktestResults(data);
    } catch (e) {
      console.error("Backtest engine connection failed.");
    }

    setIsSimulating(false);
    setSimRunComplete(true);
  };

  const handleChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = { role: 'user', content: chatInput };
    setChatHistory(prev => [...prev, userMsg]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const res = await fetch('https://nexus-terminal-engine.onrender.com/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.content, history: chatHistory.slice(-6) })
      });
      const data = await res.json();
      setChatHistory(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch {
      setChatHistory(prev => [...prev, { role: 'assistant', content: 'SYSTEM ERROR: Copilot Offline.' }]);
    }
    setIsChatLoading(false);
  };

  // Custom Recharts Tooltip Component
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p style={{ margin: '0 0 5px 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{label}</p>
          <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: payload[0].color || 'var(--text-main)' }}>
            {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="app-container">
      {/* ========================================== */}
      {/* MASTER SIDEBAR NAVIGATION */}
      {/* ========================================== */}
      <div className="sidebar">
        <div style={{ color: 'white', fontWeight: '900', fontSize: '1.4rem', marginBottom: '15px', fontFamily: 'monospace', letterSpacing: '2px' }}>Ω</div>
        <Layers className={`sidebar-icon ${currentWorkspace === 'CORE' ? 'active' : ''}`} onClick={() => setCurrentWorkspace('CORE')} size={22} title="Execution Core" />
        <Newspaper className={`sidebar-icon ${currentWorkspace === 'NEWS' ? 'active' : ''}`} onClick={() => setCurrentWorkspace('NEWS')} size={22} title="Global Macro Hub" />
        <Activity className={`sidebar-icon ${currentWorkspace === 'BACKTEST' ? 'active' : ''}`} onClick={() => setCurrentWorkspace('BACKTEST')} size={22} title="Backtest Simulator" />
        <PieIcon className={`sidebar-icon ${currentWorkspace === 'RISK' ? 'active' : ''}`} onClick={() => setCurrentWorkspace('RISK')} size={22} title="Risk Matrix" />
        <Percent className={`sidebar-icon ${currentWorkspace === 'OPTIONS' ? 'active' : ''}`} onClick={() => setCurrentWorkspace('OPTIONS')} size={22} title="Options Engine" />
        <Eye className={`sidebar-icon ${currentWorkspace === 'DARK_POOL' ? 'active' : ''}`} onClick={() => setCurrentWorkspace('DARK_POOL')} size={22} title="Dark Pool Tracker" />
        <GitBranch className={`sidebar-icon ${currentWorkspace === 'ALGO' ? 'active' : ''}`} onClick={() => setCurrentWorkspace('ALGO')} size={22} title="Algo Builder" />
      </div>

      <div className="main-content">
        {/* ========================================== */}
        {/* TOP HEADER BLOCK */}
        {/* ========================================== */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--accent-blue)', fontWeight: '800', letterSpacing: '1.5px', textTransform: 'uppercase' }}>ENTERPRISE WORKSPACE</div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: '800', margin: '6px 0 0 0', letterSpacing: '0.5px' }}>NEXUS TERMINAL <span style={{ color: 'var(--text-muted)', fontWeight: '300' }}>// {currentWorkspace}</span></h1>
          </div>
          <div style={{ display: 'flex', gap: '8px', background: 'rgba(20,20,22,0.8)', padding: '6px', borderRadius: '12px', border: '1px solid var(--panel-border)', backdropFilter: 'blur(10px)' }}>
            <button onClick={() => setActiveMarket('US')} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: activeMarket === 'US' ? 'var(--accent-blue)' : 'transparent', color: activeMarket === 'US' ? '#fff' : 'var(--text-muted)', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }}><Globe2 size={16} /> WALL STREET</button>
            <button onClick={() => setActiveMarket('INDIA')} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: activeMarket === 'INDIA' ? 'var(--accent-green)' : 'transparent', color: activeMarket === 'INDIA' ? '#fff' : 'var(--text-muted)', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }}><Globe2 size={16} /> NSE INDIA</button>
          </div>
        </div>

        {/* ========================================== */}
        {/* WORKSPACE 1: CORE TRADING ENGINE */}
        {/* ========================================== */}
        {currentWorkspace === 'CORE' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '30px', alignItems: 'start', marginTop: '30px' }}>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              <div className="glass-panel" style={{ height: '350px', minHeight: '350px', minWidth: '10px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: '700', letterSpacing: '0.5px' }}><BarChart2 size={14} style={{ display: 'inline', verticalAlign: 'text-bottom' }} /> {activeMarket === 'US' ? 'S&P 500 (SPY)' : 'NIFTY 50 INDEX'}</span>
                  <span style={{ color: 'var(--accent-green)', fontFamily: 'monospace', fontWeight: '700' }}>LIVE</span>
                </div>
                <div style={{ fontSize: '2.4rem', fontWeight: '800', marginBottom: '10px', letterSpacing: '-0.5px' }}>
                  {activeMarket === 'US' ? '$' : '₹'}{activeMarket === 'US' ? marketState.SP_500.price.toFixed(2) : marketState.NIFTY_50.price.toFixed(2)}
                </div>
                <div ref={chartContainerRef} style={{ flex: 1, width: '100%', position: 'relative' }} />
              </div>

              <div className="glass-panel" style={{ background: 'rgba(15,15,18,0.8)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.5px' }}><ShoppingCart size={14} style={{ display: 'inline', verticalAlign: 'text-bottom' }} /> EXECUTION NODE</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--accent-green)' }}>LIQUIDITY: ${cashBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                </div>

                {domData.asks?.length > 0 && (
                  <div style={{ marginBottom: '20px', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      {domData.asks.map((ask, i) => (<div key={`ask-${i}`} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 10px', borderRadius: '4px', background: `linear-gradient(90deg, rgba(255, 69, 58, 0.15) ${(ask.vol / 1000) * 100}%, transparent ${(ask.vol / 1000) * 100}%)`, color: 'var(--accent-red)' }}><span>{ask.price.toFixed(2)}</span><span>{ask.vol}</span></div>))}
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', borderTop: '1px solid rgba(255,255,255,0.1)', borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-main)', fontWeight: '700', margin: '6px 0', borderRadius: '4px', background: 'rgba(255,255,255,0.02)' }}><span>SPREAD</span><span style={{ color: 'var(--accent-blue)' }}>MID: {(activeMarket === 'US' ? marketState.SP_500.price : marketState.NIFTY_50.price).toFixed(2)}</span></div>
                      {domData.bids.map((bid, i) => (<div key={`bid-${i}`} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 10px', borderRadius: '4px', background: `linear-gradient(90deg, rgba(48, 209, 88, 0.15) ${(bid.vol / 1000) * 100}%, transparent ${(bid.vol / 1000) * 100}%)`, color: 'var(--accent-green)' }}><span>{bid.price.toFixed(2)}</span><span>{bid.vol}</span></div>))}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                  <input type="number" className="premium-input" value={tradeAmount} onChange={e => setTradeAmount(Number(e.target.value))} style={{ width: '80px', textAlign: 'center', fontSize: '1rem', fontWeight: '700' }} />
                  <button onClick={() => executeTrade('BUY')} className="premium-button" style={{ flex: 1, background: 'rgba(48, 209, 88, 0.15)', color: 'var(--accent-green)', border: '1px solid rgba(48, 209, 88, 0.3)' }}>MARKET BUY</button>
                </div>

                <div style={{ borderTop: '1px solid var(--panel-border)', paddingTop: '20px', maxHeight: '180px', overflowY: 'auto' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '12px', fontWeight: '800', letterSpacing: '0.5px' }}>PERSISTENT LEDGER ({positions.length})</div>
                  {positions.map((pos, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '10px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', marginBottom: '6px', border: '1px solid rgba(255,255,255,0.03)' }}>
                      <span><b style={{ color: 'var(--accent-blue)' }}>{pos.action}</b> {pos.shares}x {pos.ticker}</span>
                      <span style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>@ ${pos.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', letterSpacing: '0.5px' }}>CREW AI RESEARCH AGENT</h2>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <input type="text" className="premium-input" value={ticker} onChange={e => setTicker(e.target.value.toUpperCase())} placeholder="TICKER..." style={{ flex: 1, fontWeight: '700' }} />
                  <button className="premium-button" onClick={handleExecuteAI} disabled={isDeploying}>{isDeploying ? 'EXECUTING...' : 'DEPLOY INTELLIGENCE'}</button>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.5)', borderRadius: '12px', padding: '24px', border: '1px solid var(--panel-border)', flex: 1, minHeight: '250px', overflowY: 'auto', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)' }}>
                  {isDeploying && <div style={{ color: 'var(--accent-blue)', fontFamily: 'monospace' }}>[SYSTEM] Compiling institutional data arrays for {ticker}...</div>}
                  {report && !isDeploying && <p style={{ color: '#E5E5EA', lineHeight: '1.8', fontSize: '0.98rem', margin: 0, whiteSpace: 'pre-line' }}>{report}</p>}
                </div>
              </div>

              <div className="glass-panel" style={{ minHeight: '250px' }}>
                <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '15px', marginBottom: '20px', letterSpacing: '0.5px' }}>SYSTEMIC ALERTS <span className="live-indicator"></span></h2>
                {liveNews.length === 0 ? <div style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>Awaiting structural alerts...</div> : null}
                {liveNews.map((n, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '12px', fontSize: '0.85rem', background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '10px', marginBottom: '10px', border: '1px solid rgba(255,255,255,0.05)', transition: 'transform 0.2s', cursor: 'default' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateX(4px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}>
                    <span style={{ fontFamily: 'monospace', color: 'var(--accent-blue)', minWidth: '60px' }}>{n.time}</span>
                    <span style={{ fontWeight: '800', color: 'var(--accent-orange)' }}>[{n.asset}]</span>
                    <span style={{ color: '#E5E5EA', lineHeight: '1.4' }}>{n.headline}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* WORKSPACE 2: NEWS SCRAPER */}
        {/* ========================================== */}
        {currentWorkspace === 'NEWS' && (
          <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '30px', alignItems: 'start', marginTop: '30px' }}>
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '20px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '10px', letterSpacing: '1px' }}>MACRO REGIONS</div>
              {['GLOBAL', 'US', 'INDIA'].map(region => (
                <button
                  key={region}
                  onClick={() => setNewsRegion(region)}
                  style={{ background: newsRegion === region ? 'rgba(10, 132, 255, 0.15)' : 'transparent', color: newsRegion === region ? 'var(--accent-blue)' : 'var(--text-main)', border: 'none', borderLeft: newsRegion === region ? '4px solid var(--accent-blue)' : '4px solid transparent', padding: '14px', textAlign: 'left', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem', transition: 'all 0.2s' }}
                >
                  {region}
                </button>
              ))}
            </div>

            <div className="glass-panel" style={{ minHeight: '500px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '20px' }}>
                <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800', letterSpacing: '0.5px' }}>{newsRegion} WIRE</h2>
                {isNewsLoading ? <span style={{ color: 'var(--accent-blue)', fontFamily: 'monospace', fontSize: '0.85rem' }}>TAPING MAINFRAME...</span> : <span className="live-indicator"></span>}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {regionalNews.length === 0 && !isNewsLoading ? <div style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>No signals detected on this frequency.</div> : null}

                {regionalNews.map((news, idx) => {
                  const isClickable = news.url && news.url !== '#';
                  return (
                    <a
                      key={idx}
                      href={isClickable ? news.url : undefined}
                      target={isClickable ? "_blank" : undefined}
                      rel={isClickable ? "noopener noreferrer" : undefined}
                      style={{
                        display: 'flex', gap: '15px', padding: '20px',
                        background: 'rgba(255,255,255,0.03)', borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.05)', alignItems: 'center',
                        textDecoration: 'none',
                        cursor: isClickable ? 'pointer' : 'not-allowed',
                        transition: 'all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1)',
                        opacity: isClickable ? 1 : 0.6
                      }}
                      onMouseEnter={e => { if (isClickable) { e.currentTarget.style.transform = 'translateX(6px) scale(1.01)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.2)'; } }}
                      onMouseLeave={e => { if (isClickable) { e.currentTarget.style.transform = 'translateX(0px) scale(1)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.boxShadow = 'none'; } }}
                    >
                      <div style={{ fontFamily: 'monospace', color: 'var(--text-muted)', fontSize: '0.9rem', minWidth: '55px' }}>{news.time}</div>
                      <div style={{ padding: '6px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '800', minWidth: '60px', textAlign: 'center', background: news.impact === 'HIGH' ? 'rgba(255,69,58,0.15)' : news.impact === 'MED' ? 'rgba(255,159,10,0.15)' : 'rgba(48,209,88,0.15)', color: news.impact === 'HIGH' ? 'var(--accent-red)' : news.impact === 'MED' ? 'var(--accent-orange)' : 'var(--accent-green)' }}>{news.impact}</div>
                      <div style={{ fontWeight: '800', color: 'var(--accent-blue)', fontSize: '0.85rem', minWidth: '130px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '0.5px' }}>{news.source}</div>
                      <div style={{ fontSize: '1rem', color: '#E5E5EA', lineHeight: '1.5', fontWeight: '500' }}>{news.headline}</div>
                    </a>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* WORKSPACE 3: TRUE BACKTEST SIMULATOR */}
        {/* ========================================== */}
        {currentWorkspace === 'BACKTEST' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', marginTop: '30px' }}>
            <div className="glass-panel" style={{ display: 'flex', gap: '25px', alignItems: 'flex-end' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 2 }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '800', letterSpacing: '0.5px' }}>TARGET SIMULATION STRATEGY</label>
                <select value={selectedStrategy} onChange={e => setSelectedStrategy(e.target.value)} className="premium-input" style={{ width: '100%', fontWeight: '600' }}>
                  <option value="LSTM_TREND">Neural Network Trend Vector (LSTM)</option>
                  <option value="BREAKOUT">High-Volatility Momentum Breakout</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '800', letterSpacing: '0.5px' }}>ASSET TICKER</label>
                <input type="text" value={backtestAsset} onChange={e => setBacktestAsset(e.target.value.toUpperCase())} className="premium-input" style={{ textAlign: 'center', fontWeight: '800', letterSpacing: '1px' }} />
              </div>

              <button
                className="premium-button"
                onClick={handleRunBacktest}
                style={{ flex: 2, height: '44px' }}
                disabled={isSimulating}
              >
                {isSimulating ? 'SIMULATING RECURSION...' : 'RUN TRUE BACKTEST'}
              </button>
            </div>

            {(isSimulating || simRunComplete) && (
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
                <div className="glass-panel" style={{ height: '400px' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '20px', letterSpacing: '0.5px' }}>ALPHA GENERATION (1 YEAR TRAILING)</div>
                  {isSimulating ? (
                    <div style={{ display: 'flex', height: '80%', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-blue)', fontFamily: 'monospace', fontSize: '1.1rem' }}>DOWNLOADING MARKET VECTORS...</div>
                  ) : backtestResults && (
                    <ResponsiveContainer width="100%" height="85%">
                      <AreaChart data={backtestResults.curve}>
                        <XAxis dataKey="date" stroke="#666" style={{ fontSize: '0.7rem' }} minTickGap={30} tickMargin={10} />
                        <YAxis hide={true} domain={['auto', 'auto']} />
                        {/* THE NEW HOVER TOOLTIP */}
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                        <Area type="monotone" dataKey="returns" name="Portfolio Value ($)" stroke="var(--accent-blue)" fill="rgba(10, 132, 255, 0.1)" strokeWidth={3} activeDot={{ r: 6, fill: 'var(--accent-blue)', stroke: '#fff', strokeWidth: 2 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '800', letterSpacing: '0.5px' }}>SHARPE RATIO</div>
                    <div style={{ fontSize: '3rem', fontWeight: '800', color: isSimulating ? 'var(--text-muted)' : 'var(--accent-green)', marginTop: '10px' }}>
                      {isSimulating ? '---' : backtestResults ? backtestResults.sharpe : '---'}
                    </div>
                  </div>
                  <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '800', letterSpacing: '0.5px' }}>MAX DRAWDOWN</div>
                    <div style={{ fontSize: '3rem', fontWeight: '800', color: isSimulating ? 'var(--text-muted)' : 'var(--accent-red)', marginTop: '10px' }}>
                      {isSimulating ? '---' : backtestResults ? `${backtestResults.drawdown}%` : '---'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================== */}
        {/* WORKSPACE 4: RISK MATRIX (UPGRADED UI) */}
        {/* ========================================== */}
        {currentWorkspace === 'RISK' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '30px', alignItems: 'start', marginTop: '30px' }}>

            {/* Replaced Pie Chart with High-Performance Horizontal Bar Chart */}
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '25px', height: '360px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)' }}><PieIcon size={20} /><span style={{ fontSize: '0.9rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Portfolio Allocation</span></div>
              <div style={{ flex: 1, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[{ name: 'TSLA', value: 45, color: 'var(--accent-blue)' }, { name: 'NVDA', value: 35, color: 'var(--accent-green)' }, { name: 'BTC', value: 20, color: 'var(--accent-orange)' }]} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-main)', fontSize: 12, fontWeight: 700 }} width={50} />
                    {/* Hover Tooltip injected */}
                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} content={<CustomTooltip />} />
                    <Bar dataKey="value" name="Allocation %" radius={[0, 6, 6, 0]} barSize={24}>
                      {[{ name: 'TSLA', color: 'var(--accent-blue)' }, { name: 'NVDA', color: 'var(--accent-green)' }, { name: 'BTC', color: 'var(--accent-orange)' }].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                <div className="glass-panel" style={{ padding: '24px' }}><div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '800', letterSpacing: '0.5px' }}>95% VaR</div><div style={{ fontSize: '2.4rem', fontWeight: '800', color: 'var(--accent-red)', marginTop: '8px' }}>-$42,500</div></div>
                <div className="glass-panel" style={{ padding: '24px' }}><div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '800', letterSpacing: '0.5px' }}>PORTFOLIO BETA</div><div style={{ fontSize: '2.4rem', fontWeight: '800', color: 'var(--accent-blue)', marginTop: '8px' }}>1.45</div></div>
              </div>
              <div className="glass-panel" style={{ display: 'flex', gap: '20px', alignItems: 'center', height: '226px' }}>
                <div style={{ height: '100%', flex: 1 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={[{ subject: 'Rates', A: 85, fullMark: 100 }, { subject: 'Supply', A: 90, fullMark: 100 }, { subject: 'Inflation', A: 45, fullMark: 100 }, { subject: 'FX', A: 30, fullMark: 100 }]}>
                      <PolarGrid stroke="rgba(255,255,255,0.15)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-muted)', fontSize: 11, fontWeight: 700 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Radar name="Systemic Exposure" dataKey="A" stroke="var(--accent-red)" strokeWidth={2} fill="var(--accent-red)" fillOpacity={0.4} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* WORKSPACE 5: OPTIONS GREEKS */}
        {/* ========================================== */}
        {currentWorkspace === 'OPTIONS' && (
          <div className="glass-panel" style={{ overflowX: 'auto', marginTop: '30px', padding: '0' }}>
            {!optionsData ? <div style={{ textAlign: 'center', padding: '60px', color: 'var(--accent-blue)', fontWeight: '700', letterSpacing: '1px' }}>CALCULATING DERIVATIVE VECTORS...</div> : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', fontFamily: 'monospace', textAlign: 'center' }}>
                <thead>
                  <tr style={{ background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}><th colSpan="4" style={{ color: 'var(--accent-blue)', padding: '16px', fontSize: '1rem', letterSpacing: '1px' }}>CALLS</th><th style={{ color: 'var(--text-main)', fontSize: '1rem', letterSpacing: '1px' }}>AXIS</th><th colSpan="4" style={{ color: 'var(--accent-green)', padding: '16px', fontSize: '1rem', letterSpacing: '1px' }}>PUTS</th></tr>
                  <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.01)' }}><th style={{ padding: '12px' }}>PREMIUM</th><th>Δ (DELTA)</th><th>Γ (GAMMA)</th><th>Θ (THETA)</th><th style={{ color: '#fff', background: 'rgba(255,255,255,0.05)', padding: '12px 16px', letterSpacing: '1px' }}>STRIKE</th><th>PREMIUM</th><th>Δ (DELTA)</th><th>Γ (GAMMA)</th><th>Θ (THETA)</th></tr>
                </thead>
                <tbody>
                  {optionsData.chain.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ color: 'var(--accent-blue)', padding: '16px', fontWeight: '700' }}>${row.call_premium.toFixed(2)}</td><td>{row.call_delta}</td><td>{row.call_gamma}</td><td style={{ color: 'var(--accent-red)' }}>{row.call_theta}</td>
                      <td style={{ fontWeight: '800', background: 'rgba(255,255,255,0.03)', color: '#fff', fontSize: '1rem' }}>{row.strike}</td>
                      <td style={{ color: 'var(--accent-green)', fontWeight: '700' }}>${row.put_premium.toFixed(2)}</td><td style={{ color: 'var(--accent-red)' }}>{row.put_delta}</td><td>{row.put_gamma}</td><td style={{ color: 'var(--accent-red)' }}>{row.put_theta}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ========================================== */}
        {/* WORKSPACE 6: DARK POOL WHALE TRACKER */}
        {/* ========================================== */}
        {currentWorkspace === 'DARK_POOL' && (
          <div className="glass-panel" style={{ minHeight: '500px', marginTop: '30px' }}>
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '20px', marginBottom: '25px', display: 'flex', justifyContent: 'space-between', letterSpacing: '0.5px' }}>
              INSTITUTIONAL WHALE TRACKER <span className="live-indicator"></span>
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {blockTrades.length === 0 ? <div style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>Awaiting large block trade execution...</div> : blockTrades.map((trade, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', alignItems: 'center', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.01)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                  <div style={{ fontFamily: 'monospace', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{trade.time}</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-main)', width: '120px', letterSpacing: '1px' }}>{trade.ticker}</div>
                  <div style={{ fontFamily: 'monospace', color: 'var(--accent-orange)', fontSize: '1.2rem', fontWeight: '700' }}>{trade.size.toLocaleString()} SHARES</div>
                  <div style={{ fontFamily: 'monospace', color: 'var(--text-main)', fontSize: '1.1rem' }}>@ ${trade.price.toFixed(2)}</div>
                  <div style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '800', letterSpacing: '0.5px', background: trade.sentiment.includes('BULL') ? 'rgba(48,209,88,0.15)' : trade.sentiment.includes('BEAR') ? 'rgba(255,69,58,0.15)' : 'rgba(255,255,255,0.08)', color: trade.sentiment.includes('BULL') ? 'var(--accent-green)' : trade.sentiment.includes('BEAR') ? 'var(--accent-red)' : 'var(--text-muted)' }}>{trade.sentiment}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* WORKSPACE 7: ALGO LOGIC CONSTRUCTOR */}
        {/* ========================================== */}
        {currentWorkspace === 'ALGO' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginTop: '30px' }}>
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '20px', letterSpacing: '0.5px' }}>LOGIC CONSTRUCTOR</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '800', letterSpacing: '0.5px' }}>INDICATOR</label>
                  <select className="premium-input" value={algoRule.indicator} onChange={e => setAlgoRule({ ...algoRule, indicator: e.target.value })} style={{ width: '100%', marginTop: '8px', fontWeight: '600' }}>
                    <option value="RSI">RSI (Relative Strength)</option>
                    <option value="MACD">MACD Crossover</option>
                    <option value="VWAP">VWAP Deviation</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '800', letterSpacing: '0.5px' }}>CONDITION</label>
                  <select className="premium-input" value={algoRule.condition} onChange={e => setAlgoRule({ ...algoRule, condition: e.target.value })} style={{ width: '100%', marginTop: '8px', fontWeight: '600' }}>
                    <option value="GREATER_THAN">Greater Than (&gt;)</option>
                    <option value="LESS_THAN">Less Than (&lt;)</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '800', letterSpacing: '0.5px' }}>TRIGGER VALUE</label>
                  <input type="number" className="premium-input" value={algoRule.value} onChange={e => setAlgoRule({ ...algoRule, value: Number(e.target.value) })} style={{ width: '100%', marginTop: '8px', boxSizing: 'border-box', fontWeight: '700', fontSize: '1.1rem' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '800', letterSpacing: '0.5px' }}>EXECUTION ACTION</label>
                  <select className="premium-input" value={algoRule.action} onChange={e => setAlgoRule({ ...algoRule, action: e.target.value })} style={{ width: '100%', marginTop: '8px', fontWeight: '600' }}>
                    <option value="MARKET_BUY">Market Buy</option>
                    <option value="SHORT_SELL">Short Sell</option>
                  </select>
                </div>
                <button className="premium-button" onClick={handleAlgoDeploy} disabled={isBuildingAlgo} style={{ background: 'var(--accent-blue)', color: 'white', marginTop: '15px', height: '50px', fontSize: '1rem' }}>
                  {isBuildingAlgo ? 'COMPILING SCRIPT...' : 'DEPLOY ALGORITHM'}
                </button>
              </div>
            </div>

            {algoResult && (
              <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '30px', background: 'rgba(15,15,18,0.8)' }}>
                <div style={{ color: 'var(--accent-green)', fontFamily: 'monospace', textAlign: 'center', fontSize: '0.9rem', background: 'rgba(48, 209, 88, 0.1)', padding: '10px 20px', borderRadius: '8px', border: '1px solid rgba(48, 209, 88, 0.3)' }}>{algoResult.status}</div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '800', letterSpacing: '0.5px' }}>SIMULATED WIN RATE</div>
                  <div style={{ fontSize: '4rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-1px' }}>{algoResult.win_rate}%</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '800', letterSpacing: '0.5px' }}>PROJECTED ALPHA (30D)</div>
                  <div style={{ fontSize: '3rem', fontWeight: '800', color: algoResult.profit > 0 ? 'var(--accent-green)' : 'var(--accent-red)', letterSpacing: '-1px' }}>${algoResult.profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================== */}
      {/* OVERLAY: AI COPILOT DRAWER */}
      {/* ========================================== */}
      <div onClick={() => setIsCopilotOpen(true)} style={{ position: 'fixed', bottom: '40px', right: '40px', background: 'linear-gradient(135deg, var(--accent-blue) 0%, #005bb5 100%)', color: 'white', width: '64px', height: '64px', borderRadius: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 10px 30px rgba(10,132,255,0.5)', transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)', zIndex: 100 }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
        <MessageSquare size={28} />
      </div>

      <div style={{ position: 'fixed', top: 0, right: isCopilotOpen ? 0 : '-450px', width: '420px', height: '100vh', background: 'rgba(15,15,18,0.95)', backdropFilter: 'blur(30px)', borderLeft: '1px solid var(--panel-border)', transition: 'right 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)', zIndex: 200, display: 'flex', flexDirection: 'column', boxShadow: '-10px 0 50px rgba(0,0,0,0.6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px', borderBottom: '1px solid var(--panel-border)', background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Cpu size={20} color="var(--accent-blue)" />
            <span style={{ fontWeight: '800', letterSpacing: '1px', fontSize: '1.1rem' }}>NEXUS COPILOT</span>
          </div>
          <X size={24} color="var(--text-muted)" style={{ cursor: 'pointer', transition: 'color 0.2s' }} onClick={() => setIsCopilotOpen(false)} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'} />
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {chatHistory.map((msg, idx) => (
            <div key={idx} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '6px', textAlign: msg.role === 'user' ? 'right' : 'left', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>{msg.role}</div>
              <div style={{ background: msg.role === 'user' ? 'linear-gradient(135deg, var(--accent-blue) 0%, #005bb5 100%)' : 'rgba(255,255,255,0.05)', color: 'white', padding: '14px 18px', borderRadius: '14px', fontSize: '0.95rem', lineHeight: '1.6', border: msg.role === 'user' ? 'none' : '1px solid var(--panel-border)', whiteSpace: 'pre-wrap', boxShadow: msg.role === 'user' ? '0 4px 15px rgba(10,132,255,0.3)' : 'none' }}>
                {msg.content}
              </div>
            </div>
          ))}

          {isChatLoading && (
            <div style={{ alignSelf: 'flex-start', maxWidth: '85%' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>ASSISTANT</div>
              <div style={{ background: 'rgba(255,255,255,0.02)', color: 'var(--accent-blue)', padding: '14px 18px', borderRadius: '14px', fontSize: '0.9rem', border: '1px solid var(--panel-border)', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="live-indicator" style={{ marginLeft: 0, background: 'var(--accent-blue)', boxShadow: '0 0 8px var(--accent-blue)' }}></span>
                Synthesizing Data Vectors...
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <form onSubmit={handleChat} style={{ padding: '24px', borderTop: '1px solid var(--panel-border)', background: 'rgba(0,0,0,0.2)' }}>
          <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Query Nexus AI..." className="premium-input" style={{ width: '100%', boxSizing: 'border-box', height: '50px', fontSize: '1rem', borderRadius: '12px' }} />
        </form>
      </div>
    </div>
  )
}
export default App