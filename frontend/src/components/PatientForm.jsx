import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../services/api';

const initial = {
  name: '',
  age: '',
  gender: 'male',
  contact: '',
  email: '',
  address: '',
  bloodGroup: 'unknown',
  allergies: '',
  chronicConditions: '',
};

const PatientForm = ({ patient, onSuccess, onCancel }) => {
  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (patient) {
      setData({
        ...initial,
        ...patient,
        allergies: (patient.allergies || []).join(', '),
        chronicConditions: (patient.chronicConditions || []).join(', '),
      });
    } else {
      setData(initial);
    }
  }, [patient]);

  const onChange = (e) => setData({ ...data, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...data,
        age: Number(data.age),
        allergies: data.allergies.split(',').map((s) => s.trim()).filter(Boolean),
        chronicConditions: data.chronicConditions.split(',').map((s) => s.trim()).filter(Boolean),
      };

      if (patient?._id) {
        await API.put(`/patients/${patient._id}`, payload);
        toast.success('Patient updated');
      } else {
        await API.post('/patients', payload);
        toast.success('Patient registered');
      }
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving patient');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Full Name *</label>
          <input name="name" required className="input-field" value={data.name} onChange={onChange} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Contact *</label>
          <input name="contact" required className="input-field" value={data.contact} onChange={onChange} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Age *</label>
          <input name="age" type="number" required min="0" className="input-field" value={data.age} onChange={onChange} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Gender *</label>
          <select name="gender" className="input-field" value={data.gender} onChange={onChange}>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input name="email" type="email" className="input-field" value={data.email} onChange={onChange} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Blood Group</label>
          <select name="bloodGroup" className="input-field" value={data.bloodGroup} onChange={onChange}>
            {['unknown', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Address</label>
        <input name="address" className="input-field" value={data.address} onChange={onChange} />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Allergies (comma-separated)</label>
        <input name="allergies" placeholder="penicillin, dust, pollen" className="input-field" value={data.allergies} onChange={onChange} />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Chronic Conditions (comma-separated)</label>
        <input name="chronicConditions" placeholder="diabetes, hypertension" className="input-field" value={data.chronicConditions} onChange={onChange} />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {patient ? 'Update Patient' : 'Register Patient'}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
      </div>
    </form>
  );
};

export default PatientForm;
