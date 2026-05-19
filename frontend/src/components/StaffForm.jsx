import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../services/api';

const StaffForm = ({ onSuccess, onCancel }) => {
  const [data, setData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'doctor',
    phone: '',
    specialization: '',
  });
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setData({ ...data, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/auth/create-staff', data);
      toast.success(`${data.role} created successfully`);
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create staff');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-sm font-medium mb-1">Role *</label>
        <select name="role" className="input-field" value={data.role} onChange={onChange}>
          <option value="doctor">Doctor</option>
          <option value="receptionist">Receptionist</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Full Name *</label>
          <input name="name" required className="input-field" value={data.name} onChange={onChange} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Phone</label>
          <input name="phone" className="input-field" value={data.phone} onChange={onChange} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Email *</label>
        <input name="email" type="email" required className="input-field" value={data.email} onChange={onChange} />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Password * (min 6 chars)</label>
        <input name="password" type="password" required minLength={6} className="input-field" value={data.password} onChange={onChange} />
      </div>

      {data.role === 'doctor' && (
        <div>
          <label className="block text-sm font-medium mb-1">Specialization</label>
          <input name="specialization" placeholder="e.g. Cardiologist, General Physician" className="input-field" value={data.specialization} onChange={onChange} />
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Create Staff
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
      </div>
    </form>
  );
};

export default StaffForm;
