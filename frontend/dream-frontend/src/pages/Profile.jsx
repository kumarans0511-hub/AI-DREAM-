import React, { useState } from 'react';
import {
  User, Mail, Shield, Brain, Moon, Zap, Edit3, Save, X,
  Camera, Clock, CheckCircle, Star, Activity, Database,
  Key, Globe, Smartphone, Lock, Eye, EyeOff
} from 'lucide-react';

const USER_EMAIL    = 'kumarans0511@gmail.com';
const USER_NAME     = 'Kumaran Senthil';
const USER_INITIALS = 'KS';

/* ── small stat card ── */
function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="surface-card p-5 flex items-center gap-4">
      <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
        style={{ background: `${color}18` }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div>
        <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
        <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>{label}</p>
      </div>
    </div>
  );
}

/* ── editable field ── */
function Field({ label, value, editable, type = 'text', onChange, readOnly }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold mb-1.5 uppercase tracking-wide"
        style={{ color: 'var(--text-muted)' }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange?.(e.target.value)}
        readOnly={!editable || readOnly}
        className="w-full px-4 py-2.5 rounded-xl text-sm transition-all outline-none"
        style={{
          background: editable && !readOnly ? 'var(--bg-base)' : 'var(--bg-card)',
          border: `1.5px solid ${editable && !readOnly ? 'var(--brand-primary)' : 'var(--border)'}`,
          color: 'var(--text-primary)',
          cursor: !editable || readOnly ? 'default' : 'text',
        }}
      />
    </div>
  );
}

export default function Profile() {
  const [editing, setEditing] = useState(false);
  const [saved, setSaved]     = useState(false);

  const [form, setForm] = useState({
    name:     USER_NAME,
    email:    USER_EMAIL,
    username: 'kumarans0511',
    role:     'DREAM Admin',
    timezone: 'Asia/Kolkata (IST, UTC+5:30)',
    phone:    '+91 •••• •••• ••',
    bio:      'AI researcher using DREAM to model personal memory with cognitive-inspired LLM pipelines.',
  });

  const [showPw, setShowPw] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setEditing(false);
    setTimeout(() => setSaved(false), 3000);
  };

  const field = (key) => ({
    value: form[key],
    editable: editing,
    onChange: (v) => setForm(f => ({ ...f, [key]: v })),
  });

  return (
    <div className="space-y-6 max-w-4xl">
      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>My Profile</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Manage your personal info, preferences, and security settings
          </p>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button onClick={() => setEditing(false)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                <X size={14} /> Cancel
              </button>
              <button onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: 'var(--brand-dark)' }}>
                <Save size={14} /> Save Changes
              </button>
            </>
          ) : (
            <button onClick={() => setEditing(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: 'var(--brand-dark)' }}>
              <Edit3 size={14} /> Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Saved toast */}
      {saved && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-white"
          style={{ background: '#16a34a', animation: 'fadeInUp .2s ease' }}>
          <CheckCircle size={15} /> Profile saved successfully!
        </div>
      )}

      {/* ── Hero card ── */}
      <div className="surface-card p-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white"
              style={{ background: 'var(--brand-dark)' }}>
              {USER_INITIALS}
            </div>
            {editing && (
              <button
                className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center text-white shadow-md hover:opacity-90 transition-opacity"
                style={{ background: 'var(--brand-primary)' }}
                title="Change avatar">
                <Camera size={13} />
              </button>
            )}
          </div>

          {/* Identity */}
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{form.name}</h2>
            <p className="text-[13px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{USER_EMAIL}</p>
            <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
              <span className="px-3 py-1 rounded-full text-[11px] font-semibold text-white"
                style={{ background: 'var(--brand-dark)' }}>
                {form.role}
              </span>
              <span className="px-3 py-1 rounded-full text-[11px] font-semibold"
                style={{ background: 'rgba(22,163,74,0.12)', color: '#16a34a' }}>
                ● Active
              </span>
              <span className="px-3 py-1 rounded-full text-[11px] font-medium"
                style={{ background: 'var(--bg-base)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                {form.timezone}
              </span>
            </div>
            <p className="text-[13px] mt-3 max-w-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {form.bio}
            </p>
          </div>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Memories Stored"  value="7+"  icon={Brain}    color="#1A5632" />
        <StatCard label="Dream Cycles"     value="1"   icon={Moon}     color="#7C3AED" />
        <StatCard label="Retention Score"  value="87%" icon={Star}     color="#D97706" />
        <StatCard label="Eval Tests Run"   value="2"   icon={Activity} color="#0369A1" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ── Personal Information ── */}
        <div className="surface-card p-6 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <User size={15} style={{ color: 'var(--brand-primary)' }} />
            <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Personal Information</h3>
          </div>
          <Field label="Full Name"   {...field('name')} />
          <Field label="Username"    {...field('username')} />
          <Field label="Email"       {...field('email')} type="email" readOnly />
          <Field label="Phone"       {...field('phone')} readOnly />
          <Field label="Role"        {...field('role')}  readOnly />
          <Field label="Timezone"    {...field('timezone')} readOnly />
          <div>
            <label className="block text-[11px] font-semibold mb-1.5 uppercase tracking-wide"
              style={{ color: 'var(--text-muted)' }}>Bio</label>
            <textarea
              rows={3}
              value={form.bio}
              readOnly={!editing}
              onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl text-sm resize-none outline-none transition-all"
              style={{
                background: editing ? 'var(--bg-base)' : 'var(--bg-card)',
                border: `1.5px solid ${editing ? 'var(--brand-primary)' : 'var(--border)'}`,
                color: 'var(--text-primary)',
                cursor: !editing ? 'default' : 'text',
              }}
            />
          </div>
        </div>

        {/* ── Security ── */}
        <div className="space-y-4">
          <div className="surface-card p-6 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Shield size={15} style={{ color: 'var(--brand-primary)' }} />
              <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Security</h3>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[11px] font-semibold mb-1.5 uppercase tracking-wide"
                style={{ color: 'var(--text-muted)' }}>Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value="••••••••••••"
                  readOnly
                  className="w-full px-4 py-2.5 rounded-xl text-sm"
                  style={{ background: 'var(--bg-card)', border: '1.5px solid var(--border)', color: 'var(--text-primary)' }}
                />
                <button onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-70 transition-opacity">
                  {showPw ? <EyeOff size={14} style={{ color: 'var(--text-muted)' }} />
                           : <Eye    size={14} style={{ color: 'var(--text-muted)' }} />}
                </button>
              </div>
            </div>

            <button className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-[12px] font-medium transition-colors hover:opacity-90"
              style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
              <Key size={13} /> Change Password
            </button>

            {/* 2FA */}
            <div className="flex items-center justify-between px-4 py-3 rounded-xl"
              style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2">
                <Smartphone size={14} style={{ color: 'var(--text-muted)' }} />
                <span className="text-[13px]" style={{ color: 'var(--text-primary)' }}>Two-Factor Auth</span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
                style={{ background: 'rgba(220,38,38,0.1)', color: '#dc2626' }}>
                Disabled
              </span>
            </div>

            <button className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-[12px] font-medium text-white transition-opacity hover:opacity-90"
              style={{ background: '#0369A1' }}>
              <Lock size={13} /> Enable 2FA
            </button>
          </div>

          {/* ── Connected Accounts ── */}
          <div className="surface-card p-6 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Globe size={15} style={{ color: 'var(--brand-primary)' }} />
              <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Connected Accounts</h3>
            </div>
            {[
              { label: 'Gmail',     value: USER_EMAIL, connected: true,  color: '#EA4335' },
              { label: 'Ollama',    value: 'localhost:11434 · llama3.1:8b', connected: true, color: '#1A5632' },
              { label: 'ChromaDB', value: 'Vector store · 118 docs',     connected: true,  color: '#7C3AED' },
            ].map(a => (
              <div key={a.label} className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
                <div>
                  <p className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>{a.label}</p>
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{a.value}</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: `${a.color}14`, color: a.color }}>
                  {a.connected ? '● Connected' : 'Connect'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Activity log ── */}
      <div className="surface-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={15} style={{ color: 'var(--brand-primary)' }} />
          <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Recent Activity</h3>
        </div>
        <div className="space-y-2">
          {[
            { action: 'LongMemEval smoke test completed',    time: '2h ago',  icon: Zap,      color: '#D97706' },
            { action: 'Dream cycle ran · 7 memories processed', time: '3h ago', icon: Moon,    color: '#7C3AED' },
            { action: 'Memory extracted: "owns a dog Simba"', time: '4h ago', icon: Brain,    color: '#1A5632' },
            { action: 'Logged in from macOS · Brave Browser',  time: '5h ago', icon: Shield,   color: '#0369A1' },
            { action: 'ChromaDB collection initialised',       time: '8h ago', icon: Database, color: '#059669' },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors hover:bg-black/5">
                <div className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: `${item.color}14` }}>
                  <Icon size={13} style={{ color: item.color }} />
                </div>
                <span className="flex-1 text-[13px]" style={{ color: 'var(--text-primary)' }}>{item.action}</span>
                <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{item.time}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
