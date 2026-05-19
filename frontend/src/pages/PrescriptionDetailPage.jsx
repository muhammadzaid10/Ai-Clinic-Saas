import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Download, Calendar, Pill, FileText, AlertTriangle, Sparkles, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import { downloadPrescriptionPDF } from '../utils/pdfDownload';

const PrescriptionDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingAI, setGeneratingAI] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await API.get(`/prescriptions/${id}`);
        setPrescription(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const generateAIExplanation = async (urdu = false) => {
    setGeneratingAI(true);
    try {
      const { data } = await API.post(`/ai/explain-prescription/${id}`, { urdu });
      if (data.success) {
        setPrescription({ ...prescription, aiExplanation: data.data.explanation });
        toast.success('AI explanation generated');
      } else {
        toast.error(data.message || 'AI unavailable');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate explanation');
    } finally {
      setGeneratingAI(false);
    }
  };

  if (loading) return <Loader text="Loading prescription..." />;
  if (!prescription) return <p>Prescription not found</p>;

  const backTo = `/${user.role}/prescriptions`;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <Link to={backTo} className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-medical-600">
          <ArrowLeft className="w-4 h-4" /> Back to prescriptions
        </Link>
        <button
          onClick={() => downloadPrescriptionPDF(prescription._id)}
          className="btn-primary flex items-center gap-2"
        >
          <Download className="w-4 h-4" /> Download PDF
        </button>
      </div>

      {/* Header card with clinic letterhead feel */}
      <div className="bg-gradient-to-r from-medical-600 to-blue-600 text-white rounded-t-xl p-6">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">ClinicAI</h1>
            <p className="text-sm opacity-90">Smart Clinic Management Platform</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wider opacity-75">Prescription</p>
            <p className="text-sm font-mono">#{prescription._id.toString().slice(-8).toUpperCase()}</p>
            <p className="text-xs opacity-90">{new Date(prescription.createdAt).toLocaleDateString('en-GB')}</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 border-t-0 rounded-b-xl p-6 space-y-6">
        {/* Doctor */}
        <div className="pb-4 border-b border-slate-200">
          <p className="text-lg font-bold text-slate-800">Dr. {prescription.doctor?.name}</p>
          <p className="text-sm text-slate-500">{prescription.doctor?.specialization || 'General Physician'}</p>
        </div>

        {/* Patient */}
        <div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Patient Details</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-slate-500">Name:</span> <span className="font-medium">{prescription.patient?.name}</span></div>
            <div><span className="text-slate-500">Age:</span> <span className="font-medium">{prescription.patient?.age} years</span></div>
            <div><span className="text-slate-500">Gender:</span> <span className="font-medium capitalize">{prescription.patient?.gender}</span></div>
            <div><span className="text-slate-500">Contact:</span> <span className="font-medium">{prescription.patient?.contact || '—'}</span></div>
            {prescription.patient?.bloodGroup && prescription.patient.bloodGroup !== 'unknown' && (
              <div><span className="text-slate-500">Blood Group:</span> <span className="font-medium">{prescription.patient.bloodGroup}</span></div>
            )}
          </div>

          {prescription.patient?.allergies?.length > 0 && (
            <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <span><strong>Allergies:</strong> {prescription.patient.allergies.join(', ')}</span>
            </div>
          )}
        </div>

        {/* Diagnosis */}
        <div className="pt-4 border-t border-slate-200">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Diagnosis</h3>
          <p className="text-base text-slate-800 font-medium">{prescription.diagnosis}</p>
          {prescription.symptoms?.length > 0 && (
            <p className="text-sm text-slate-500 italic mt-1">
              Symptoms: {prescription.symptoms.join(', ')}
            </p>
          )}
        </div>

        {/* Medicines */}
        <div className="pt-4 border-t border-slate-200">
          <h3 className="text-xs font-bold text-medical-600 uppercase tracking-wider mb-3 flex items-center gap-1">
            <Pill className="w-4 h-4" /> ℞ Medication
          </h3>
          <div className="space-y-2">
            {prescription.medicines?.map((med, idx) => (
              <div key={idx} className="p-3 bg-medical-50 border border-medical-100 rounded-lg">
                <p className="font-semibold text-medical-700">{idx + 1}. {med.name}</p>
                <p className="text-sm text-slate-600 mt-1">
                  <strong>Dosage:</strong> {med.dosage} • <strong>Frequency:</strong> {med.frequency} • <strong>Duration:</strong> {med.duration}
                </p>
                {med.notes && (
                  <p className="text-xs text-slate-500 italic mt-1">Note: {med.notes}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Instructions */}
        {prescription.instructions && (
          <div className="pt-4 border-t border-slate-200">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">General Instructions</h3>
            <p className="text-sm text-slate-700 whitespace-pre-line">{prescription.instructions}</p>
          </div>
        )}

        {/* Follow up */}
        {prescription.followUpDate && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-600" />
            <div>
              <p className="text-xs text-amber-700 font-medium">Follow-up scheduled</p>
              <p className="text-sm font-semibold text-amber-900">{new Date(prescription.followUpDate).toLocaleDateString('en-GB')}</p>
            </div>
          </div>
        )}

        {/* AI Explanation - Phase 4 */}
        {prescription.aiExplanation ? (
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-bold text-purple-700">AI Health Tips for You</h3>
              </div>
              {(user.role === 'doctor' || user.role === 'patient') && (
                <button
                  onClick={() => generateAIExplanation(false)}
                  disabled={generatingAI}
                  className="text-xs text-purple-600 hover:underline disabled:opacity-50"
                >
                  Regenerate
                </button>
              )}
            </div>
            <p className="text-sm text-slate-700 whitespace-pre-line">{prescription.aiExplanation}</p>
          </div>
        ) : (
          (user.role === 'doctor' || user.role === 'patient') && (
            <div className="p-4 border-2 border-dashed border-purple-200 rounded-lg text-center">
              <Sparkles className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <p className="text-sm text-slate-600 mb-3">Get a simple, friendly explanation of this prescription</p>
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  onClick={() => generateAIExplanation(false)}
                  disabled={generatingAI}
                  className="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
                >
                  {generatingAI ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Generate AI Explanation
                </button>
                <button
                  onClick={() => generateAIExplanation(true)}
                  disabled={generatingAI}
                  className="px-4 py-2 text-sm bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg disabled:opacity-50"
                >
                  In Urdu (اردو میں)
                </button>
              </div>
            </div>
          )
        )}

        {/* Footer */}
        <div className="pt-4 border-t border-slate-200 text-center text-xs text-slate-400">
          This is a computer-generated prescription from ClinicAI
        </div>
      </div>
    </div>
  );
};

export default PrescriptionDetailPage;
