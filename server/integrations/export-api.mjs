import { db } from '../db.mjs';

export function exportProduct(productId) {
  const product = db.prepare("SELECT * FROM products WHERE id = ? AND status = 'published'").get(productId);
  if (!product) return null;

  const documents = db.prepare(
    "SELECT * FROM documents WHERE product_id = ? AND status IN ('approved','published') ORDER BY nav_order ASC",
  ).all(productId);

  return {
    product: {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      version: product.version,
    },
    documents: documents.map((d) => ({
      id: d.id,
      title: d.title,
      slug: d.slug,
      type: d.type,
      version: d.version,
      updatedAt: d.updated_at,
    })),
  };
}

export function exportDocument(documentId) {
  const doc = db.prepare(
    "SELECT * FROM documents WHERE id = ? AND status IN ('approved','published')",
  ).get(documentId);
  if (!doc) return null;

  const sections = db.prepare(
    "SELECT * FROM sections WHERE document_id = ? AND status IN ('approved','published') ORDER BY position ASC",
  ).all(documentId);

  return {
    document: {
      id: doc.id,
      title: doc.title,
      slug: doc.slug,
      type: doc.type,
      version: doc.version,
      description: doc.description,
      updatedAt: doc.updated_at,
    },
    sections: sections.map((s) => ({
      id: s.id,
      title: s.title,
      number: s.number,
      slug: s.slug,
      html: s.body_html ?? s.html ?? '',
    })),
  };
}

export function exportRelease(releaseId) {
  const release = db.prepare(
    "SELECT * FROM releases WHERE id = ? AND status IN ('published','approved')",
  ).get(releaseId);
  if (!release) return null;

  const snapshot = release.snapshot_id
    ? db.prepare('SELECT * FROM release_snapshots WHERE id = ?').get(release.snapshot_id)
    : null;

  return {
    release: {
      id: release.id,
      version: release.version,
      label: release.label,
      status: release.status,
      notes: release.notes,
      publishedAt: release.published_at ?? release.updated_at,
    },
    snapshot: snapshot ? JSON.parse(snapshot.payload) : null,
  };
}
