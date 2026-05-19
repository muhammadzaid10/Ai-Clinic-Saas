import API from '../services/api';
import toast from 'react-hot-toast';

/**
 * Download prescription PDF in a new tab with auth header.
 * Yeh axios se blob fetch karta hai aur browser mein open karta hai.
 */
export const downloadPrescriptionPDF = async (prescriptionId) => {
  try {
    const response = await API.get(`/prescriptions/${prescriptionId}/pdf`, {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);

    // Open in new tab
    const win = window.open(url, '_blank');
    if (!win) {
      // Popup blocked - fallback to download
      const link = document.createElement('a');
      link.href = url;
      link.download = `prescription_${prescriptionId}.pdf`;
      link.click();
    }

    // Clean up
    setTimeout(() => window.URL.revokeObjectURL(url), 60000);
  } catch (err) {
    toast.error('Failed to download PDF');
    console.error(err);
  }
};
