/**
 * Lê images/photos/portifolio/ e grava manifest.json com a lista de fotos.
 * Ordenação: número em "Photo 01 (N).ext"; suporta .jpeg e .jpg.
 * Uso: node scripts/update-portfolio-manifest.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORTFOLIO_DIR = path.join(__dirname, '..', 'images', 'photos', 'portifolio');
const MANIFEST_PATH = path.join(PORTFOLIO_DIR, 'manifest.json');

const RE = /^Photo\s+01\s+\((\d+)\)\.(jpe?g)$/i;

function main() {
  if (!fs.existsSync(PORTFOLIO_DIR)) {
    console.error('Pasta não encontrada:', PORTFOLIO_DIR);
    process.exit(1);
  }
  const entries = fs.readdirSync(PORTFOLIO_DIR, { withFileTypes: true });
  const files = entries
    .filter((d) => d.isFile())
    .map((d) => d.name)
    .filter((name) => RE.test(name) && name.toLowerCase() !== 'manifest.json');

  files.sort((a, b) => {
    const na = parseInt(a.match(RE)[1], 10);
    const nb = parseInt(b.match(RE)[1], 10);
    return na - nb || a.localeCompare(b);
  });

  const payload = {
    generatedAt: new Date().toISOString(),
    files,
  };

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(payload, null, 2) + '\n', 'utf8');
  console.log('manifest.json atualizado:', files.length, 'ficheiro(s)');
  files.forEach((f) => console.log(' ', f));
}

main();
