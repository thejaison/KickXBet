import React, { useState } from "react";
import { API_BASE_URL } from '../api';

export default function AuthPage({ onLogin, onBack }) {
  const [formData, setFormData] = useState({ username: '', email: '', password: '', otp: '' });
  const [otpSent, setOtpSent] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setStatusMessage('');

    if (!formData.username || !formData.password) {
      setStatusMessage('Enter username and password to login.');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Unable to login.');
      }

      onLogin({ username: formData.username, password: formData.password, ...result });
    } catch (error) {
      setStatusMessage(error.message || 'Unable to login.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setStatusMessage('');

    if (!formData.username || !formData.email || !formData.password) {
      setStatusMessage('Please enter username, email, and password to register.');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Unable to send OTP.');
      }

      setOtpSent(true);
      setStatusMessage(result.message || 'OTP sent to your email.');
    } catch (error) {
      setStatusMessage(error.message || 'Unable to send OTP.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setStatusMessage('');

    if (!formData.username || !formData.otp) {
      setStatusMessage('Enter your username and OTP code.');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: formData.username, code: formData.otp }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'OTP verification failed.');
      }

      setStatusMessage(result.message || 'Email verified successfully. Please login.');
      setOtpSent(false);
    } catch (error) {
      setStatusMessage(error.message || 'OTP verification failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      <button onClick={onBack} className="absolute top-6 left-6 text-gray-400 hover:text-white transition-all text-sm">
        ← Back to Home
      </button>

      <div className="glass-panel p-8 rounded-2xl w-full max-w-md shadow-2xl">
        <h2 className="text-3xl font-black mb-2 tracking-tight">Login or Register</h2>
        <p className="text-gray-400 text-sm mb-6">Use login if you already have an account. Register to create a new account and verify email.</p>

        <form className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1">Special Username</label>
            <input
              type="text"
              required
              value={formData.username}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-neonGreen/50 transition-all text-sm"
              placeholder="e.g. cristiano123"
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1">Gmail Address</label>
            <input
              type="email"
              required
              value={formData.email}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-neonGreen/50 transition-all text-sm"
              placeholder="you@gmail.com"
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1">Password</label>
            <input
              type="password"
              required
              value={formData.password}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-neonGreen/50 transition-all text-sm"
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          {otpSent && (
            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1">OTP Code</label>
              <input
                type="text"
                value={formData.otp}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-neonGreen/50 transition-all text-sm"
                placeholder="Enter OTP"
                onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
              />
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={handleLogin}
              className="glass-button-green w-full text-white py-3 rounded-xl font-bold text-sm tracking-wide mt-2"
              disabled={isProcessing}
            >
              {isProcessing ? 'Logging in...' : 'Login'}
            </button>
            <button
              type="button"
              onClick={handleSendOtp}
              className="glass-button-white w-full text-gray-900 py-3 rounded-xl font-bold text-sm tracking-wide mt-2"
              disabled={isProcessing}
            >
              {isProcessing ? 'Registering...' : 'Register & Verify'}
            </button>
          </div>
          {otpSent && (
            <button
              type="button"
              onClick={handleVerifyOtp}
              className="glass-button-green w-full text-white py-3 rounded-xl font-bold text-sm tracking-wide mt-2"
              disabled={isProcessing}
            >
              {isProcessing ? 'Verifying...' : 'Verify OTP'}
            </button>
          )}
        </form>

        {statusMessage && <p className="mt-4 text-sm text-emerald-300">{statusMessage}</p>}
      </div>
    </div>
  );
}
