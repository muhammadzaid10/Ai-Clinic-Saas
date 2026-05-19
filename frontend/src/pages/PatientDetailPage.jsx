import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, FileText, Phone, Mail, MapPin, Droplet, AlertTriangle, Activity, Brain, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import Badge from '../components/Badge';

const RISK_COLORS = {
  low: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  medium: 'bg-amber-50 border-amber-200 text-amber-700',
  high: 'bg-orange-50 border-orange-200 text-orange-700',
  critical: 'bg-red-50 border-red-200 text-red-700',
};

const PatientDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [riskAnalysis, setRiskAnalysis] = useState(null);
  const [analyzingRisk, setAnalyzingRisk] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await API.get(`/patients/${id}`);
        setData(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const runRiskAnalysis = async () => {
    setAnalyzingRisk(true);
    try {
      const { data: result } = await API.get(`/ai/risk-flag/${id}`);
      if (result.success) {
        setRiskAnalysis(result.data);
        toast.success('Risk analysis complete');
      } else {
        toast.error(result.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'AI unavailable');
    } finally {
      setAnalyzingRisk(false);
    }
  };

  if (loading) return <Loader text="Loading patient profile..." />;
  if (!data) return <p>Patient not found</p>;

  const { patient, appointments, prescriptions } = data;
  const backTo = `/${user.role}/patients`;

  // Combined timeline
  const timeline = [
    ...appointments.map((a) => ({
      type: 'appointment',
      date: a.date,
      data: a,
    })),
    ...prescriptions.map((p) => ({
      type: 'prescription',
      date: p.createdAt,
      data: p,
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div>
      <Link to={backTo} className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-medical-600 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to patients
      </Link>

      {/* Profile header */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="w-20 h-20 bg-medical-100 text-medical-700 rounded-2xl flex items-center justify-center text-3xl font-bold">
            {patient.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-800">{patient.name}</h1>
            <p className="text-slate-500 mt-1">{patient.age} years • <span className="capitalize">{patient.gender}</span> • {patient.bloodGroup}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <Phone className="w-4 h-4 text-slate-400" /> {patient.contact}
              </div>
              {patient.email && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Mail className="w-4 h-4 text-slate-400" /> {patient.email}
                </div>
              )}
              {patient.address && (
                <div className="flex items-center gap-2 text-slate-600 sm:col-span-2">
                  <MapPin className="w-4 h-4 text-slate-400" /> {patient.address}
                </div>
              )}
            </div>

            {(patient.allergies?.length > 0 || patient.chronicConditions?.length > 0) && (
              <div className="mt-4 space-y-2">
                {patient.allergies?.length > 0 && (
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5" />
                    <div className="text-sm">
                      <span className="font-medium text-slate-700">Allergies:</span>{' '}
                      <span className="text-slate-600">{patient.allergies.join(', ')}</span>
                    </div>
                  </div>
                )}
                {patient.chronicConditions?.length > 0 && (
                  <div className="flex items-start gap-2">
                    <Activity className="w-4 h-4 text-red-500 mt-0.5" />
                    <div className="text-sm">
                      <span className="font-medium text-slate-700">Conditions:</span>{' '}
                      <span className="text-slate-600">{patient.chronicConditions.join(', ')}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card !p-4 flex items-center gap-3">
          <Calendar className="w-8 h-8 text-medical-600" />
          <div>
            <p className="text-sm text-slate-500">Appointments</p>
            <p className="text-xl font-bold">{appointments.length}</p>
          </div>
        </div>
        <div className="card !p-4 flex items-center gap-3">
          <FileText className="w-8 h-8 text-emerald-600" />
          <div>
            <p className="text-sm text-slate-500">Prescriptions</p>
            <p className="text-xl font-bold">{prescriptions.length}</p>
          </div>
        </div>
      </div>

      {/* AI Risk Analysis (doctor/admin only) */}
      {(user.role === 'doctor' || user.role === 'admin') && (
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600" /> AI Risk Analysis
            </h2>
            <button
              onClick={runRiskAnalysis}
              disabled={analyzingRisk}
              className="px-3 py-1.5 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
            >
              {analyzingRisk ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
              {riskAnalysis ? 'Re-analyze' : 'Run Analysis'}
            </button>
          </div>

          {!riskAnalysis && !analyzingRisk && (
            <p className="text-sm text-slate-500 text-center py-4">
              Click "Run Analysis" to detect risk patterns based on patient history.
            </p>
          )}

          {riskAnalysis && (
            <div className={`p-4 border rounded-lg ${RISK_COLORS[riskAnalysis.riskLevel]}`}>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-bold capitalize">Risk Level: {riskAnalysis.riskLevel}</span>
              </div>
              <p className="text-sm mb-3">{riskAnalysis.summary}</p>
              {riskAnalysis.flags?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold mb-1">Concerns:</p>
                  <ul className="text-sm space-y-1">
                    {riskAnalysis.flags.map((f, idx) => (
                      <li key={idx}>• {f}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Timeline */}
      <div className="card">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">📅 Medical History Timeline</h2>

        {timeline.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-8">No history found. Book your first appointment.</p>
        ) : (
          <div className="space-y-4">
            {timeline.map((item, idx) => (
              <div key={idx} className="flex gap-4 pb-4 border-b border-slate-100 last:border-0">
                <div className="flex-shrink-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    item.type === 'appointment' ? 'bg-medical-100 text-medical-600' : 'bg-emerald-100 text-emerald-600'
                  }`}>
                    {item.type === 'appointment' ? <Calendar className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <p className="font-medium text-slate-800 capitalize">{item.type}</p>
                    {item.type === 'appointment' && <Badge status={item.data.status} />}
                    <span className="text-xs text-slate-500">
                      {new Date(item.date).toLocaleString()}
                    </span>
                  </div>
                  {item.type === 'appointment' ? (
                    <div className="text-sm text-slate-600">
                      <p>Dr. {item.data.doctor?.name} • {item.data.timeSlot}</p>
                      {item.data.reason && <p className="text-xs italic mt-1">Reason: {item.data.reason}</p>}
                    </div>
                  ) : (
                    <div className="text-sm text-slate-600">
                      <p>Dr. {item.data.doctor?.name} • <strong>{item.data.diagnosis}</strong></p>
                      <p className="text-xs mt-1">{item.data.medicines?.length || 0} medicines prescribed</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientDetailPage;
