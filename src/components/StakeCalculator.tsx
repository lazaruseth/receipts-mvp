'use client';

import { useState } from 'react';
import type { StakeCalculation, ActiveStake } from '@/lib/staking';

interface StakeCalculatorProps {
  agentId: string;
  agentName?: string;
  onStakeLocked?: (stake: ActiveStake) => void;
}

export default function StakeCalculator({
  agentId,
  agentName = 'Agent',
  onStakeLocked,
}: StakeCalculatorProps) {
  const [requestedLimit, setRequestedLimit] = useState(300);
  const [category, setCategory] = useState('general');
  const [calculation, setCalculation] = useState<StakeCalculation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lockingStake, setLockingStake] = useState(false);
  const [lockedStake, setLockedStake] = useState<ActiveStake | null>(null);

  const categories = [
    { value: 'general', label: '📦 General Purchase' },
    { value: 'travel', label: '✈️ Travel & Hospitality' },
    { value: 'software', label: '💻 Software & SaaS' },
    { value: 'retail', label: '🛒 Retail' },
    { value: 'financial', label: '💳 Financial Services' },
  ];

  const calculateStake = async () => {
    setLoading(true);
    setError('');
    setCalculation(null);

    try {
      const res = await fetch('/api/stake/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, requestedLimit, category }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Calculation failed');
      }

      setCalculation(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate');
    } finally {
      setLoading(false);
    }
  };

  const lockStake = async () => {
    if (!calculation || !calculation.eligible) return;

    setLockingStake(true);
    setError('');

    try {
      const res = await fetch('/api/stake/lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, requestedLimit, category }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to lock stake');
      }

      setLockedStake(data.stake);
      if (onStakeLocked) {
        onStakeLocked(data.stake);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to lock stake');
    } finally {
      setLockingStake(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low':
        return 'text-green-600 bg-green-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'high':
        return 'text-orange-600 bg-orange-100';
      case 'extreme':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (lockedStake) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🔒</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Stake Locked!</h3>
          <p className="text-gray-600 mb-4">
            {lockedStake.stakedAmount} points staked for ${lockedStake.requestedLimit} {lockedStake.category} transaction
          </p>
          <div className="bg-gray-50 rounded-lg p-4 text-left">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Stake ID</p>
                <p className="font-mono text-gray-900">{lockedStake.id}</p>
              </div>
              <div>
                <p className="text-gray-500">Expires</p>
                <p className="text-gray-900">{new Date(lockedStake.expiresAt).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-gray-500">Potential Gain</p>
                <p className="text-green-600 font-semibold">+{lockedStake.potentialGain} pts</p>
              </div>
              <div>
                <p className="text-gray-500">Potential Loss</p>
                <p className="text-red-600 font-semibold">-{lockedStake.potentialLoss} pts</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              setLockedStake(null);
              setCalculation(null);
            }}
            className="mt-4 text-sm text-primary-600 hover:text-primary-700"
          >
            Calculate Another Stake
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-600 rounded-lg flex items-center justify-center">
          <span className="text-white text-xl">🎰</span>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Trust Score Staking</h2>
          <p className="text-sm text-gray-500">Bet on yourself for bigger deals</p>
        </div>
      </div>

      {/* Input Form */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Transaction Amount
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              value={requestedLimit}
              onChange={(e) => setRequestedLimit(Number(e.target.value))}
              min={0}
              max={1000}
              className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">Enter the transaction amount you want to authorize</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={calculateStake}
          disabled={loading}
          className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Calculating...' : 'Calculate Stake Requirements'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Calculation Results */}
      {calculation && (
        <div className="border-t border-gray-200 pt-6">
          {!calculation.eligible ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">ℹ️</span>
              </div>
              <p className="text-gray-700 font-medium mb-1">Staking Not Needed</p>
              <p className="text-sm text-gray-500">{calculation.reason}</p>
            </div>
          ) : (
            <>
              {/* Current Status */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-500 mb-2">Your Current Status</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{calculation.currentScore}</p>
                    <p className="text-xs text-gray-500">Trust Score</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-gray-900">Tier {calculation.currentTier}</p>
                    <p className="text-xs text-gray-500">${calculation.currentLimit} limit</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-primary-600">${calculation.requestedLimit}</p>
                    <p className="text-xs text-gray-500">Requested</p>
                  </div>
                </div>
              </div>

              {/* Stake Requirements */}
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-3">Stake Requirements</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-2xl font-bold text-blue-700">{calculation.requiredStake}</p>
                    <p className="text-xs text-blue-600">Points to Stake</p>
                  </div>
                  <div className="bg-gray-100 rounded-lg p-3">
                    <p className="text-2xl font-bold text-gray-700">{calculation.riskMultiplier}x</p>
                    <p className="text-xs text-gray-600">Risk Multiplier</p>
                  </div>
                </div>
              </div>

              {/* Outcomes */}
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-3">Potential Outcomes</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span className="text-sm text-green-800">Success</span>
                    </div>
                    <span className="text-green-700 font-semibold">+{calculation.potentialGain} pts</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-red-600">✕</span>
                      <span className="text-sm text-red-800">Dispute Lost</span>
                    </div>
                    <span className="text-red-700 font-semibold">-{calculation.potentialLoss} pts</span>
                  </div>
                </div>
              </div>

              {/* Risk Assessment */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-700">Risk Assessment</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(calculation.riskLevel)}`}>
                    {calculation.riskLevel.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-green-500 to-primary-500 h-2 rounded-full"
                      style={{ width: `${calculation.successProbability * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600">{Math.round(calculation.successProbability * 100)}%</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Estimated success probability based on your track record</p>
              </div>

              {/* Net Risk/Reward */}
              <div className="bg-gradient-to-r from-primary-50 to-purple-50 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Expected Value</p>
                    <p className={`text-2xl font-bold ${calculation.netRiskReward >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {calculation.netRiskReward >= 0 ? '+' : ''}{calculation.netRiskReward} pts
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {calculation.netRiskReward >= 0
                        ? '✓ Favorable risk/reward'
                        : '⚠️ High risk bet'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Lock Button */}
              <button
                onClick={lockStake}
                disabled={lockingStake}
                className="w-full px-4 py-3 bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-lg hover:from-primary-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
              >
                {lockingStake ? 'Locking Stake...' : `Lock ${calculation.requiredStake} Points & Proceed`}
              </button>
              <p className="text-xs text-center text-gray-500 mt-2">
                Stake expires in 7 days if not resolved
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
