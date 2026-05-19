import { useState, useEffect } from 'react';
import { Brain, Loader2, AlertTriangle, FlaskConical, Lightbulb, Crown } from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Badge from '../../components/Badge';

const RISK_COLORS = {
  low: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  critical: 'bg-red-100 text-red-700 border-red-200',
};

const AIAssistantPage = () => {
  const { user } = useAuth();
  const [form, setForm] = useState({
    patientId: '',
    symptoms: '',
    age: '',
    gender: 'male',
    history: '',
  });
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [logs, setLogs] = useState([]);

  const isPro = user.subscriptionPlan === 'pro';

  useEffect(() => {
    if (!isPro) return;
    API.get('/patients?limit=200').then(({ data }) => setPatients(data.patients)).catch(() => {});
    API.get('/ai/logs').then(({ data }) => setLogs(data)).catch(() => {});
  }, [isPro]);

  // Pre-fill age/gender when patient selected
  useEffect(() => {
    if (form.patientId) {
      const p = patients.find((p) => p._id === form.patientId);
      if (p) setForm((f) => ({ ...f, age: p.age, gender: p.gender }));
    }
  }, [form.patientId, patients]);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.symptoms.trim()) return toast.error('Symptoms zaruri hain');

    setLoading(true);
    setResult(null);
    try {
      const payload = {
        symptoms: form.symptoms.split(',').map((s) => s.trim()).filter(Boolean),
        age: form.age ? Number(form.age) : undefined,
        gender: form.gender,
        history: form.history,
        patientId: form.patientId || undefined,
      };
      const { data } = await API.post('/ai/symptom-check', payload);
      setResult(data);

      if (data.success) {
        toast.success('AI analysis complete');
        // Refresh logs
        const logsRes = await API.get('/ai/logs');
        setLogs(logsRes.data);
      } else {
        toast.error(data.message || 'AI unavailable - using fallback');
      }
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.upgradeRequired) {
        toast.error('Pro plan required for AI features');
      } else {
        toast.error(err.response?.data?.message || 'AI request failed');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isPro) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Brain className="w-7 h-7 text-purple-600" /> AI Assistant
          </h1>
        </div>
        <div className="card text-center py-12">
          <Crown className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Pro Plan Required</h2>
          <p className="text-slate-600 max-w-md mx-auto">
          AI Symptom Checker, Risk Flagging, and Predictive Analytics are only available in the Pro plan. Please contact the admin to upgrade your subscription.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Brain className="w-7 h-7 text-purple-600" /> AI Symptom Checker
        </h1>
        <p className="text-slate-500 text-sm">Powered by Gemini AI • This tool only provides preliminary suggestions; the final diagnosis is yours.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Patient Symptoms</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Select Patient (optional)</label>
              <select name="patientId" className="input-field" value={form.patientId} onChange={onChange}>
                <option value="">Quick check (no patient link)</option>
                {patients.map((p) => (
                  <option key={p._id} value={p._id}>{p.name} • {p.age} yrs</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Age</label>
                <input type="number" name="age" min="0" className="input-field" value={form.age} onChange={onChange} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Gender</label>
                <select name="gender" className="input-field" value={form.gender} onChange={onChange}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Symptoms (comma-separated) *</label>
              <textarea
                name="symptoms"
                rows="3"
                required
                className="input-field"
                placeholder="e.g. fever, cough, sore throat, body ache"
                value={form.symptoms}
                onChange={onChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Medical History (optional)</label>
              <textarea
                name="history"
                rows="2"
                className="input-field"
                placeholder="e.g. diabetic, takes blood pressure medication"
                value={form.history}
                onChange={onChange}
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
              {loading ? 'Analyzing...' : 'Analyze with AI'}
            </button>
          </form>
        </div>

        {/* Result */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">AI Analysis</h2>

          {!result && !loading && (
            <div className="text-center py-12 text-slate-400">
              <Brain className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Enter symptoms to analyze</p>
            </div>
          )}

          {loading && (
            <div className="text-center py-12">
              <Loader2 className="w-10 h-10 mx-auto text-purple-600 animate-spin mb-2" />
              <p className="text-sm text-slate-500">AI thinking...</p>
            </div>
          )}

          {result && !result.success && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="font-medium text-amber-800">AI Unavailable</p>
              <p className="text-sm text-amber-700 mt-1">{result.message}</p>
              <p className="text-xs text-slate-600 mt-2">
               System is running normally. You can manually enter the diagnosis and prescription.
              </p>
            </div>
          )}

          {result?.success && (
            <div className="space-y-4">
              {/* Risk Level */}
              <div className={`p-3 border rounded-lg ${RISK_COLORS[result.data.riskLevel]}`}>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-semibold capitalize">Risk Level: {result.data.riskLevel}</span>
                </div>
              </div>

              {/* Possible Conditions */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1">
                  <Lightbulb className="w-4 h-4 text-amber-500" /> Possible Conditions
                </h3>
                <div className="flex flex-wrap gap-2">
                  {result.data.possibleConditions.map((c, idx) => (
                    <span key={idx} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              {/* Suggested Tests */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1">
                  <FlaskConical className="w-4 h-4 text-medical-600" /> Suggested Tests
                </h3>
                <ul className="space-y-1">
                  {result.data.suggestedTests.map((t, idx) => (
                    <li key={idx} className="text-sm text-slate-600 pl-2 border-l-2 border-medical-200">• {t}</li>
                  ))}
                </ul>
              </div>

              {/* Recommendations */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs font-semibold text-blue-700 mb-1">AI Recommendations</p>
                <p className="text-sm text-slate-700">{result.data.recommendations}</p>
              </div>

              <p className="text-xs text-slate-400 italic">
                ⚠️ This is AI suggestions — the final diagnosis will be based on your clinical judgment.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Logs */}
      {logs.length > 0 && (
        <div className="card mt-6">
          <h2 className="text-lg font-semibold mb-4">Recent AI Queries</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {logs.map((log) => (
              <div key={log._id} className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50">
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800">
                      {log.patient?.name || 'Quick check'} • {log.symptoms.join(', ')}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {log.aiResponse?.possibleConditions?.slice(0, 3).join(', ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge status={log.riskLevel}>{log.riskLevel}</Badge>
                    <span className="text-xs text-slate-400">
                      {new Date(log.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAssistantPage;
