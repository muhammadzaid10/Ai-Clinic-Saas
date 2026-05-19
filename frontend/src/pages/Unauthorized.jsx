import { Link } from 'react-router-dom';
import { ShieldX } from 'lucide-react';

const Unauthorized = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
    <div className="text-center">
      <ShieldX className="w-20 h-20 text-red-500 mx-auto mb-4" />
      <h1 className="text-3xl font-bold text-slate-800 mb-2">Access Denied</h1>
      <p className="text-slate-500 mb-6">You don't have permission to view this page.</p>
      <Link to="/login" className="btn-primary">Back to Login</Link>
    </div>
  </div>
);

export default Unauthorized;
