/** Shape of a single row parsed from the Excel import sheet */
export interface ImportLeadRow {
  name: string;
  email: string;
  phone?: string;
  status?: string;
  priority?: string;
  source?: string;
  score?: number;
  dealValue?: number;
  tags?: string; // semicolon-separated, e.g. "hot;enterprise"
}

/** Result for a single imported row */
export interface ImportRowResult {
  row: number;
  name: string;
  email: string;
  status: 'created' | 'skipped' | 'error';
  reason?: string;
}

/** Full response for a bulk import */
export interface BulkImportResult {
  total: number;
  created: number;
  skipped: number;
  errors: number;
  results: ImportRowResult[];
}
