// tsc ne copie pas les fichiers .sql : on les place à côté du code compilé.
import { copyFileSync, mkdirSync, readdirSync } from "node:fs";

const sourceDirectory = "src/db/migrations";
const targetDirectory = "dist/db/migrations";

mkdirSync(targetDirectory, { recursive: true });
for (const entry of readdirSync(sourceDirectory, { withFileTypes: true })) {
  if (entry.isFile()) {
    copyFileSync(`${sourceDirectory}/${entry.name}`, `${targetDirectory}/${entry.name}`);
  }
}
