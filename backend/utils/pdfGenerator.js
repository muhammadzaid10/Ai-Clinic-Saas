const PDFDocument = require('pdfkit');

/**
 * Generate prescription PDF and stream it to the response.
 * Professional clinic letterhead design.
 */
const generatePrescriptionPDF = (prescription, res) => {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });

  // Headers for inline display + download
  const filename = `prescription_${prescription._id}.pdf`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

  doc.pipe(res);

  // Colors
  const PRIMARY = '#0ea5e9';
  const DARK = '#1e293b';
  const MUTED = '#64748b';
  const LIGHT_BG = '#f0f9ff';

  // ===== HEADER =====
  doc.rect(0, 0, doc.page.width, 100).fill(PRIMARY);

  doc.fillColor('white')
    .fontSize(24)
    .font('Helvetica-Bold')
    .text('ClinicAI', 50, 30);

  doc.fontSize(10)
    .font('Helvetica')
    .text('Smart Clinic Management Platform', 50, 60)
    .text('AI-Powered Healthcare Solutions', 50, 75);

  // Right-side prescription label
  doc.fontSize(16)
    .font('Helvetica-Bold')
    .text('PRESCRIPTION', 0, 40, { align: 'right', width: doc.page.width - 50 });

  doc.fontSize(9)
    .font('Helvetica')
    .text(
      `Date: ${new Date(prescription.createdAt).toLocaleDateString('en-GB')}`,
      0, 65,
      { align: 'right', width: doc.page.width - 50 }
    );
  doc.text(
    `Rx ID: ${prescription._id.toString().slice(-8).toUpperCase()}`,
    0, 80,
    { align: 'right', width: doc.page.width - 50 }
  );

  // ===== DOCTOR INFO =====
  doc.fillColor(DARK)
    .fontSize(13)
    .font('Helvetica-Bold')
    .text(`Dr. ${prescription.doctor.name}`, 50, 120);
  doc.fillColor(MUTED)
    .fontSize(10)
    .font('Helvetica')
    .text(prescription.doctor.specialization || 'General Physician', 50, 138);

  // Divider
  doc.moveTo(50, 160).lineTo(doc.page.width - 50, 160).strokeColor('#e2e8f0').lineWidth(1).stroke();

  // ===== PATIENT INFO =====
  let y = 175;
  doc.fillColor(DARK).fontSize(11).font('Helvetica-Bold').text('PATIENT DETAILS', 50, y);
  y += 18;

  const patient = prescription.patient;
  doc.fillColor(DARK).fontSize(10).font('Helvetica-Bold').text('Name:', 50, y);
  doc.font('Helvetica').text(patient.name, 110, y);
  doc.font('Helvetica-Bold').text('Age:', 320, y);
  doc.font('Helvetica').text(`${patient.age} years`, 360, y);

  y += 16;
  doc.font('Helvetica-Bold').text('Gender:', 50, y);
  doc.font('Helvetica').text(patient.gender, 110, y, { width: 200 });
  doc.font('Helvetica-Bold').text('Contact:', 320, y);
  doc.font('Helvetica').text(patient.contact || '—', 370, y);

  if (patient.bloodGroup && patient.bloodGroup !== 'unknown') {
    y += 16;
    doc.font('Helvetica-Bold').text('Blood Group:', 50, y);
    doc.font('Helvetica').text(patient.bloodGroup, 130, y);
  }

  y += 25;
  // Divider
  doc.moveTo(50, y).lineTo(doc.page.width - 50, y).strokeColor('#e2e8f0').stroke();
  y += 15;

  // ===== DIAGNOSIS =====
  doc.fillColor(DARK).fontSize(11).font('Helvetica-Bold').text('DIAGNOSIS', 50, y);
  y += 18;
  doc.fillColor(DARK).fontSize(11).font('Helvetica').text(prescription.diagnosis, 50, y, {
    width: doc.page.width - 100,
  });
  y = doc.y + 10;

  if (prescription.symptoms && prescription.symptoms.length > 0) {
    doc.fillColor(MUTED).fontSize(9).font('Helvetica-Oblique')
      .text(`Symptoms: ${prescription.symptoms.join(', ')}`, 50, y, {
        width: doc.page.width - 100,
      });
    y = doc.y + 10;
  }

  y += 5;
  doc.moveTo(50, y).lineTo(doc.page.width - 50, y).strokeColor('#e2e8f0').stroke();
  y += 15;

  // ===== MEDICINES (℞) =====
  doc.fillColor(PRIMARY).fontSize(28).font('Helvetica-Bold').text('℞', 50, y);
  doc.fillColor(DARK).fontSize(11).font('Helvetica-Bold').text('MEDICATION', 90, y + 8);
  y += 40;

  if (prescription.medicines && prescription.medicines.length > 0) {
    prescription.medicines.forEach((med, idx) => {
      // Box background
      const boxHeight = 55;
      doc.rect(50, y, doc.page.width - 100, boxHeight).fill(LIGHT_BG);

      doc.fillColor(PRIMARY).fontSize(11).font('Helvetica-Bold')
        .text(`${idx + 1}. ${med.name}`, 60, y + 8);

      doc.fillColor(DARK).fontSize(10).font('Helvetica')
        .text(`Dosage: ${med.dosage}  •  Frequency: ${med.frequency}  •  Duration: ${med.duration}`,
          60, y + 25);

      if (med.notes) {
        doc.fillColor(MUTED).fontSize(9).font('Helvetica-Oblique')
          .text(`Note: ${med.notes}`, 60, y + 40);
      }

      y += boxHeight + 8;

      // Page break if needed
      if (y > doc.page.height - 150) {
        doc.addPage();
        y = 50;
      }
    });
  } else {
    doc.fillColor(MUTED).fontSize(10).font('Helvetica-Oblique').text('No medicines prescribed', 60, y);
    y += 20;
  }

  // ===== INSTRUCTIONS =====
  if (prescription.instructions) {
    y += 10;
    doc.fillColor(DARK).fontSize(11).font('Helvetica-Bold').text('INSTRUCTIONS', 50, y);
    y += 18;
    doc.fillColor(DARK).fontSize(10).font('Helvetica').text(prescription.instructions, 50, y, {
      width: doc.page.width - 100,
    });
    y = doc.y + 10;
  }

  // ===== FOLLOW UP =====
  if (prescription.followUpDate) {
    y += 10;
    doc.fillColor('#dc2626').fontSize(10).font('Helvetica-Bold')
      .text(`📅 Follow-up: ${new Date(prescription.followUpDate).toLocaleDateString('en-GB')}`, 50, y);
    y += 18;
  }

  // ===== AI EXPLANATION (Phase 4) =====
  if (prescription.aiExplanation) {
    y += 10;
    if (y > doc.page.height - 120) {
      doc.addPage();
      y = 50;
    }
    doc.fillColor('#7c3aed').fontSize(10).font('Helvetica-Bold').text('💡 AI Health Tips', 50, y);
    y += 16;
    doc.fillColor(DARK).fontSize(9).font('Helvetica-Oblique').text(prescription.aiExplanation, 50, y, {
      width: doc.page.width - 100,
    });
    y = doc.y + 10;
  }

  // ===== FOOTER =====
  const footerY = doc.page.height - 80;
  doc.moveTo(50, footerY).lineTo(doc.page.width - 50, footerY).strokeColor('#e2e8f0').stroke();

  // Signature
  doc.fillColor(DARK).fontSize(9).font('Helvetica')
    .text('Doctor Signature', doc.page.width - 200, footerY + 10);
  doc.fillColor(PRIMARY).fontSize(12).font('Helvetica-Bold')
    .text(`Dr. ${prescription.doctor.name}`, doc.page.width - 200, footerY + 25);
  doc.fillColor(MUTED).fontSize(8).font('Helvetica')
    .text(prescription.doctor.specialization || 'General Physician', doc.page.width - 200, footerY + 40);

  doc.fillColor(MUTED).fontSize(8).font('Helvetica-Oblique')
    .text('This is a computer-generated prescription from ClinicAI.', 50, footerY + 50,
      { align: 'center', width: doc.page.width - 100 });

  doc.end();
};

module.exports = { generatePrescriptionPDF };
