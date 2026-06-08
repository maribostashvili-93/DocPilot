import * as products     from './products.mjs';
import * as documents    from './documents.mjs';
import * as sections     from './sections.mjs';
import * as translations from './translations.mjs';
import * as releases     from './releases.mjs';

const ADAPTERS = { products, documents, sections, translations, releases };

export function getAdapter(entityType) {
  const a = ADAPTERS[entityType];
  if (!a) throw new Error(`Unknown adapter type: ${entityType}`);
  return a;
}

export { products, documents, sections, translations, releases };
