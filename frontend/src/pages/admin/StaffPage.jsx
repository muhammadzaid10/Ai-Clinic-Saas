import { useState, useEffect } from 'react';
import { Plus, Search, Trash2, UserCheck, UserX, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../../services/api';
import Modal from '../../components/Modal';
import Loader from '../../components/Loader';
import EmptyState from '../../components/EmptyState';
import Badge from '../../components/Badge';
import StaffForm from '../../components/StaffForm';

const roleColors = {
  admin: 'bg-purple-100 text-purple-700',
  doctor: 'bg-medical-100 text-medical-700',
  receptionist: 'bg-amber-100 text-amber-700',
};

const StaffPage = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/staff', { params: { role: roleFilter, search } });
      setStaff(data);
    } catch (err) {
      toast.error('Failed to load staff');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
    // eslint-disable-next-line
  }, [roleFilter]);

  const handleToggleActive = async (user) => {
    try {
      await API.put(`/staff/${user._id}`, { isActive: !user.isActive });
      toast.success(`Staff ${user.isActive ? 'deactivated' : 'activated'}`);
      fetchStaff();
    } catch (err) {
      toast.error('Update failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return;
    try {
      await API.delete(`/staff/${id}`);
      toast.success('Staff deleted');
      fetchStaff();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Staff Management</h1>
          <p className="text-slate-500 text-sm">Manage doctors, receptionists, and admins</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-2 self-start">
          <Plus className="w-4 h-4" /> Add Staff
        </button>
      </div>

      <div className="card !p-3 mb-4 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            className="input-field pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchStaff()}
          />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="input-field sm:w-48">
          <option value="">All Roles</option>
          <option value="admin">Admins</option>
          <option value="doctor">Doctors</option>
          <option value="receptionist">Receptionists</option>
        </select>
      </div>

      <div className="card !p-0 overflow-hidden">
        {loading ? (
          <Loader />
        ) : staff.length === 0 ? (
          <EmptyState icon={UserPlus} title="No staff yet" description="Click the button above to add your first staff member." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left text-xs font-semibold text-slate-600 uppercase px-4 py-3">Name</th>
                  <th className="text-left text-xs font-semibold text-slate-600 uppercase px-4 py-3 hidden md:table-cell">Email</th>
                  <th className="text-left text-xs font-semibold text-slate-600 uppercase px-4 py-3">Role</th>
                  <th className="text-left text-xs font-semibold text-slate-600 uppercase px-4 py-3 hidden lg:table-cell">Specialization</th>
                  <th className="text-left text-xs font-semibold text-slate-600 uppercase px-4 py-3">Status</th>
                  <th className="text-right text-xs font-semibold text-slate-600 uppercase px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staff.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{s.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 hidden md:table-cell">{s.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full capitalize ${roleColors[s.role]}`}>
                        {s.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 hidden lg:table-cell">{s.specialization || '—'}</td>
                    <td className="px-4 py-3">
                      <Badge status={s.isActive ? 'active' : 'inactive'} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleToggleActive(s)}
                          className="p-2 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded"
                          title={s.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {s.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>
                        <button onClick={() => handleDelete(s._id)} className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add New Staff Member" size="lg">
        <StaffForm onSuccess={() => { setModalOpen(false); fetchStaff(); }} onCancel={() => setModalOpen(false)} />
      </Modal>
    </div>
  );
};

export default StaffPage;
