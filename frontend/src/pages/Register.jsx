import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Stethoscope, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    age: '',
    gender: 'male',
    contact: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await register({
        ...formData,
        age: Number(formData.age),
        contact: formData.contact || formData.phone,
      });
      toast.success('Account created successfully!');
      navigate(`/${user.role}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-medical-50 via-white to-blue-50 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-medical-600 rounded-2xl mb-3">
            <Stethoscope className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Create Patient Account</h1>
          <p className="text-slate-500 text-sm mt-1">Join ClinicAI for digital health records</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Full Name</label>
              <input name="name" required className="input-field" value={formData.name} onChange={handleChange} />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input type="email" name="email" required className="input-field" value={formData.email} onChange={handleChange} />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input type="password" name="password" required minLength={6} className="input-field" value={formData.password} onChange={handleChange} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Age</label>
                <input type="number" name="age" required min="1" className="input-field" value={formData.age} onChange={handleChange} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Gender</label>
                <select name="gender" className="input-field" value={formData.gender} onChange={handleChange}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Phone / Contact</label>
              <input name="phone" required className="input-field" value={formData.phone} onChange={handleChange} />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center mt-2">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-medical-600 hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
