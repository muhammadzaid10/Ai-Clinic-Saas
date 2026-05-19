import { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2, Pill } from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../services/api';

const emptyMedicine = { name: '', dosage: '', frequency: '', duration: '', notes: '' };

const PrescriptionForm = ({ patient, appointment, onSuccess, onCancel }) => {
  const [patients, setPatients] = useState([]);
  const [data, setData] = useState({
    patient: patient?._id || '',
    appointment: appointment?._id || '',
    diagnosis: '',
    symptoms: '',
    medicines: [{ ...emptyMedicine }],
    instructions: '',
    followUpDate: '',
  });
  const [loading, setLoading] = useState(false);

  // Load patient list if not pre-selected
  useEffect(() => {
    if (!patient) {
      API.get('/patients?limit=200')
        .then(({ data }) => setPatients(data.patients))
        .catch(() => {});
    }
  }, [patient]);

  const onChange = (e) => setData({ ...data, [e.target.name]: e.target.value });

  const updateMedicine = (idx, field, value) => {
    const meds = [...data.medicines];
    meds[idx][field] = value;
    setData({ ...data, medicines: meds });
  };

  const addMedicine = () =>
    setData({ ...data, medicines: [...data.medicines, { ...emptyMedicine }] });

  const removeMedicine = (idx) => {
    if (data.medicines.length === 1) return;
    setData({ ...data, medicines: data.medicines.filter((_, i) => i !== idx) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!data.patient) return toast.error('Patient select karo');
    if (!data.diagnosis.trim()) return toast.error('Diagnosis required hai');

    // At least one valid medicine
    const validMeds = data.medicines.filter((m) => m.name && m.dosage && m.frequency && m.duration);
    if (validMeds.length === 0) {
      return toast.error('Kam se kam ek complete medicine add karo');
    }

    setLoading(true);
    try {
      const payload = {
        ...data,
        medicines: validMeds,
        symptoms: data.symptoms.split(',').map((s) => s.trim()).filter(Boolean),
        followUpDate: data.followUpDate || undefined,
        appointment: data.appointment || undefined,
      };

      const { data: created } = await API.post('/prescriptions', payload);
      toast.success('Prescription created successfully');
      onSuccess(created);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create prescription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Patient selector */}
      {patient ? (
        <div className="p-3 bg-medical-50 border border-medical-200 rounded-lg">
          <p className="text-xs text-slate-500">Patient</p>
          <p className="font-semibold text-slate-800">{patient.name}</p>
          <p className="text-xs text-slate-600">{patient.age} yrs • <span className="capitalize">{patient.gender}</span> • {patient.contact}</p>
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium mb-1">Patient *</label>
          <select name="patient" required className="input-field" value={data.patient} onChange={onChange}>
            <option value="">Select patient...</option>
            {patients.map((p) => (
              <option key={p._id} value={p._id}>{p.name} • {p.contact}</option>
            ))}
          </select>
        </div>
      )}

      {/* Diagnosis */}
      <div>
        <label className="block text-sm font-medium mb-1">Diagnosis *</label>
        <input
          name="diagnosis"
          required
          className="input-field"
          placeholder="e.g. Upper respiratory tract infection"
          value={data.diagnosis}
          onChange={onChange}
        />
      </div>

      {/* Symptoms */}
      <div>
        <label className="block text-sm font-medium mb-1">Symptoms (comma-separated)</label>
        <input
          name="symptoms"
          className="input-field"
          placeholder="e.g. cough, fever, sore throat"
          value={data.symptoms}
          onChange={onChange}
        />
      </div>

      {/* Medicines */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium flex items-center gap-1">
            <Pill className="w-4 h-4 text-medical-600" /> Medicines *
          </label>
          <button type="button" onClick={addMedicine} className="text-xs text-medical-600 hover:underline flex items-center gap-1">
            <Plus className="w-3 h-3" /> Add medicine
          </button>
        </div>

        <div className="space-y-3">
          {data.medicines.map((med, idx) => (
            <div key={idx} className="p-3 border border-slate-200 rounded-lg bg-slate-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-600">Medicine #{idx + 1}</span>
                {data.medicines.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMedicine(idx)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  placeholder="Medicine name (e.g. Paracetamol)"
                  className="input-field !py-1.5 text-sm"
                  value={med.name}
                  onChange={(e) => updateMedicine(idx, 'name', e.target.value)}
                />
                <input
                  placeholder="Dosage (e.g. 500mg)"
                  className="input-field !py-1.5 text-sm"
                  value={med.dosage}
                  onChange={(e) => updateMedicine(idx, 'dosage', e.target.value)}
                />
                <input
                  placeholder="Frequency (e.g. Twice a day)"
                  className="input-field !py-1.5 text-sm"
                  value={med.frequency}
                  onChange={(e) => updateMedicine(idx, 'frequency', e.target.value)}
                />
                <input
                  placeholder="Duration (e.g. 5 days)"
                  className="input-field !py-1.5 text-sm"
                  value={med.duration}
                  onChange={(e) => updateMedicine(idx, 'duration', e.target.value)}
                />
              </div>
              <input
                placeholder="Notes (e.g. Take after meals)"
                className="input-field !py-1.5 text-sm mt-2"
                value={med.notes}
                onChange={(e) => updateMedicine(idx, 'notes', e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div>
        <label className="block text-sm font-medium mb-1">General Instructions</label>
        <textarea
          name="instructions"
          rows="3"
          className="input-field"
          placeholder="e.g. Rest, drink plenty of fluids, avoid cold drinks..."
          value={data.instructions}
          onChange={onChange}
        />
      </div>

      {/* Follow up */}
      <div>
        <label className="block text-sm font-medium mb-1">Follow-up Date (optional)</label>
        <input
          type="date"
          name="followUpDate"
          min={new Date().toISOString().split('T')[0]}
          className="input-field"
          value={data.followUpDate}
          onChange={onChange}
        />
      </div>

      <div className="flex gap-3 pt-2 border-t border-slate-200">
        <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Save Prescription
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
      </div>
    </form>
  );
};

export default PrescriptionForm;
