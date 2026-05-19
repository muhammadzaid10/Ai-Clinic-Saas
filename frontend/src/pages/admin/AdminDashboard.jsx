import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, UserCheck, Calendar, Activity, ArrowRight } from 'lucide-react';
import API from '../../services/api';
import Loader from '../../components/Loader';
import Badge from '../../components/Badge';

const StatCard = ({ icon: Icon, label, value, color, to }) => {
  const inner = (
    <div className="card flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="flex-1">
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
      </div>
      {to && <ArrowRight className="w-4 h-4 text-slate-400" />}
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
};

const AdminDashboard = () => {
  const [stats, setStats] = useState({ patients: 0, doctors: 0, receptionists: 0, appointments: 0 });
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [patientsRes, staffRes, appointmentsRes] = await Promise.all([
          API.get('/patients?limit=1'),
          API.get('/staff'),
          API.get('/appointments'),
        ]);

        setStats({
          patients: patientsRes.data.total,
          doctors: staffRes.data.filter((s) => s.role === 'doctor').length,
          receptionists: staffRes.data.filter((s) => s.role === 'receptionist').length,
          appointments: appointmentsRes.data.length,
        });
        setRecent(appointmentsRes.data.slice(0, 5));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <Loader text="Loading dashboard..." />;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Admin Dashboard</h1>
        <p className="text-slate-500 mt-1">Overview of your clinic operations</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users} label="Total Patients" value={stats.patients} color="bg-medical-500" to="/admin/patients" />
        <StatCard icon={UserCheck} label="Doctors" value={stats.doctors} color="bg-emerald-500" to="/admin/staff" />
        <StatCard icon={Activity} label="Receptionists" value={stats.receptionists} color="bg-amber-500" to="/admin/staff" />
        <StatCard icon={Calendar} label="Appointments" value={stats.appointments} color="bg-purple-500" to="/admin/appointments" />
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800">Recent Appointments</h2>
          <Link to="/admin/appointments" className="text-sm text-medical-600 hover:underline">View all</Link>
        </div>
        {recent.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-6">No appointments yet</p>
        ) : (
          <div className="space-y-2">
            {recent.map((a) => (
              <div key={a._id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-800">{a.patient?.name}</p>
                  <p className="text-xs text-slate-500">Dr. {a.doctor?.name} • {new Date(a.date).toLocaleDateString()} • {a.timeSlot}</p>
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

export default AdminDashboard;
