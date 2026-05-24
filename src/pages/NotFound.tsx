import { useNavigate, useLocation } from 'react-router-dom';
import { Star, Key, Home, ArrowLeft, Crown } from 'lucide-react';

const GOLD = '#d4af37';
const GOLD_DARK = '#a0830a';
const GOLD_LIGHT = '#f4d03f';

export default function NotFound() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes pulse-glow {
          0%, 100% { filter: drop-shadow(0 0 12px rgba(212,175,55,0.35)); }
          50%       { filter: drop-shadow(0 0 28px rgba(212,175,55,0.65)); }
        }
        .anim-1 { animation: fadeInUp 0.7s ease 0s       forwards; opacity: 0; }
        .anim-2 { animation: fadeInUp 0.7s ease 0.15s    forwards; opacity: 0; }
        .anim-3 { animation: fadeInUp 0.7s ease 0.30s    forwards; opacity: 0; }
        .anim-4 { animation: fadeInUp 0.7s ease 0.45s    forwards; opacity: 0; }
        .anim-5 { animation: fadeInUp 0.7s ease 0.60s    forwards; opacity: 0; }
        .anim-6 { animation: fadeInUp 0.7s ease 0.75s    forwards; opacity: 0; }
        .logo-glow { animation: pulse-glow 3s ease-in-out infinite; }
        .gold-shimmer {
          background: linear-gradient(90deg, ${GOLD} 0%, ${GOLD_LIGHT} 30%, #fff8dc 50%, ${GOLD_LIGHT} 70%, ${GOLD} 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 4s linear infinite;
        }
        .four-zero-four {
          background: linear-gradient(135deg, ${GOLD} 0%, ${GOLD_LIGHT} 40%, ${GOLD} 70%, ${GOLD_DARK} 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          filter: drop-shadow(0 4px 24px rgba(212,175,55,0.45));
        }
        .btn-primary  { transition: all 0.2s ease; }
        .btn-primary:hover  { opacity: 0.88; transform: translateY(-1px); }
        .btn-secondary { transition: all 0.2s ease; }
        .btn-secondary:hover { background: rgba(212,175,55,0.12) !important; transform: translateY(-1px); }
      `}</style>

      <div
        className="min-h-screen flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0a1120 0%, #131e32 50%, #0a1120 100%)' }}
      >
        {/* Luxury wallpaper pattern overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: 0.045,
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4af37'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Ambient glow orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.06) 0%, transparent 70%)', transform: 'translate(-50%,-50%)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.04) 0%, transparent 70%)', transform: 'translate(50%,50%)' }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center gap-5 max-w-lg w-full text-center">

          {/* Stars */}
          <div className="flex gap-1.5 anim-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={14} className="fill-[#d4af37] text-[#d4af37]" />
            ))}
          </div>

          {/* Logo */}
          <div className="anim-1 logo-glow">
            <img
              src="/mxlogo-black.png"
              alt="Maxy Grand Hotel"
              className="h-20 w-auto mx-auto"
              style={{ filter: 'invert(1) brightness(0.9) sepia(0.6) saturate(2.5) hue-rotate(5deg)' }}
            />
          </div>

          {/* Top divider */}
          <div className="anim-2 flex items-center gap-3 w-full">
            <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, transparent, ${GOLD})` }} />
            <Crown size={13} style={{ color: GOLD }} />
            <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${GOLD}, transparent)` }} />
          </div>

          {/* Hotel name */}
          <div className="anim-2 space-y-0.5">
            <p className="gold-shimmer text-2xl sm:text-3xl font-bold tracking-[0.22em] uppercase">
              Maxy Grand Hotel
            </p>
            <p className="text-[10px] tracking-[0.4em] uppercase" style={{ color: `${GOLD}88` }}>
              Hospitality Redefined
            </p>
          </div>

          {/* Bottom divider */}
          <div className="anim-2 flex items-center gap-3 w-full">
            <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, transparent, ${GOLD})` }} />
            <Crown size={13} style={{ color: GOLD }} />
            <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${GOLD}, transparent)` }} />
          </div>

          {/* 404 */}
          <div
            className="four-zero-four anim-3 font-extrabold leading-none select-none"
            style={{ fontSize: 'clamp(5.5rem, 18vw, 9.5rem)', letterSpacing: '0.12em' }}
          >
            404
          </div>

          {/* Hotel plaque */}
          <div
            className="anim-4 w-full max-w-sm px-8 py-5"
            style={{
              border: `1px solid ${GOLD}50`,
              background: 'rgba(212,175,55,0.06)',
              boxShadow: `0 0 40px rgba(212,175,55,0.1), inset 0 0 24px rgba(212,175,55,0.04)`,
            }}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}70)` }} />
              <Key size={12} style={{ color: GOLD }} />
              <span className="text-[10px] font-bold tracking-[0.3em] uppercase" style={{ color: GOLD }}>
                Room Not Available
              </span>
              <Key size={12} style={{ color: GOLD }} />
              <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${GOLD}70, transparent)` }} />
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">
              This suite does not exist on our hotel floor plan.
            </p>
          </div>

          {/* Description */}
          <div className="anim-4 space-y-1.5">
            <p className="text-slate-300 text-base leading-relaxed">
              The page you requested has checked out<br className="hidden sm:block" />
              or was never part of our establishment.
            </p>
            {location.pathname !== '/' && (
              <p className="text-slate-600 text-xs tracking-widest uppercase font-mono">
                Requested floor:{' '}
                <span className="text-slate-500">{location.pathname}</span>
              </p>
            )}
          </div>

          {/* Buttons */}
          <div className="anim-5 flex flex-col sm:flex-row gap-3 w-full max-w-sm mt-1">
            <button
              onClick={() => navigate('/')}
              className="btn-primary flex-1 flex items-center justify-center gap-2 px-6 py-3 font-bold text-[11px] tracking-[0.2em] uppercase"
              style={{
                background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_DARK} 100%)`,
                color: '#0a1120',
              }}
            >
              <Home size={14} />
              Return to Lobby
            </button>
            <button
              onClick={() => navigate(-1)}
              className="btn-secondary flex-1 flex items-center justify-center gap-2 px-6 py-3 font-bold text-[11px] tracking-[0.2em] uppercase"
              style={{
                border: `1px solid ${GOLD}60`,
                color: GOLD,
                background: 'transparent',
              }}
            >
              <ArrowLeft size={14} />
              Go Back
            </button>
          </div>

          {/* Concierge note */}
          <div className="anim-6 flex items-center gap-3 w-full mt-1">
            <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}25)` }} />
            <span className="text-[10px] tracking-widest uppercase" style={{ color: `${GOLD}50` }}>
              Need Assistance?
            </span>
            <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${GOLD}25, transparent)` }} />
          </div>
          <p className="anim-6 text-slate-600 text-xs tracking-wider -mt-2">
            Our concierge is available 24 &times; 7 to guide you back.
          </p>

          {/* Footer */}
          <p className="anim-6 text-slate-700 text-[10px] tracking-[0.3em] uppercase mt-1">
            &copy; {new Date().getFullYear()} Maxy Grand Hotel &mdash; All Rights Reserved
          </p>
        </div>
      </div>
    </>
  );
}
