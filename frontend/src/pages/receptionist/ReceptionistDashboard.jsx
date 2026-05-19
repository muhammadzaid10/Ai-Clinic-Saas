import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, Calendar, Users, ArrowRight } from 'lucide-react';
import API from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Loader from '../../components/Loader';
import Badge from '../../components/Badge';

const ReceptionistDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ totalPatients: 0, todayAppointments: 0 });
  const [today, setToday] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const [patientsRes, todayRes] = await Promise.all([
          API.get('/patients?limit=1'),
          API.get('/appointments', { params: { date: todayStr } }),
        ]);
        setStats({ totalPatients: patientsRes.data.total, todayAppointments: todayRes.data.length });
        setToday(todayRes.data);
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
        <h1 className="text-3xl font-bold text-slate-800">Hello, {user?.name}</h1>
        <p className="text-slate-500 mt-1">Manage patient registrations and appointments</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Link to="/receptionist/patients" className="card flex items-center gap-3 hover:shadow-md transition-shadow">
          <Users className="w-10 h-10 text-emerald-600" />
          <div className="flex-1">
            <p className="text-sm text-slate-500">Total Patients</p>
            <p className="text-2xl font-bold">{stats.totalPatients}</p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400" />
        </Link>
        <Link to="/receptionist/appointments" className="card flex items-center gap-3 hover:shadow-md transition-shadow">
          <Calendar className="w-10 h-10 text-amber-600" />
          <div className="flex-1">
            <p className="text-sm text-slate-500">Today's Appointments</p>
            <p className="text-2xl font-bold">{stats.todayAppointments}</p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400" />
        </Link>
      </div>

      <div className="card mb-4">
        <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link to="/receptionist/patients" className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg hover:border-medical-400 hover:bg-medical-50 transition">
            <UserPlus className="w-6 h-6 text-medical-600" />
            <div>
              <p className="font-medium text-slate-800">Register New Patient</p>
              <p className="text-xs text-slate-500">Add walk-in patients to system</p>
            </div>
          </Link>
          <Link to="/receptionist/appointments" className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg hover:border-medical-400 hover:bg-medical-50 transition">
            <Calendar className="w-6 h-6 text-medical-600" />
            <div>
              <p className="font-medium text-slate-800">Book Appointment</p>
              <p className="text-xs text-slate-500">Schedule patient visits</p>
            </div>
          </Link>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Today's Appointments</h2>
        {today.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-6">No appointments scheduled for today</p>
        ) : (
          <div className="space-y-2">
            {today.map((a) => (
              <div key={a._id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-800">{a.patient?.name}</p>
                  <p className="text-xs text-slate-500">Dr. {a.doctor?.name} • {a.timeSlot}</p>
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

export default ReceptionistDashboard;
