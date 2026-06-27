import React from 'react';
import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row font-sans" style={{ background: '#0B1120' }}>

      {/* ── Left Branding Panel ── */}
      <div
        className="relative flex flex-col justify-center items-center lg:items-start w-full lg:w-5/12 xl:w-[42%] overflow-hidden px-10 py-14 lg:px-16 lg:py-0"
        style={{ minHeight: '220px' }}
      >
        {/* Ambient glow blobs */}
        <div className="pointer-events-none absolute inset-0">
          {/* Amber top-right glow */}
          <div
            style={{
              position: 'absolute', top: '-80px', right: '-60px',
              width: '420px', height: '420px',
              background: 'radial-gradient(circle, rgba(217,123,63,0.18) 0%, transparent 70%)',
              borderRadius: '50%',
            }}
          />
          {/* Purple bottom-left glow */}
          <div
            style={{
              position: 'absolute', bottom: '-100px', left: '-80px',
              width: '380px', height: '380px',
              background: 'radial-gradient(circle, rgba(139,92,246,0.13) 0%, transparent 70%)',
              borderRadius: '50%',
            }}
          />
          {/* Subtle amber center band */}
          <div
            style={{
              position: 'absolute', top: '50%', left: '0', right: '0',
              height: '1px',
              background: 'linear-gradient(90deg, transparent, rgba(217,123,63,0.15), transparent)',
              transform: 'translateY(-50%)',
            }}
          />
          {/* Faint joinery grid pattern */}
          <svg
            className="absolute inset-0 w-full h-full opacity-[0.04]"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern id="joinery" x="0" y="0" width="48" height="48" patternUnits="userSpaceOnUse">
                <path d="M0 24h48M24 0v48M12 12h24v24H12z" fill="none" stroke="#D97B3F" strokeWidth="0.8"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#joinery)" />
          </svg>
        </div>

        {/* Branding content */}
        <div className="relative z-10 flex flex-col items-center lg:items-start text-center lg:text-left w-full max-w-md">
          {/* Logo */}
          <div className="mb-8 flex items-center justify-center lg:justify-start">
            <img
              src="/logo.png?v=2"
              alt="SVS Furniture Works"
              className="w-28 h-28 object-contain rounded-2xl shadow-[0_0_48px_rgba(217,123,63,0.28)]"
              style={{ background: 'rgba(255,255,255,0.04)', padding: '8px' }}
            />
          </div>

          {/* Text */}
          <h1
            className="text-white font-extrabold tracking-tight leading-tight"
            style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)' }}
          >
            SVS Furniture Works
          </h1>
          <p
            className="mt-2 font-semibold tracking-widest uppercase"
            style={{ fontSize: '0.68rem', letterSpacing: '0.18em', color: '#D97B3F' }}
          >
            Order Specification Sheet System
          </p>
          <p
            className="mt-5 text-slate-400 leading-relaxed hidden lg:block"
            style={{ fontSize: '0.875rem', maxWidth: '340px' }}
          >
            Manage custom orders, production, and delivery —&nbsp;all in one place.
          </p>

          {/* Decorative divider */}
          <div className="hidden lg:flex items-center gap-3 mt-10">
            <div style={{ width: '32px', height: '2px', background: '#D97B3F', borderRadius: '2px', opacity: 0.7 }} />
            <div style={{ width: '8px', height: '8px', background: '#D97B3F', borderRadius: '50%', opacity: 0.5 }} />
            <div style={{ width: '16px', height: '2px', background: '#8B5CF6', borderRadius: '2px', opacity: 0.4 }} />
          </div>
        </div>
      </div>

      {/* ── Right Form Panel ── */}
      <div
        className="relative flex flex-col justify-center items-center flex-1 px-6 py-12 lg:px-16"
        style={{ background: '#111827' }}
      >
        {/* Faint top border line on the form side (desktop) */}
        <div
          className="hidden lg:block absolute top-0 left-0 bottom-0 w-px"
          style={{ background: 'linear-gradient(180deg, transparent, rgba(217,123,63,0.2), transparent)' }}
        />

        <div className="w-full max-w-sm">
          <Outlet />
        </div>

        {/* Footer */}
        <p
          className="absolute bottom-5 left-0 right-0 text-center"
          style={{ fontSize: '0.72rem', color: '#4B5563' }}
        >
          &copy; {new Date().getFullYear()} SVS Furniture Works. All rights reserved.
        </p>
      </div>

    </div>
  );
};

export default AuthLayout;
