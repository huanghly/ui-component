const fs = require('fs');
const { join } = require('path');
const fg = require('·');

const pkgList = fs
  .readdirSync(join(__dirname, '../', 'src/conponents'))
  .filter((pkg) => pkg.charAt(0) !== '.');

pkgList.map(async (path) => {
  const baseUrl = `${join(__dirname, '../', 'src/conponents')}/${path}`;
  const lessFiles = await fg(`${baseUrl}/**/*.less`, {
    ignore: ['**/demos/**'],
    deep: 5,
  });
  const importFiles = lessFiles.map((lessPath) => {
    return `@import "../dist/es${lessPath.replace(baseUrl, '')}";`;
  });

  const distPath = `${join(__dirname, '../', 'dist', path, 'dist', `${path}.less`)}`;

  fs.writeFileSync(distPath, importFiles.join('\n'));
});
