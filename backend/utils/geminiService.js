const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;
let model = null;

const initGemini = () => {
  if (genAI) return model;
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
    return null;
  }
  try {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    model = genAI.getGenerativeModel({ model: modelName });
    return model;
  } catch (err) {
    console.error('Failed to init Gemini:', err.message);
    return null;
  }
};

/**
 * Extract JSON object from raw LLM text.
 * Gemini sometimes wraps JSON in ```json fences or adds preamble.
 */
const parseJSON = (text) => {
  try {
    const clean = text.replace(/```json|```/g, '').trim();
    // Try to find first { and last }
    const start = clean.indexOf('{');
    const end = clean.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      return JSON.parse(clean.slice(start, end + 1));
    }
    return JSON.parse(clean);
  } catch (err) {
    console.error('JSON parse failed:', err.message, '\nRaw:', text);
    return null;
  }
};

/**
 * AI FEATURE 1 — Smart Symptom Checker
 * Returns: { possibleConditions, suggestedTests, recommendations, riskLevel }
 */
const symptomChecker = async ({ symptoms, age, gender, history }) => {
  const m = initGemini();
  if (!m) {
    return {
      success: false,
      message: 'AI service not configured. Please add GEMINI_API_KEY in .env',
      fallback: true,
    };
  }

  const prompt = `You are a medical assistant AI helping doctors with preliminary symptom analysis.
This is NOT a final diagnosis — just suggestions for the doctor's consideration.

Patient details:
- Age: ${age || 'unknown'}
- Gender: ${gender || 'unknown'}
- Symptoms: ${Array.isArray(symptoms) ? symptoms.join(', ') : symptoms}
- Medical history: ${history || 'none reported'}

Respond ONLY with a valid JSON object in this exact format (no markdown, no explanation outside JSON):
{
  "possibleConditions": ["condition 1", "condition 2", "condition 3"],
  "suggestedTests": ["test 1", "test 2"],
  "recommendations": "Brief recommendation for the doctor in 2-3 sentences",
  "riskLevel": "low" | "medium" | "high" | "critical"
}

Keep conditions short (2-4 words each). Be concise.`;

  try {
    const result = await m.generateContent(prompt);
    const text = result.response.text();
    const parsed = parseJSON(text);

    if (!parsed) {
      return { success: false, message: 'AI returned unparseable response', fallback: true };
    }

    return {
      success: true,
      data: {
        possibleConditions: parsed.possibleConditions || [],
        suggestedTests: parsed.suggestedTests || [],
        recommendations: parsed.recommendations || '',
        riskLevel: ['low', 'medium', 'high', 'critical'].includes(parsed.riskLevel)
          ? parsed.riskLevel
          : 'low',
        rawResponse: text,
      },
    };
  } catch (err) {
    console.error('Gemini error (symptomChecker):', err.message);
    let message = 'AI service temporarily unavailable';
    if (err.message?.includes('404') || err.message?.includes('not found')) {
      message = 'AI model not found — set GEMINI_MODEL=gemini-2.5-flash in .env';
    } else if (err.message?.includes('429')) {
      message = 'AI quota exceeded — wait a minute or create a new key at aistudio.google.com';
    }
    return { success: false, message, fallback: true };
  }
};

/**
 * AI FEATURE 2 — Prescription Explanation (patient-friendly)
 */
const explainPrescription = async ({ diagnosis, medicines, instructions, urdu }) => {
  const m = initGemini();
  if (!m) {
    return { success: false, message: 'AI service not configured', fallback: true };
  }

  const medList = (medicines || [])
    .map((med) => `${med.name} (${med.dosage}, ${med.frequency}, ${med.duration})`)
    .join('; ');

  const language = urdu ? 'Urdu (use Urdu script)' : 'simple English';

  const prompt = `You are a patient-friendly health communicator.
A patient has received this prescription. Explain it to them in ${language} (no medical jargon, like talking to a friend).

Diagnosis: ${diagnosis}
Medicines: ${medList}
Doctor's instructions: ${instructions || 'none'}

Write a clear, friendly explanation (4-6 sentences) that covers:
1. What the condition means
2. How the medicines will help
3. Important lifestyle tips
4. When to seek further medical help

Plain text only. No markdown. No headings.`;

  try {
    const result = await m.generateContent(prompt);
    return {
      success: true,
      data: { explanation: result.response.text().trim() },
    };
  } catch (err) {
    console.error('Gemini error (explainPrescription):', err.message);
    return {
      success: false,
      message: err.message?.includes('404') ? 'AI model not found — set GEMINI_MODEL=gemini-2.5-flash in .env' : err.message?.includes('429') ? 'AI quota exceeded — wait a minute or use a new API key from aistudio.google.com' : 'AI service temporarily unavailable',
      fallback: true,
    };
  }
};

/**
 * AI FEATURE 3 — Risk Flagging
 * Analyze patient's history to identify high-risk patterns
 */
const flagRisks = async ({ patientName, age, conditions, recentDiagnoses, recentSymptoms }) => {
  const m = initGemini();
  if (!m) {
    return { success: false, message: 'AI service not configured', fallback: true };
  }

  const prompt = `Analyze this patient's medical history for risk patterns:

Patient: ${patientName}, Age: ${age}
Chronic conditions: ${conditions?.join(', ') || 'none'}
Recent diagnoses (last 6 months): ${recentDiagnoses?.join(', ') || 'none'}
Recent symptoms: ${recentSymptoms?.join(', ') || 'none'}

Identify any concerning patterns. Respond with JSON only:
{
  "riskLevel": "low" | "medium" | "high" | "critical",
  "flags": ["specific concern 1", "specific concern 2"],
  "summary": "1-2 sentence summary"
}`;

  try {
    const result = await m.generateContent(prompt);
    const parsed = parseJSON(result.response.text());

    if (!parsed) {
      return { success: false, message: 'AI returned unparseable response', fallback: true };
    }

    return {
      success: true,
      data: {
        riskLevel: ['low', 'medium', 'high', 'critical'].includes(parsed.riskLevel)
          ? parsed.riskLevel
          : 'low',
        flags: parsed.flags || [],
        summary: parsed.summary || '',
      },
    };
  } catch (err) {
    console.error('Gemini error (flagRisks):', err.message);
    return {
      success: false,
      message: err.message?.includes('404') ? 'AI model not found — set GEMINI_MODEL=gemini-2.5-flash in .env' : err.message?.includes('429') ? 'AI quota exceeded — wait a minute or use a new API key from aistudio.google.com' : 'AI service temporarily unavailable',
      fallback: true,
    };
  }
};

module.exports = { symptomChecker, explainPrescription, flagRisks };
