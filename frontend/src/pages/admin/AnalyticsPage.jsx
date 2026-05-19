import { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { TrendingUp, Users, Calendar, FileText, DollarSign, Activity } from 'lucide-react';
import API from '../../services/api';
import Loader from '../../components/Loader';

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="card flex items-center gap-3">
    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
    </div>
  </div>
);

const AnalyticsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/analytics/admin')
      .then(({ data }) => setData(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader text="Loading analytics..." />;
  if (!data) return <p>Failed to load analytics</p>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Analytics Dashboard</h1>
        <p className="text-slate-500 text-sm">Clinic performance overview aur insights</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Users} label="Total Patients" value={data.stats.totalPatients} color="bg-medical-500" />
        <StatCard icon={Calendar} label="Appointments" value={data.stats.totalAppointments} color="bg-amber-500" />
        <StatCard icon={FileText} label="Prescriptions" value={data.stats.totalPrescriptions} color="bg-emerald-500" />
        <StatCard icon={DollarSign} label="Revenue (sim)" value={`$${data.stats.simulatedRevenue}`} color="bg-purple-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Monthly Appointments */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-medical-600" /> Monthly Appointments
          </h2>
          {data.monthlyAppointments.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={data.monthlyAppointments}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="appointments" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Appointment Status */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-600" /> Appointment Status
          </h2>
          {data.statusDistribution.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={data.statusDistribution}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(e) => `${e.status}: ${e.count}`}
                >
                  {data.statusDistribution.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Diagnoses */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Most Common Diagnoses</h2>
          {data.topDiagnoses.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">No prescriptions yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.topDiagnoses} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" stroke="#64748b" fontSize={12} allowDecimals={false} />
                <YAxis dataKey="diagnosis" type="category" stroke="#64748b" fontSize={11} width={100} />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Doctor Performance */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Top Performing Doctors</h2>
          {data.doctorPerformance.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">No completed appointments yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.doctorPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="appointments" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
