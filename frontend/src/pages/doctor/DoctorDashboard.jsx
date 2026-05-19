import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, FileText, Clock, CheckCircle, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import API from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Loader from '../../components/Loader';
import Badge from '../../components/Badge';

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const [analyticsRes, todayRes] = await Promise.all([
          API.get('/analytics/doctor'),
          API.get('/appointments', { params: { date: todayStr } }),
        ]);
        setAnalytics(analyticsRes.data);
        setTodayAppointments(todayRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <Loader text="Loading..." />;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">
          Welcome, Dr. {user?.name?.split(' ').slice(-1)[0] || user?.name}
        </h1>
        <p className="text-slate-500 mt-1">{user?.specialization || 'Doctor'} • Your performance overview</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card flex items-center gap-3">
          <Calendar className="w-10 h-10 text-medical-600" />
          <div>
            <p className="text-sm text-slate-500">Today</p>
            <p className="text-2xl font-bold">{analytics?.stats.todayCount || 0}</p>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <Clock className="w-10 h-10 text-amber-600" />
          <div>
            <p className="text-sm text-slate-500">Pending</p>
            <p className="text-2xl font-bold">{analytics?.stats.pending || 0}</p>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <CheckCircle className="w-10 h-10 text-emerald-600" />
          <div>
            <p className="text-sm text-slate-500">Completed</p>
            <p className="text-2xl font-bold">{analytics?.stats.completed || 0}</p>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <FileText className="w-10 h-10 text-purple-600" />
          <div>
            <p className="text-sm text-slate-500">Prescriptions</p>
            <p className="text-2xl font-bold">{analytics?.stats.totalPrescriptions || 0}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Trend */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">This Week's Appointments</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={analytics?.weeklyTrend || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="appointments" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Diagnoses */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Your Top Diagnoses</h2>
          {analytics?.topDiagnoses?.length > 0 ? (
            <div className="space-y-2">
              {analytics.topDiagnoses.map((d, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded">
                  <span className="text-sm text-slate-700">{d.diagnosis}</span>
                  <span className="px-2 py-0.5 bg-medical-100 text-medical-700 text-xs font-medium rounded-full">
                    {d.count}x
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 text-center py-8">No prescriptions yet</p>
          )}
        </div>
      </div>

      <div className="card mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Today's Schedule</h2>
          <Link to="/doctor/appointments" className="text-sm text-medical-600 hover:underline flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {todayAppointments.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-6">Aaj koi appointment nahi hai</p>
        ) : (
          <div className="space-y-2">
            {todayAppointments.map((a) => (
              <div key={a._id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-800">{a.patient?.name}</p>
                  <p className="text-xs text-slate-500">{a.timeSlot} • {a.reason || 'General consultation'}</p>
                </div>
                <Badge status={a.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard;
