'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Forbidden clause definitions with descriptions
const FORBIDDEN_CLAUSES = [
  {
    id: 'BINDING_ARBITRATION',
    name: 'Binding Arbitration',
    description: 'Block agreements requiring mandatory binding arbitration',
    severity: 'high',
  },
  {
    id: 'CHARGEBACK_WAIVER',
    name: 'Chargeback Waiver',
    description: 'Block agreements that waive your chargeback rights',
    severity: 'high',
  },
  {
    id: 'CLASS_ACTION_WAIVER',
    name: 'Class Action Waiver',
    description: 'Block agreements waiving class action rights',
    severity: 'medium',
  },
  {
    id: 'AUTO_RENEWAL_HIDDEN',
    name: 'Hidden Auto-Renewal',
    description: 'Warn about auto-renewal without clear cancellation notice',
    severity: 'medium',
  },
  {
    id: 'NON_REFUNDABLE',
    name: 'Non-Refundable',
    description: 'Block completely non-refundable agreements',
    severity: 'medium',
  },
  {
    id: 'FOREIGN_JURISDICTION',
    name: 'Foreign Jurisdiction',
    description: 'Warn about agreements requiring foreign jurisdiction',
    severity: 'low',
  },
  {
    id: 'BROAD_INDEMNIFICATION',
    name: 'Broad Indemnification',
    description: 'Warn about broad indemnification clauses',
    severity: 'low',
  },
  {
    id: 'DATA_RESALE',
    name: 'Data Resale',
    description: 'Block agreements allowing data resale to third parties',
    severity: 'high',
  },
  {
    id: 'AI_TRAINING_OPT_IN',
    name: 'AI Training Opt-In',
    description: 'Warn about data being used for AI training',
    severity: 'low',
  },
];

// Agreement categories
const CATEGORIES = [
  { id: 'retail', name: 'Retail', icon: '🛒' },
  { id: 'travel', name: 'Travel', icon: '✈️' },
  { id: 'hospitality', name: 'Hospitality', icon: '🏨' },
  { id: 'software', name: 'Software', icon: '💻' },
  { id: 'subscription', name: 'Subscription', icon: '📦' },
  { id: 'api_access', name: 'API Access', icon: '🔌' },
  { id: 'entertainment', name: 'Entertainment', icon: '🎬' },
  { id: 'cloud_services', name: 'Cloud Services', icon: '☁️' },
  { id: 'financial', name: 'Financial', icon: '🏦' },
  { id: 'healthcare', name: 'Healthcare', icon: '🏥' },
  { id: 'insurance', name: 'Insurance', icon: '🛡️' },
  { id: 'legal', name: 'Legal', icon: '⚖️' },
];

interface PolicySettings {
  forbiddenClauses: string[];
  maxSpendPerTx: number;
  maxSpendPerDay: number | null;
  maxSpendPerMonth: number | null;
  minRefundWindowHours: number;
  requireChargebackRights: boolean;
  blockedCategories: string[];
  requireApprovalFor: string[];
  blockedMerchants: string[];
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<PolicySettings>({
    forbiddenClauses: ['CHARGEBACK_WAIVER', 'DATA_RESALE'],
    maxSpendPerTx: 100,
    maxSpendPerDay: 500,
    maxSpendPerMonth: 2000,
    minRefundWindowHours: 24,
    requireChargebackRights: true,
    blockedCategories: [],
    requireApprovalFor: ['financial', 'healthcare', 'insurance', 'legal'],
    blockedMerchants: [],
  });
  const [newMerchant, setNewMerchant] = useState('');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load settings from API
    fetch('/api/policies')
      .then((res) => res.json())
      .then((data) => {
        if (data.policy) {
          // Merge with defaults to ensure all arrays exist
          setSettings((prev) => ({
            ...prev,
            ...data.policy,
            // Ensure arrays are never undefined
            forbiddenClauses: data.policy.forbiddenClauses || prev.forbiddenClauses,
            blockedCategories: data.policy.blockedCategories || prev.blockedCategories,
            requireApprovalFor: data.policy.requireApprovalFor || prev.requireApprovalFor,
            blockedMerchants: data.policy.blockedMerchants || prev.blockedMerchants,
          }));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const toggleForbiddenClause = (clauseId: string) => {
    setSettings((prev) => {
      const clauses = prev.forbiddenClauses || [];
      return {
        ...prev,
        forbiddenClauses: clauses.includes(clauseId)
          ? clauses.filter((c) => c !== clauseId)
          : [...clauses, clauseId],
      };
    });
  };

  const setCategoryStatus = (categoryId: string, status: 'allow' | 'block' | 'require_approval') => {
    setSettings((prev) => {
      const newSettings = { ...prev };

      // Ensure arrays exist
      newSettings.blockedCategories = newSettings.blockedCategories || [];
      newSettings.requireApprovalFor = newSettings.requireApprovalFor || [];

      // Remove from all lists first
      newSettings.blockedCategories = newSettings.blockedCategories.filter((c) => c !== categoryId);
      newSettings.requireApprovalFor = newSettings.requireApprovalFor.filter((c) => c !== categoryId);

      // Add to appropriate list
      if (status === 'block') {
        newSettings.blockedCategories.push(categoryId);
      } else if (status === 'require_approval') {
        newSettings.requireApprovalFor.push(categoryId);
      }

      return newSettings;
    });
  };

  const getCategoryStatus = (categoryId: string): 'allow' | 'block' | 'require_approval' => {
    if (settings.blockedCategories?.includes(categoryId)) return 'block';
    if (settings.requireApprovalFor?.includes(categoryId)) return 'require_approval';
    return 'allow';
  };

  const addMerchant = () => {
    const merchants = settings.blockedMerchants || [];
    if (newMerchant && !merchants.includes(newMerchant)) {
      setSettings((prev) => ({
        ...prev,
        blockedMerchants: [...(prev.blockedMerchants || []), newMerchant],
      }));
      setNewMerchant('');
    }
  };

  const removeMerchant = (merchant: string) => {
    setSettings((prev) => ({
      ...prev,
      blockedMerchants: (prev.blockedMerchants || []).filter((m) => m !== merchant),
    }));
  };

  const saveSettings = async () => {
    try {
      await fetch('/api/policies', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/dashboard" className="hover:text-primary-600">Dashboard</Link>
          <span>/</span>
          <span>Settings</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Policy Settings</h1>
            <p className="text-gray-600 mt-1">
              Configure what your agent can and cannot accept on your behalf.
            </p>
          </div>
          <button
            onClick={saveSettings}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              saved
                ? 'bg-green-600 text-white'
                : 'bg-primary-600 text-white hover:bg-primary-700'
            }`}
          >
            {saved ? '✓ Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Spending Limits */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Spending Limits</h2>
        <p className="text-sm text-gray-600 mb-4">
          Set maximum amounts your agent can commit to without explicit approval.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max per Transaction
            </label>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">$</span>
              <input
                type="number"
                value={settings.maxSpendPerTx}
                onChange={(e) => setSettings({ ...settings, maxSpendPerTx: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <input
              type="range"
              min="10"
              max="1000"
              step="10"
              value={settings.maxSpendPerTx}
              onChange={(e) => setSettings({ ...settings, maxSpendPerTx: parseInt(e.target.value) })}
              className="w-full mt-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max per Day (optional)
            </label>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">$</span>
              <input
                type="number"
                value={settings.maxSpendPerDay || ''}
                placeholder="No limit"
                onChange={(e) => setSettings({ ...settings, maxSpendPerDay: e.target.value ? parseInt(e.target.value) : null })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max per Month (optional)
            </label>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">$</span>
              <input
                type="number"
                value={settings.maxSpendPerMonth || ''}
                placeholder="No limit"
                onChange={(e) => setSettings({ ...settings, maxSpendPerMonth: e.target.value ? parseInt(e.target.value) : null })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-primary-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              id="chargebackRights"
              checked={settings.requireChargebackRights}
              onChange={(e) => setSettings({ ...settings, requireChargebackRights: e.target.checked })}
              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
            />
            <label htmlFor="chargebackRights" className="text-sm font-medium text-primary-900">
              Always require chargeback rights
            </label>
          </div>
          <p className="text-xs text-primary-700 ml-6">
            Block any agreement that waives your ability to dispute charges with your bank.
          </p>
        </div>
      </div>

      {/* Forbidden Clauses */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Forbidden Clauses</h2>
        <p className="text-sm text-gray-600 mb-4">
          Automatically block or warn about agreements containing these terms.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {FORBIDDEN_CLAUSES.map((clause) => (
            <div
              key={clause.id}
              className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                (settings.forbiddenClauses || []).includes(clause.id)
                  ? 'border-primary-300 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => toggleForbiddenClause(clause.id)}
            >
              <div className="flex items-start gap-3">
                <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  (settings.forbiddenClauses || []).includes(clause.id)
                    ? 'bg-primary-600 border-primary-600'
                    : 'border-gray-300'
                }`}>
                  {(settings.forbiddenClauses || []).includes(clause.id) && (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{clause.name}</span>
                    <span className={`px-1.5 py-0.5 text-xs rounded ${
                      clause.severity === 'high'
                        ? 'bg-red-100 text-red-700'
                        : clause.severity === 'medium'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-600'
                    }`}>
                      {clause.severity}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{clause.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category Controls */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Category Controls</h2>
        <p className="text-sm text-gray-600 mb-4">
          Control which types of agreements your agent can accept automatically.
        </p>

        <div className="space-y-2">
          {CATEGORIES.map((category) => {
            const status = getCategoryStatus(category.id);
            return (
              <div
                key={category.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{category.icon}</span>
                  <span className="font-medium text-gray-900">{category.name}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCategoryStatus(category.id, 'allow')}
                    className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                      status === 'allow'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    Auto
                  </button>
                  <button
                    onClick={() => setCategoryStatus(category.id, 'require_approval')}
                    className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                      status === 'require_approval'
                        ? 'bg-yellow-500 text-white'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    Approval
                  </button>
                  <button
                    onClick={() => setCategoryStatus(category.id, 'block')}
                    className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                      status === 'block'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    Block
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 p-3 bg-gray-100 rounded-lg text-sm text-gray-600">
          <strong>Auto:</strong> Agent can accept without asking &nbsp;|&nbsp;
          <strong>Approval:</strong> Agent must ask you first &nbsp;|&nbsp;
          <strong>Block:</strong> Agent cannot accept these
        </div>
      </div>

      {/* Merchant Blocklist */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Blocked Merchants</h2>
        <p className="text-sm text-gray-600 mb-4">
          Block specific merchants from any agreements.
        </p>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newMerchant}
            onChange={(e) => setNewMerchant(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addMerchant()}
            placeholder="merchant.com"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          <button
            onClick={addMerchant}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
          >
            Add
          </button>
        </div>

        {(settings.blockedMerchants || []).length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {(settings.blockedMerchants || []).map((merchant) => (
              <span
                key={merchant}
                className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm"
              >
                {merchant}
                <button
                  onClick={() => removeMerchant(merchant)}
                  className="hover:text-red-900"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic">No merchants blocked</p>
        )}
      </div>

      {/* Minimum Refund Window */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Refund Protection</h2>
        <p className="text-sm text-gray-600 mb-4">
          Require a minimum refund window for agreements.
        </p>

        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">
            Minimum refund window:
          </label>
          <select
            value={settings.minRefundWindowHours}
            onChange={(e) => setSettings({ ...settings, minRefundWindowHours: parseInt(e.target.value) })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value={0}>No minimum</option>
            <option value={24}>24 hours (1 day)</option>
            <option value={72}>72 hours (3 days)</option>
            <option value={168}>168 hours (7 days)</option>
            <option value={336}>336 hours (14 days)</option>
            <option value={720}>720 hours (30 days)</option>
          </select>
        </div>
      </div>

      {/* Save Button (bottom) */}
      <div className="mt-8 flex justify-end">
        <button
          onClick={saveSettings}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            saved
              ? 'bg-green-600 text-white'
              : 'bg-primary-600 text-white hover:bg-primary-700'
          }`}
        >
          {saved ? '✓ Changes Saved!' : 'Save All Changes'}
        </button>
      </div>
    </div>
  );
}
