import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Eye, EyeOff, AlertCircle, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useBranding } from '../context/BrandingContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

// ── Full canvas: stars + constellation + shockwave + warp ─────────────────────
function InteractiveCanvas({ mousePosRef, clicksRef }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W = canvas.width = window.innerWidth;
    let H = canvas.height = window.innerHeight;

    const onResize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    window.addEventListener('resize', onResize);

    // 350 background stars — many more, varied sizes
    const stars = Array.from({ length: 350 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: 0.3 + Math.random() * 2.2,
      baseOpacity: 0.1 + Math.random() * 0.8,
      speed: 0.003 + Math.random() * 0.012,
      offset: Math.random() * Math.PI * 2,
      color: Math.random() > 0.85 ? `rgba(200,180,255,` : Math.random() > 0.7 ? `rgba(180,220,255,` : `rgba(255,255,255,`,
    }));

    // 80 constellation nodes
    const nodes = Array.from({ length: 80 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
      r: 1 + Math.random() * 2,
      baseR: 1 + Math.random() * 2,
    }));

    // Shockwaves on click
    const shockwaves = [];

    // Warp speed lines on click
    const warpLines = [];

    let t = 0;

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      t += 1;

      const mx = (mousePosRef.current.x / 100) * W;
      const my = (mousePosRef.current.y / 100) * H;

      // Process new clicks
      while (clicksRef.current.length > 0) {
        const c = clicksRef.current.shift();
        const cx = (c.x / 100) * W, cy = (c.y / 100) * H;
        shockwaves.push({ x: cx, y: cy, r: 0, maxR: 220, alpha: 1, born: t });
        // Spawn warp lines outward
        for (let i = 0; i < 18; i++) {
          const angle = (i / 18) * Math.PI * 2;
          warpLines.push({
            x: cx, y: cy, angle,
            len: 0, maxLen: 60 + Math.random() * 80,
            speed: 8 + Math.random() * 8, alpha: 1, done: false,
          });
        }
      }

      // ── Stars (twinkling) ──
      stars.forEach(s => {
        const tw = Math.sin(t * s.speed + s.offset) * 0.4 + 0.6;
        // Subtle drift away from mouse
        const dx = s.x - mx, dy = s.y - my;
        const d = Math.sqrt(dx * dx + dy * dy);
        const repel = d < 80 ? (80 - d) / 80 * 1.5 : 0;
        const rx = d > 0 ? s.x + (dx / d) * repel : s.x;
        const ry = d > 0 ? s.y + (dy / d) * repel : s.y;

        // Stars near mouse glow
        const glow = Math.max(0, 1 - d / 120);

        if (glow > 0) {
          ctx.beginPath();
          ctx.arc(rx, ry, s.r + glow * 3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(244,63,94,${glow * 0.6})`;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(rx, ry, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `${s.color}${s.baseOpacity * tw})`;
        ctx.fill();
      });

      // ── Constellation nodes ──
      nodes.forEach(p => {
        const dx = p.x - mx, dy = p.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        // Push away from cursor
        if (dist < 140 && dist > 0) { p.x += (dx / dist) * 2; p.y += (dy / dist) * 2; }
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        const md = Math.sqrt((p.x - mx) ** 2 + (p.y - my) ** 2);
        const glow = Math.max(0, 1 - md / 200);
        // Pulse size
        const pulse = Math.sin(t * 0.05 + p.r) * 0.3 + 1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, (p.baseR + glow * 3) * pulse, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(244,63,94,${0.18 + glow * 0.8})`;
        ctx.fill();
      });

      // ── Constellation lines ──
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const d = Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
          if (d < 120) {
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(180,180,255,${(1 - d / 120) * 0.12})`;
            ctx.lineWidth = 0.6; ctx.stroke();
          }
        }
        // Beam to mouse
        const p = nodes[i];
        const md = Math.sqrt((p.x - mx) ** 2 + (p.y - my) ** 2);
        if (md < 180) {
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mx, my);
          ctx.strokeStyle = `rgba(244,63,94,${(1 - md / 180) * 0.5})`;
          ctx.lineWidth = 0.9; ctx.stroke();
        }
      }

      // ── Shockwaves ──
      for (let i = shockwaves.length - 1; i >= 0; i--) {
        const s = shockwaves[i];
        s.r += (s.maxR - s.r) * 0.06;
        s.alpha = Math.max(0, 1 - s.r / s.maxR);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(244,63,94,${s.alpha * 0.7})`;
        ctx.lineWidth = 2 - s.alpha;
        ctx.stroke();
        // Inner ring
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * 0.5, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(251,113,133,${s.alpha * 0.4})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        if (s.alpha < 0.01) shockwaves.splice(i, 1);
      }

      // ── Warp lines ──
      for (let i = warpLines.length - 1; i >= 0; i--) {
        const w = warpLines[i];
        w.len = Math.min(w.len + w.speed, w.maxLen);
        w.alpha -= 0.025;
        const ex = w.x + Math.cos(w.angle) * w.len;
        const ey = w.y + Math.sin(w.angle) * w.len;
        const sx = w.x + Math.cos(w.angle) * (w.len - 20);
        const sy = w.y + Math.sin(w.angle) * (w.len - 20);
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey);
        ctx.strokeStyle = `rgba(244,63,94,${Math.max(0, w.alpha)})`;
        ctx.lineWidth = 1.5; ctx.stroke();
        if (w.alpha <= 0) warpLines.splice(i, 1);
      }

      // ── Mouse glow orb ──
      const grad = ctx.createRadialGradient(mx, my, 0, mx, my, 180);
      grad.addColorStop(0, 'rgba(244,63,94,0.06)');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener('resize', onResize); };
  }, [mousePosRef, clicksRef]);

  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />;
}

// ── Autofill-proof floating label input ───────────────────────────────────────
function FloatInput({ id, type, label, value, onChange, required, autoComplete, rightEl }) {
  const [focused, setFocused] = useState(false);
  const active = focused || value.length > 0;

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <style>{`
        #${id}:-webkit-autofill, #${id}:-webkit-autofill:hover, #${id}:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px rgba(8,8,20,1) inset !important;
          -webkit-text-fill-color: white !important;
          caret-color: #f43f5e !important;
          transition: background-color 9999s;
        }
        #${id} { color-scheme: dark; }
      `}</style>
      {/* Glow */}
      <motion.div animate={{ opacity: focused ? 1 : 0 }}
        style={{ position: 'absolute', inset: -1, borderRadius: 14, pointerEvents: 'none', zIndex: 0, background: 'linear-gradient(135deg, rgba(244,63,94,0.55), rgba(251,113,133,0.15))', filter: 'blur(5px)' }} />
      {/* Box */}
      <motion.div animate={{ borderColor: focused ? 'rgba(244,63,94,0.6)' : 'rgba(255,255,255,0.09)', background: focused ? 'rgba(244,63,94,0.05)' : 'rgba(255,255,255,0.04)' }}
        style={{ position: 'relative', zIndex: 1, borderRadius: 14, height: 58, border: '1px solid rgba(255,255,255,0.09)', overflow: 'hidden', transition: 'all 0.25s' }}>
        {/* Scan line on focus */}
        <motion.div
          animate={{ y: focused ? ['0%', '5800%'] : '0%', opacity: focused ? [0, 0.8, 0] : 0 }}
          transition={{ duration: 1.4, repeat: focused ? Infinity : 0, ease: 'easeInOut' }}
          style={{ position: 'absolute', left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, #f43f5e, transparent)', pointerEvents: 'none', zIndex: 3 }}
        />
        {/* Label */}
        <label htmlFor={id} style={{
          position: 'absolute', left: 16, pointerEvents: 'none', zIndex: 2,
          fontSize: active ? 10 : 14, fontWeight: active ? 600 : 400,
          top: active ? 8 : '50%', transform: active ? 'none' : 'translateY(-50%)',
          color: focused ? '#f43f5e' : 'rgba(255,255,255,0.3)',
          letterSpacing: active ? '0.08em' : 0, textTransform: active ? 'uppercase' : 'none',
          transition: 'all 0.2s ease',
        }}>{label}</label>
        {/* Input */}
        <input id={id} type={type} value={value} onChange={onChange} required={required}
          autoComplete={autoComplete} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          data-testid={`${id}-input`}
          style={{
            position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
            height: '100%',
            paddingTop: active ? 22 : 0,
            paddingBottom: active ? 0 : 0,
            paddingLeft: 16, paddingRight: rightEl ? 44 : 16,
            background: 'transparent', border: 'none', outline: 'none',
            color: 'white', fontSize: 15, caretColor: '#f43f5e',
            width: '100%', boxSizing: 'border-box', zIndex: 1,
          }}
        />
        {rightEl && <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', zIndex: 4 }}>{rightEl}</div>}
      </motion.div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [spotPos, setSpotPos] = useState({ x: 50, y: 50 });
  const mousePosRef = useRef({ x: 50, y: 50 });
  const clicksRef = useRef([]);
  const cardRef = useRef(null);
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const { branding } = useBranding();

  useEffect(() => { if (isAuthenticated) navigate('/dashboard'); }, [isAuthenticated, navigate]);

  const handleMouseMove = useCallback((e) => {
    const px = (e.clientX / window.innerWidth) * 100;
    const py = (e.clientY / window.innerHeight) * 100;
    mousePosRef.current = { x: px, y: py };
    setSpotPos({ x: px, y: py });
    if (cardRef.current) {
      const r = cardRef.current.getBoundingClientRect();
      const inside = e.clientX > r.left && e.clientX < r.right && e.clientY > r.top && e.clientY < r.bottom;
      setTilt(inside ? { x: ((e.clientX - r.left) / r.width - 0.5) * 16, y: ((e.clientY - r.top) / r.height - 0.5) * -16 } : { x: 0, y: 0 });
    }
  }, []);

  const handleClick = useCallback((e) => {
    clicksRef.current.push({ x: (e.clientX / window.innerWidth) * 100, y: (e.clientY / window.innerHeight) * 100 });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    const result = await login(email, password);
    if (result.success) navigate('/dashboard');
    else setError(result.error);
    setLoading(false);
  };

  return (
    <div onMouseMove={handleMouseMove} onClick={handleClick} style={{
      minHeight: '100vh', width: '100%', position: 'relative', overflow: 'hidden',
      background: '#05050e', display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'crosshair',
    }}>
      {/* Wallpaper */}
      {branding.loginBackgroundUrl ? (
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, backgroundImage: `url(${branding.loginBackgroundUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.35) saturate(1.3)' }} />
      ) : (
        <motion.div style={{ position: 'absolute', inset: 0, zIndex: 0 }}
          animate={{ background: ['radial-gradient(ellipse at 15% 20%, #1c0438 0%, #05050e 65%)', 'radial-gradient(ellipse at 85% 80%, #001038 0%, #05050e 65%)', 'radial-gradient(ellipse at 15% 80%, #0e0025 0%, #05050e 65%)', 'radial-gradient(ellipse at 15% 20%, #1c0438 0%, #05050e 65%)'] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }} />
      )}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(2,2,10,0.6)', zIndex: 1 }} />

      {/* Interactive canvas */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 2 }}>
        <InteractiveCanvas mousePosRef={mousePosRef} clicksRef={clicksRef} />
      </div>

      {/* Moving spotlight */}
      <div style={{
        position: 'fixed', width: 600, height: 600, borderRadius: '50%', pointerEvents: 'none', zIndex: 3,
        background: 'radial-gradient(circle, rgba(244,63,94,0.07) 0%, transparent 68%)',
        left: `${spotPos.x}%`, top: `${spotPos.y}%`, transform: 'translate(-50%,-50%)',
        transition: 'left 0.2s ease-out, top 0.2s ease-out',
      }} />

      {/* Layout */}
      <div style={{
        position: 'relative', zIndex: 10, width: '100%', maxWidth: 1100,
        margin: '0 auto', padding: '48px 40px', boxSizing: 'border-box',
        display: 'grid', gridTemplateColumns: '1fr 480px', gap: 72, alignItems: 'center',
      }}>

        {/* Left */}
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, ease: [0.16,1,0.3,1] }}
          style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <motion.div whileHover={{ scale: 1.1, boxShadow: '0 0 40px rgba(244,63,94,0.6)', rotate: 5 }}
              transition={{ type: 'spring', stiffness: 300 }}
              style={{ width: 52, height: 52, borderRadius: 15, overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'default', background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.28)' }}>
              {branding.logoUrl ? <img src={branding.logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <Package style={{ width: 22, height: 22, color: '#fb7185' }} />}
            </motion.div>
            <div>
              <div style={{ color: 'white', fontWeight: 700, fontSize: 18 }}>{branding.appName || 'AssetFlow'}</div>
              <div style={{ color: 'rgba(255,255,255,0.27)', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase' }}>IT Asset Management</div>
            </div>
          </div>

          <motion.h1 initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.8 }}
            style={{ margin: 0, fontSize: 60, fontWeight: 900, lineHeight: 1.04, color: 'white', letterSpacing: -2 }}>
            {branding.loginTitle || (<>Every asset,<br />
              <span style={{ background: 'linear-gradient(90deg, #f43f5e, #fb7185, #fda4af)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>in control.</span></>)}
          </motion.h1>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
            style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {['Track assets', 'Assign employees', 'Transfer history', 'Sync instantly'].map((f, i) => (
              <motion.div key={f} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 + i * 0.07 }}
                whileHover={{ scale: 1.08, background: 'rgba(244,63,94,0.15)', borderColor: 'rgba(244,63,94,0.55)', color: 'white', y: -3, boxShadow: '0 8px 20px rgba(244,63,94,0.2)' }}
                style={{ padding: '8px 18px', borderRadius: 999, fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.42)', cursor: 'default', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', transition: 'all 0.22s' }}>
                {f}
              </motion.div>
            ))}
          </motion.div>

          {/* Hint */}
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
            style={{ color: 'rgba(255,255,255,0.14)', fontSize: 12, margin: 0 }}>
            Click anywhere to create a ripple ✦
          </motion.p>
        </motion.div>

        {/* Right: Card */}
        <motion.div ref={cardRef}
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.16,1,0.3,1], delay: 0.08 }}
          style={{ position: 'relative', transform: `perspective(900px) rotateY(${tilt.x}deg) rotateX(${tilt.y}deg)`, transition: 'transform 0.16s ease-out' }}>

          {/* Spinning border */}
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}
            style={{ position: 'absolute', inset: -2, borderRadius: 28, zIndex: 0, pointerEvents: 'none', background: 'conic-gradient(from 0deg, transparent 0%, rgba(244,63,94,0.6) 18%, transparent 36%, rgba(251,113,133,0.25) 55%, transparent 75%)', filter: 'blur(5px)' }} />

          {/* Hover inner glow */}
          <motion.div
            animate={{ opacity: tilt.x !== 0 || tilt.y !== 0 ? 1 : 0 }}
            style={{ position: 'absolute', inset: 0, borderRadius: 26, pointerEvents: 'none', zIndex: 0, background: 'radial-gradient(ellipse at 50% 0%, rgba(244,63,94,0.12), transparent 70%)', transition: 'opacity 0.3s' }} />

          {/* Card body */}
          <div style={{
            position: 'relative', zIndex: 1, borderRadius: 26, padding: 36, boxSizing: 'border-box',
            background: 'rgba(6,6,16,0.92)', backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)',
            border: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 50px 100px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}>
            <div style={{ position: 'absolute', top: 0, left: 28, right: 28, height: 1, background: 'linear-gradient(90deg, transparent, rgba(244,63,94,0.6), transparent)' }} />

            {/* Lock with pulse ring */}
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: 22 }}>
              <motion.div animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{ position: 'absolute', inset: -6, borderRadius: 20, border: '1px solid rgba(244,63,94,0.4)', pointerEvents: 'none' }} />
              <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.4, type: 'spring', stiffness: 250 }}
                whileHover={{ scale: 1.15, boxShadow: '0 0 30px rgba(244,63,94,0.6)', rotate: -5 }}
                style={{ width: 48, height: 48, borderRadius: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'default', background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.28)' }}>
                <Lock style={{ width: 20, height: 20, color: '#fb7185' }} />
              </motion.div>
            </div>

            <h2 style={{ color: 'white', fontSize: 24, fontWeight: 700, margin: '0 0 4px' }}>Welcome back</h2>
            <p style={{ color: 'rgba(255,255,255,0.26)', fontSize: 14, margin: '0 0 26px' }}>
              Sign in to continue to {branding.appName || 'your workspace'}
            </p>

            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 12, marginBottom: 16, fontSize: 13, background: 'rgba(244,63,94,0.09)', border: '1px solid rgba(244,63,94,0.3)', color: '#fb7185', overflow: 'hidden' }}
                  data-testid="login-error">
                  <AlertCircle style={{ width: 14, height: 14, flexShrink: 0 }} />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <FloatInput id="email" type="email" label="Email address"
                value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
              <FloatInput id="password" type={showPw ? 'text' : 'password'} label="Password"
                value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password"
                rightEl={
                  <button type="button" onClick={() => setShowPw(!showPw)} data-testid="toggle-password"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', color: 'rgba(255,255,255,0.3)' }}>
                    <motion.div whileHover={{ scale: 1.2, color: 'rgba(255,255,255,0.7)' }}>
                      {showPw ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
                    </motion.div>
                  </button>
                }
              />

              <div style={{ textAlign: 'right', marginTop: -2 }}>
                <Link to="/forgot-password" style={{ color: 'rgba(244,63,94,0.6)', fontSize: 12, textDecoration: 'none' }}>
                  Forgot password?
                </Link>
              </div>

              <motion.button type="submit" disabled={loading}
                whileHover={!loading ? { scale: 1.02, y: -2, boxShadow: '0 0 50px rgba(244,63,94,0.6), 0 8px 25px rgba(244,63,94,0.35)' } : {}}
                whileTap={{ scale: 0.97 }}
                style={{
                  width: '100%', padding: '15px 0', borderRadius: 14, border: 'none',
                  fontWeight: 600, fontSize: 15, color: 'white', cursor: loading ? 'not-allowed' : 'pointer',
                  background: loading ? 'rgba(244,63,94,0.3)' : 'linear-gradient(135deg, #f43f5e, #e11d48)',
                  boxShadow: loading ? 'none' : '0 0 35px rgba(244,63,94,0.4)',
                  position: 'relative', overflow: 'hidden', marginTop: 4,
                }}
                data-testid="login-submit-btn"
              >
                {!loading && (
                  <motion.div animate={{ x: ['-120%', '220%'] }}
                    transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1.5 }}
                    style={{ position: 'absolute', inset: 0, background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.2) 50%, transparent 60%)', pointerEvents: 'none' }} />
                )}
                <span style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  {loading ? <LoadingSpinner size="sm" className="text-white" /> : 'Sign In'}
                </span>
              </motion.button>
            </form>

            <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.1)', marginTop: 22, marginBottom: 0 }}>
              {branding.appName || 'AssetFlow'} • Internal IT Asset Management
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
