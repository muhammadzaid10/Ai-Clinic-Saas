import { useState, useEffect } from 'react';
import { Plus, Calendar, Clock, User as UserIcon, Check, X, CalendarOff, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import Badge from '../components/Badge';
import AppointmentForm from '../components/AppointmentForm';
import PrescriptionForm from '../components/PrescriptionForm';

const AppointmentsPage = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [rxModalState, setRxModalState] = useState({ open: false, appointment: null });

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (dateFilter) params.date = dateFilter;
      const { data } = await API.get('/appointments', { params });
      setAppointments(data);
    } catch (err) {
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
    // eslint-disable-next-line
  }, [statusFilter, dateFilter]);

  const handleStatusChange = async (id, status) => {
    try {
      await API.put(`/appointments/${id}`, { status });
      toast.success(`Marked as ${status}`);
      fetchAppointments();
    } catch (err) {
      toast.error('Update failed');
    }
  };

  const handleCancel = async (id) => {
    if (!confirm('Cancel this appointment?')) return;
    try {
      await API.delete(`/appointments/${id}`);
      toast.success('Cancelled');
      fetchAppointments();
    } catch (err) {
      toast.error('Cancel failed');
    }
  };

  const openPrescription = (appointment) => {
    setRxModalState({ open: true, appointment });
  };

  const canBook = ['admin', 'receptionist', 'doctor', 'patient'].includes(user.role);
  const canManage = ['admin', 'receptionist', 'doctor'].includes(user.role);
  const canPrescribe = user.role === 'doctor';

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Appointments</h1>
          <p className="text-slate-500 text-sm">
            {user.role === 'doctor' && 'Your scheduled appointments'}
            {user.role === 'patient' && 'Your booked appointments'}
            {(user.role === 'admin' || user.role === 'receptionist') && 'All clinic appointments'}
          </p>
        </div>
        {canBook && (
          <button onClick={() => setBookModalOpen(true)} className="btn-primary flex items-center gap-2 self-start">
            <Plus className="w-4 h-4" /> Book Appointment
          </button>
        )}
      </div>

      <div className="card !p-3 mb-4 flex flex-col sm:flex-row gap-2">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field sm:w-48">
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="input-field sm:w-48" />
        {(statusFilter || dateFilter) && (
          <button onClick={() => { setStatusFilter(''); setDateFilter(''); }} className="btn-secondary text-sm">
            Clear filters
          </button>
        )}
      </div>

      {loading ? (
        <Loader />
      ) : appointments.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={CalendarOff}
            title="No appointments found"
            description={canBook ? 'Pehli appointment book karne ke liye upar button click karo.' : ''}
          />
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((a) => (
            <div key={a._id} className="card !p-4 hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="w-12 h-12 bg-medical-100 text-medical-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-6 h-6" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <p className="font-semibold text-slate-800">{a.patient?.name || 'Unknown'}</p>
                    <Badge status={a.status} />
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                    <span className="flex items-center gap-1"><UserIcon className="w-3.5 h-3.5" /> Dr. {a.doctor?.name}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(a.date).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {a.timeSlot}</span>
                  </div>
                  {a.reason && <p className="text-xs text-slate-500 mt-1 italic">"{a.reason}"</p>}
                </div>

                <div className="flex flex-wrap gap-2">
                  {canPrescribe && (a.status === 'confirmed' || a.status === 'pending') && (
                    <button
                      onClick={() => openPrescription(a)}
                      className="px-3 py-1.5 text-xs bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 flex items-center gap-1"
                    >
                      <FileText className="w-3 h-3" /> Prescribe
                    </button>
                  )}
                  {canManage && a.status === 'pending' && (
                    <button onClick={() => handleStatusChange(a._id, 'confirmed')} className="px-3 py-1.5 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Confirm
                    </button>
                  )}
                  {canManage && (a.status === 'confirmed' || a.status === 'pending') && (
                    <button onClick={() => handleStatusChange(a._id, 'completed')} className="px-3 py-1.5 text-xs bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Complete
                    </button>
                  )}
                  {(a.status === 'pending' || a.status === 'confirmed') && (
                    <button onClick={() => handleCancel(a._id)} className="px-3 py-1.5 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200 flex items-center gap-1">
                      <X className="w-3 h-3" /> Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={bookModalOpen} onClose={() => setBookModalOpen(false)} title="Book New Appointment" size="lg">
        <AppointmentForm onSuccess={() => { setBookModalOpen(false); fetchAppointments(); }} onCancel={() => setBookModalOpen(false)} />
      </Modal>

      <Modal
        isOpen={rxModalState.open}
        onClose={() => setRxModalState({ open: false, appointment: null })}
        title={`Write Prescription • ${rxModalState.appointment?.patient?.name || ''}`}
        size="xl"
      >
        {rxModalState.appointment && (
          <PrescriptionForm
            patient={rxModalState.appointment.patient}
            appointment={rxModalState.appointment}
            onSuccess={() => {
              setRxModalState({ open: false, appointment: null });
              fetchAppointments();
              toast.success('Appointment marked as completed automatically');
            }}
            onCancel={() => setRxModalState({ open: false, appointment: null })}
          />
        )}
      </Modal>
    </div>
  );
};

export default AppointmentsPage;
