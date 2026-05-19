import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, FileText, Download, Eye, Calendar, Pill } from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import PrescriptionForm from '../components/PrescriptionForm';
import { downloadPrescriptionPDF } from '../utils/pdfDownload';

const PrescriptionsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/prescriptions', { params: { search } });
      setPrescriptions(data);
    } catch (err) {
      toast.error('Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
    // eslint-disable-next-line
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchPrescriptions();
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {user.role === 'patient' ? 'My Prescriptions' : 'Prescriptions'}
          </h1>
          <p className="text-slate-500 text-sm">
            {user.role === 'doctor' && 'The prescriptions you have issued'}
            {user.role === 'patient' && 'These prescriptions have been issued by your doctors'}
            {user.role === 'admin' && 'All clinic prescriptions'}
          </p>
        </div>
        {user.role === 'doctor' && (
          <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-2 self-start">
            <Plus className="w-4 h-4" /> New Prescription
          </button>
        )}
      </div>

      <form onSubmit={handleSearch} className="card !p-3 mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by diagnosis or patient name..."
            className="input-field pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button type="submit" className="btn-primary">Search</button>
      </form>

      {loading ? (
        <Loader />
      ) : prescriptions.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={FileText}
            title="No prescriptions found"
            description={user.role === 'doctor' ? 'Click above button to create first prescription' : 'No prescriptions have been received yet.'}
          />
        </div>
      ) : (
        <div className="space-y-3">
          {prescriptions.map((p) => (
            <div key={p._id} className="card !p-4 hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-baseline gap-2 mb-1">
                    <p className="font-semibold text-slate-800">{p.diagnosis}</p>
                    <span className="text-xs text-slate-500">
                      • {new Date(p.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-sm text-slate-600 mb-2">
                    {user.role === 'patient' ? `Dr. ${p.doctor?.name}` : `Patient: ${p.patient?.name}`}
                    {p.doctor?.specialization && user.role === 'patient' && ` • ${p.doctor.specialization}`}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Pill className="w-3 h-3" /> {p.medicines?.length || 0} medicines
                    </span>
                    {p.followUpDate && (
                      <span className="flex items-center gap-1 text-amber-600">
                        <Calendar className="w-3 h-3" /> Follow-up: {new Date(p.followUpDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => navigate(`/${user.role}/prescriptions/${p._id}`)}
                    className="px-3 py-1.5 text-xs bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" /> View
                  </button>
                  <button
                    onClick={() => downloadPrescriptionPDF(p._id)}
                    className="px-3 py-1.5 text-xs bg-medical-100 text-medical-700 rounded-lg hover:bg-medical-200 flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" /> PDF
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="New Prescription" size="xl">
        <PrescriptionForm
          onSuccess={() => { setModalOpen(false); fetchPrescriptions(); }}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default PrescriptionsPage;
