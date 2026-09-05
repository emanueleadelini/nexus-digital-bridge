'use server';

/**
 * Modulo di registrazione flow per il dev runner Genkit.
 * La logica vive in parse-cv-core (importato per side effect).
 * L'endpoint di produzione e la Route Handler POST /api/parse-cv.
 */
import './parse-cv-core';

export type { ParseCVInput, ParseCVOutput } from './parse-cv-core';
