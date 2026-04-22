import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building2, User, Mail, Lock, Eye, EyeOff, UserPlus, Zap } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    companyName: '',
    name: '',
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fields = [
    { id: 'register-company', label: 'Company Name', key: 'companyName', type: 'text', icon: Building2, placeholder: 'Acme Corp' },
    { id: 'register-name', label: 'Your Name', key: 'name', type: 'text', icon: User, placeholder: 'John Doe' },
    { id: 'register-email', label: 'Email Address', key: 'email', type: 'email', icon: Mail, placeholder: 'admin@company.com' },
  ];

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--color-bg)' }}>
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 50%, #8b5cf6 100%)',
        }}>
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'white' }} />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full opacity-10"
          style={{ background: 'white' }} />

        <div className="relative z-10 text-center px-12 animate-fade-in">
          <div className="inline-flex items-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)' }}>
              <Zap size={28} color="white" />
            </div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight">Unolo</h1>
          </div>
          <p className="text-xl text-white/80 font-light max-w-md leading-relaxed">
            Start managing your field workforce in minutes. Set up your organization and invite your team.
          </p>

          <div className="mt-12 space-y-4 text-left max-w-sm mx-auto">
            {[
              'Real-time GPS tracking',
              'Smart shift scheduling',
              'Attendance & leave management',
              'Performance analytics',
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-white/90">
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.2)' }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3 7l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="text-sm font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel — Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md animate-fade-in">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-10 justify-center">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--color-primary)' }}>
              <Zap size={20} color="white" />
            </div>
            <span className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Unolo</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>Create your account</h2>
            <p className="mt-2 text-base" style={{ color: 'var(--color-text-muted)' }}>
              Set up your organization and get started
            </p>
          </div>

          {error && (
            <div className="mb-6 px-4 py-3 rounded-lg text-sm font-medium animate-fade-in"
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#fca5a5',
              }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map(({ id, label, key, type, icon: Icon, placeholder }) => (
              <div key={key}>
                <label htmlFor={id} className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--color-text-muted)' }}>
                  {label}
                </label>
                <div className="relative">
                  <Icon size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--color-text-dim)' }} />
                  <input
                    id={id}
                    type={type}
                    value={form[key as keyof typeof form]}
                    onChange={(e) => updateField(key, e.target.value)}
                    placeholder={placeholder}
                    required
                    className="w-full pl-11 pr-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                    style={{
                      background: 'var(--color-bg-input)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text)',
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                    onBlur={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
                  />
                </div>
              </div>
            ))}

            {/* Password */}
            <div>
              <label htmlFor="register-password" className="block text-sm font-medium mb-2"
                style={{ color: 'var(--color-text-muted)' }}>
                Password
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--color-text-dim)' }} />
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  placeholder="Min. 8 characters"
                  required
                  minLength={8}
                  className="w-full pl-11 pr-12 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                  style={{
                    background: 'var(--color-bg-input)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text)',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 hover:opacity-80 transition-opacity"
                  style={{ color: 'var(--color-text-dim)', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {form.password.length > 0 && form.password.length < 8 && (
                <p className="mt-1.5 text-xs" style={{ color: 'var(--color-warning)' }}>
                  Password must be at least 8 characters
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              id="register-submit"
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer mt-6"
              style={{
                background: isSubmitting
                  ? 'var(--color-primary-light)'
                  : 'linear-gradient(135deg, var(--color-primary) 0%, #8b5cf6 100%)',
                boxShadow: 'var(--shadow-md)',
                opacity: isSubmitting ? 0.7 : 1,
                border: 'none',
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus size={18} />
                  Create Account
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold hover:underline"
              style={{ color: 'var(--color-primary-light)' }}
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
