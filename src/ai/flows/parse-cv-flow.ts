'use server';
/**
 * @fileOverview Flusso Genkit per l'analisi intelligente dei CV Europass.
 * 
 * Questo modulo si occupa di:
 * 1. Estrarre dati anagrafici e scolastici da un PDF Europass.
 * 2. Generare un riassunto professionale orientato alle aziende.
 * 3. Suggerire i settori merceologici Confindustria più affini basandosi sulle esperienze.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { INDUSTRY_SECTORS } from '@/lib/constants';
import { checkRateLimit, refundRateLimit } from '@/lib/rate-limit';
import { requireInstituteCaller } from '@/lib/server-auth';
import { CV_RATE_LIMIT, MAX_PDF_BYTES, PDF_DATA_URI_PREFIX, estimateBase64Bytes, startsWithPdfMagic } from '@/lib/cv-limits';

const ParseCVInputSchema = z.object({
  pdfDataUri: z.string().describe("Il file PDF del CV codificato in Base64 (data URI)."),
});

// Input della Server Action: PDF + prova di sessione (verificata sul server).
const ParseCVActionSchema = ParseCVInputSchema.extend({
  idToken: z.string().describe("ID token Firebase del chiamante (verificato sul server)."),
});

const ParseCVOutputSchema = z.object({
  name: z.string().describe("Nome e cognome dello studente."),
  studentClass: z.string().describe("Classe o indirizzo di studio attuale."),
  summary: z.string().describe("Un riassunto professionale delle competenze estratte."),
  suggestedSectorIds: z.array(z.string()).describe("Lista di settori merceologici suggeriti basati sul contenuto del CV."),
});

export type ParseCVInput = z.infer<typeof ParseCVActionSchema>;
export type ParseCVOutput = z.infer<typeof ParseCVOutputSchema>;

/**
 * Funzione principale per l'analisi dei CV degli studenti.
 *
 * Protetta: verifica sessione + ruolo Institute/Admin + stato Approved,
 * controllo dimensione PDF e rate limit PRIMA di consumare quota Gemini.
 */
export async function parseStudentCV(input: ParseCVInput): Promise<ParseCVOutput> {
  const parsed = ParseCVActionSchema.parse(input);

  // Ordine: chi sei -> corpo valido -> quota -> Gemini (la quota si brucia
  // solo per PDF veri, e viene restituita se l'analisi fallisce).
  const caller = await requireInstituteCaller(parsed.idToken);

  if (!parsed.pdfDataUri.startsWith(PDF_DATA_URI_PREFIX)) {
    throw new Error('Il file deve essere un PDF (data URI non valido).');
  }
  const base64Body = parsed.pdfDataUri.slice(PDF_DATA_URI_PREFIX.length);
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
    return await parseCVFlow({ pdfDataUri: parsed.pdfDataUri });
  } catch (err) {
    refundRateLimit(rateKey);
    throw err;
  }
}

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
${INDUSTRY_SECTORS.join(", ")}`,
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