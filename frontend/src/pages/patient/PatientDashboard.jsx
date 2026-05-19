import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, FileText, User, Crown, Plus } from 'lucide-react';
import API from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/Modal';
import Loader from '../../components/Loader';
import Badge from '../../components/Badge';
import AppointmentForm from '../../components/AppointmentForm';

const PatientDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState({ appointments: [], prescriptions: [] });
  const [loading, setLoading] = useState(true);
  const [bookOpen, setBookOpen] = useState(false);

  const load = async () => {
    try {
      const { data } = await API.get('/patients/me/profile');
      setData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <Loader text="Loading your dashboard..." />;

  const upcoming = data.appointments.filter(
    (a) => new Date(a.date) >= new Date() && a.status !== 'cancelled'
  ).slice(0, 3);

  return (
    <div>
      <div className="mb-8 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Hi, {user?.name?.split(' ')[0]}</h1>
          <p className="text-slate-500 mt-1">Your personal health dashboard</p>
        </div>
        {user?.subscriptionPlan === 'pro' && (
          <span className="flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
            <Crown className="w-4 h-4" /> Pro Member
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card flex items-center gap-3">
          <Calendar className="w-10 h-10 text-medical-600" />
          <div>
            <p className="text-sm text-slate-500">Upcoming</p>
            <p className="text-2xl font-bold">{upcoming.length}</p>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <FileText className="w-10 h-10 text-emerald-600" />
          <div>
            <p className="text-sm text-slate-500">Prescriptions</p>
            <p className="text-2xl font-bold">{data.prescriptions.length}</p>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <User className="w-10 h-10 text-purple-600" />
          <div>
            <p className="text-sm text-slate-500">Plan</p>
            <p className="text-2xl font-bold capitalize">{user?.subscriptionPlan}</p>
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Upcoming Appointments</h2>
          <button onClick={() => setBookOpen(true)} className="btn-primary text-sm flex items-center gap-1">
            <Plus className="w-4 h-4" /> Book New
          </button>
        </div>
        {upcoming.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-6">There are no upcoming appointments. Book a new one!</p>
        ) : (
          <div className="space-y-2">
            {upcoming.map((a) => (
              <div key={a._id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-800">Dr. {a.doctor?.name}</p>
                  <p className="text-xs text-slate-500">{new Date(a.date).toLocaleDateString()} • {a.timeSlot}</p>
                  {a.reason && <p className="text-xs text-slate-500 italic mt-1">"{a.reason}"</p>}
                </div>
                <Badge status={a.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Recent Prescriptions</h2>
          <Link to="/patient/prescriptions" className="text-sm text-medical-600 hover:underline">View all</Link>
        </div>
        {data.prescriptions.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-6">No prescription has been received yet.</p>
        ) : (
          <div className="space-y-2">
            {data.prescriptions.slice(0, 3).map((p) => (
              <div key={p._id} className="p-3 bg-slate-50 rounded-lg">
                <p className="font-medium text-slate-800">{p.diagnosis}</p>
                <p className="text-xs text-slate-500 mt-1">
                  Dr. {p.doctor?.name} • {new Date(p.createdAt).toLocaleDateString()} • {p.medicines?.length} medicines
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={bookOpen} onClose={() => setBookOpen(false)} title="Book Appointment" size="lg">
        <AppointmentForm onSuccess={() => { setBookOpen(false); load(); }} onCancel={() => setBookOpen(false)} />
      </Modal>
    </div>
  );
};

export default PatientDashboard;
