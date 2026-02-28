import { GoogleGenerativeAI } from '@google/generative-ai';
import { AdviceResponse, GoalContext } from '../modules/Estrategia/Metas/types';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.warn("Compass AI: API Key Missing. AI features will be disabled.");
}

const genAI = new GoogleGenerativeAI(API_KEY || '');

export const getFinancialAdvice = async (context: GoalContext): Promise<AdviceResponse> => {
  if (!API_KEY) throw new Error("API Key missing");

  // Format Gap context logic
  const gap = context.inteligencia.capacidad_neta - context.inteligencia.aporte_planeado;
  let gapInfo = "";
  if (gap < 0) {
    gapInfo = `Déficit estructurado: Faltan EXACTAMENTE $${Math.abs(gap)} mensuales para cumplir la meta.`;
  } else {
    gapInfo = `Superávit estructurado: Sobran $${gap} mensuales. El plan es altamente viable.`;
  }

  const prompt = `
    Eres el Estratega Jefe de ClarityClick. Tu misión es analizar la meta del usuario y sus categorías de gasto para dar un informe de viabilidad escrito, altamente persuasivo estructurado en 3 partes.

    CONTEXTO DEL USUARIO (JSON):
    ${JSON.stringify({ ...context, analisis_brecha: gapInfo }, null, 2)}

    INSTRUCCIONES DE TONO Y ESTADO:
    1. Si el estado es CRITICAL o AT_RISK (Viabilidad Negativa / Déficit):
       - TONO: Constructivo, prevenido, directo pero alentador.
       - ENFOQUE: Mostrar urgencia para reducir gastos.
    2. Si el estado es ON_TRACK, AGGRESSIVE_PLAN o OPTIMIZED (Viabilidad Positiva):
       - TONO: Motivador, de aceleración.
       - ENFOQUE: Felicitar y proponer formas de optimizar o invertir lo ahorrado.

    ESTRUCTURA EXACTA REQUERIDA (OBLIGATORIO FORMATO JSON):
    Devuelve un JSON con esta estructura exacta, sin markdown, sin bloques de código:
    {
      "titulo_estrategia": "Título corto y persuasivo (Máx 5 palabras)",
      "diagnostico": "Sección 1: Estado de Viabilidad. Cifras frías. Ejemplo: 'Tu plan exige 500k pero tienes 300k. Faltan 200k.' o 'Tienes capacidad de sobra para lograrlo.'",
      "pasos": [
        {
          "orden": 1,
          "accion": "Análisis de Brecha",
          "descripcion": "Sección 2: Si hay déficit, MENCIONA LA CIFRA EXACTA FALTANTE mostrada en el Diagnóstico. Revisa el 'contexto_gastos' y sugiere recortes precisos (ej: 'Recorta $X en Categoría Y') para cubrir ese déficit exacto.",
          "tipo": "DIAGNOSTICO"
        },
        { 
          "orden": 2, 
          "accion": "Estrategia Maestra - Acción 1", 
          "descripcion": "Sección 3: Paso táctico inmedito (Ej: Cancela X suscripción, Invierte en Y).", 
          "tipo": "TACTICA" 
        },
        { 
          "orden": 3, 
          "accion": "Estrategia Maestra - Acción 2", 
          "descripcion": "Sección 3: Siguiente paso táctico.", 
          "tipo": "ESTRATEGIA" 
        }
      ],
      "disclaimer": "Consejo generado por IA con base en tus registros. No constituye asesoría legal financiera."
    }
    `;

  try {
    // Attempt with Gemini 2.5 Flash (Confirmed by user access logs)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonString) as AdviceResponse;
  } catch (error: any) {
    console.warn("Gemini 2.5 Flash failed, retrying with 2.5 Pro...", error);

    try {
      // Fallback to Gemini 2.5 Pro (Confirmed by user access logs)
      const modelPro = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
      const result = await modelPro.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(jsonString) as AdviceResponse;
    } catch (innerError) {
      console.error("AI Service Fatal Error:", innerError);
      throw new Error("No pudimos conectar con el Estratega Virtual. Por favor verifica tu conexión o API Key.");
    }
  }
};
