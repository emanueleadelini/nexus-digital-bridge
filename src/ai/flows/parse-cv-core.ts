/**
 * @fileOverview Flusso Genkit per l'analisi intelligente dei CV Europass.
 *
 * Modulo PURO (niente 'use server'): definisce flow + guardie ed e usato
 * sia dalla Route Handler /api/parse-cv sia dal dev runner Genkit.
 *
 * Ordine dei controlli: chi sei -> corpo valido -> quota -> Gemini.
 * La quota si consuma solo per PDF veri e viene restituita se l'analisi fallisce.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { INDUSTRY_SECTORS } from '@/lib/constants';
import { checkRateLimit, refundRateLimit } from '@/lib/rate-limit';
import { requireInstituteCaller } from '@/lib/server-auth';
import {
  CV_RATE_LIMIT,
  MAX_PDF_BYTES,
  PDF_DATA_URI_PREFIX,
  estimateBase64Bytes,
  startsWithPdfMagic,
} from '@/lib/cv-limits';

const ParseCVInputSchema = z.object({
  pdfDataUri: z.string().describe('Il file PDF del CV codificato in Base64 (data URI).'),
});

const ParseCVOutputSchema = z.object({
  name: z.string().describe('Nome e cognome dello studente.'),
  studentClass: z.string().describe('Classe o indirizzo di studio attuale.'),
  summary: z.string().describe('Un riassunto professionale delle competenze estratte.'),
  suggestedSectorIds: z.array(z.string()).describe('Lista di settori merceologici suggeriti basati sul contenuto del CV.'),
});

export type ParseCVInput = z.infer<typeof ParseCVInputSchema> & { idToken: string };
export type ParseCVOutput = z.infer<typeof ParseCVOutputSchema>;

const parseCVFlow = ai.defineFlow(
  {
    name: 'parseCVFlow',
    inputSchema: ParseCVInputSchema,
    outputSchema: ParseCVOutputSchema,
  },
  async (input) => {
    const response = await ai.generate({
      prompt: [
        {
          text: `Sei un esperto di selezione del personale e orientamento scolastico per la piattaforma "Nexus Digital Bridge".
Analizza questo CV Europass e estrai le informazioni in modo professionale.
REGOLE DI ESTRAZIONE:
1. Nome: Estrai solo nome e cognome.
2. Classe: Identifica l'ultimo anno di corso o l'indirizzo di studi (es. 5A Informatica).
3. Sommario: Scrivi 3-4 righe che valorizzino il talento dello studente per una possibile azienda, evidenziando le hard skills.
4. Settori Suggeriti: Scegli ESCLUSIVAMENTE tra questa lista ufficiale di settori Confindustria:
${INDUSTRY_SECTORS.join(', ')}`,
        },
        {
          media: { url: input.pdfDataUri },
        },
      ],
      output: { schema: ParseCVOutputSchema },
    });

    if (!response.output) {
      throw new Error("L'analisi del documento è fallita. Riprova con un altro file.");
    }

    return response.output;
  }
);

/** Esegue l'analisi con tutte le guardie. Lancia Error con messaggio utente. */
export async function runParseCV(input: ParseCVInput, ip: string | null): Promise<ParseCVOutput> {
  const caller = await requireInstituteCaller(input.idToken, ip);

  if (typeof input.pdfDataUri !== 'string' || !input.pdfDataUri.startsWith(PDF_DATA_URI_PREFIX)) {
    throw new Error('Il file deve essere un PDF (data URI non valido).');
  }
  const base64Body = input.pdfDataUri.slice(PDF_DATA_URI_PREFIX.length);
  if (estimateBase64Bytes(base64Body) > MAX_PDF_BYTES) {
    throw new Error('Il PDF supera i 10MB. Comprimi il file e riprova.');
  }
  if (!startsWithPdfMagic(base64Body)) {
    throw new Error('Il file non sembra un PDF valido.');
  }

  const rateKey = `parse-cv:${caller.uid}`;
  const quota = checkRateLimit(rateKey, CV_RATE_LIMIT);
  if (!quota.allowed) {
    throw new Error('Quota analisi IA esaurita. Riprova tra un ora.');
  }

  try {
    return await parseCVFlow({ pdfDataUri: input.pdfDataUri });
  } catch (err) {
    refundRateLimit(rateKey);
    throw err;
  }
}
