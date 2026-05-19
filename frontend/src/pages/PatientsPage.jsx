import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Edit2, Trash2, Eye, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import PatientForm from '../components/PatientForm';

const PatientsPage = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);

  const detailsPathPrefix = `/${user.role}/patients`;

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/patients', {
        params: { search, page, limit: 20 },
      });
      setPatients(data.patients);
      setPages(data.pages);
    } catch (err) {
      toast.error('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
    // eslint-disable-next-line
  }, [page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchPatients();
  };

  const handleDelete = async (id) => {
    if (!confirm('Patient delete karna chahte ho? Yeh action reverse nahi hoga.')) return;
    try {
      await API.delete(`/patients/${id}`);
      toast.success('Patient deleted');
      fetchPatients();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const openCreate = () => {
    setEditingPatient(null);
    setModalOpen(true);
  };

  const openEdit = (p) => {
    setEditingPatient(p);
    setModalOpen(true);
  };

  const onFormSuccess = () => {
    setModalOpen(false);
    fetchPatients();
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Patients</h1>
          <p className="text-slate-500 text-sm">All registered patients will be shown here.</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 self-start">
          <Plus className="w-4 h-4" /> Register Patient
        </button>
      </div>

      <form onSubmit={handleSearch} className="card !p-3 mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, contact, or email..."
            className="input-field pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button type="submit" className="btn-primary">Search</button>
      </form>

      <div className="card !p-0 overflow-hidden">
        {loading ? (
          <Loader />
        ) : patients.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No patients yet"
            description="Click the button above to register the first patient."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left text-xs font-semibold text-slate-600 uppercase px-4 py-3">Patient</th>
                  <th className="text-left text-xs font-semibold text-slate-600 uppercase px-4 py-3 hidden md:table-cell">Age/Gender</th>
                  <th className="text-left text-xs font-semibold text-slate-600 uppercase px-4 py-3 hidden lg:table-cell">Contact</th>
                  <th className="text-left text-xs font-semibold text-slate-600 uppercase px-4 py-3 hidden lg:table-cell">Blood</th>
                  <th className="text-right text-xs font-semibold text-slate-600 uppercase px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {patients.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-medical-100 text-medical-700 rounded-full flex items-center justify-center font-semibold text-sm">
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{p.name}</p>
                          <p className="text-xs text-slate-500">{p.email || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 hidden md:table-cell">
                      {p.age} yrs • <span className="capitalize">{p.gender}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 hidden lg:table-cell">{p.contact}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 hidden lg:table-cell">{p.bloodGroup}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link to={`${detailsPathPrefix}/${p._id}`} className="p-2 text-slate-600 hover:text-medical-600 hover:bg-medical-50 rounded" title="View">
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button onClick={() => openEdit(p)} className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {user.role === 'admin' && (
                          <button onClick={() => handleDelete(p._id)} className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
            <p className="text-sm text-slate-600">Page {page} of {pages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(page - 1)} disabled={page === 1} className="btn-secondary text-sm disabled:opacity-50">Previous</button>
              <button onClick={() => setPage(page + 1)} disabled={page === pages} className="btn-secondary text-sm disabled:opacity-50">Next</button>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingPatient ? 'Edit Patient' : 'Register New Patient'} size="lg">
        <PatientForm patient={editingPatient} onSuccess={onFormSuccess} onCancel={() => setModalOpen(false)} />
      </Modal>
    </div>
  );
};

export default PatientsPage;
