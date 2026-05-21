import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';

const TIME_SLOTS = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
  '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
  '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM',
];

const AppointmentForm = ({ onSuccess, onCancel, defaultPatient }) => {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);

  const [data, setData] = useState({
    patient: defaultPatient || '',
    doctor: '',
    date: new Date().toISOString().split('T')[0],
    timeSlot: '10:00 AM',
    reason: '',
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [doctorsRes] = await Promise.all([API.get('/staff/doctors')]);
        setDoctors(doctorsRes.data);

        if (['admin', 'receptionist', 'doctor'].includes(user.role)) {
          const patientsRes = await API.get('/patients?limit=200');
          setPatients(patientsRes.data.patients || []);
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadData();
  }, [user.role]);

  const onChange = (e) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };

  // English Error Messages
  const getErrorMessage = (err) => {
    const msg = err.response?.data?.message?.toLowerCase() || '';

    if (msg.includes('already booked') || 
        msg.includes('slot booked') || 
        msg.includes('conflict') || 
        msg.includes('time slot') ||
        err.response?.status === 409) {
      return "This time slot is already booked. Please choose another time slot.";
    }

    if (msg.includes('patient')) {
      return "Please select a patient.";
    }

    if (msg.includes('doctor')) {
      return "Please select a doctor.";
    }

    if (msg.includes('date') || msg.includes('time')) {
      return "Please check date and time slot.";
    }

    return err.response?.data?.message || 'Failed to book appointment. Please try again.';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = { ...data };
      if (user.role === 'patient') delete payload.patient;

      await API.post('/appointments', payload);
      
      toast.success('Appointment booked successfully!');
      onSuccess();
    } catch (err) {
      const errorMsg = getErrorMessage(err);
      toast.error(errorMsg);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {user.role !== 'patient' && (
        <div>
          <label className="block text-sm font-medium mb-1">Patient *</label>
          <select 
            name="patient" 
            required 
            className="input-field" 
            value={data.patient} 
            onChange={onChange}
          >
            <option value="">Select patient...</option>
            {patients.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name} • {p.contact}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">Doctor *</label>
        <select 
          name="doctor" 
          required 
          className="input-field" 
          value={data.doctor} 
          onChange={onChange}
        >
          <option value="">Select doctor...</option>
          {doctors.map((d) => (
            <option key={d._id} value={d._id}>
              Dr. {d.name} {d.specialization ? `• ${d.specialization}` : ''}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Date *</label>
          <input 
            name="date" 
            type="date" 
            required 
            min={new Date().toISOString().split('T')[0]} 
            className="input-field" 
            value={data.date} 
            onChange={onChange} 
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Time Slot *</label>
          <select 
            name="timeSlot" 
            required 
            className="input-field" 
            value={data.timeSlot} 
            onChange={onChange}
          >
            {TIME_SLOTS.map((slot) => (
              <option key={slot} value={slot}>{slot}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Reason / Notes</label>
        <textarea 
          name="reason" 
          rows="3" 
          className="input-field" 
          placeholder="Symptoms or reason for visit..." 
          value={data.reason} 
          onChange={onChange} 
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button 
          type="submit" 
          disabled={loading} 
          className="btn-primary flex items-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Book Appointment
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
};

export default AppointmentForm;