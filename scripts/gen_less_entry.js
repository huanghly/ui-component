const fs = require('fs');
const { join } = require('path');
const fg = require('fast-glob');

const pkgList = fs
  .readdirSync(join(__dirname, '../', 'src/components'))
  .filter((pkg) => pkg.charAt(0) !== '.');

pkgList.map(async (path) => {
  const baseUrl = `${join(__dirname, '../', 'src/components')}/${path}`;
  const lessFiles = await fg(`${baseUrl}/*.less`, {
    ignore: ['**/demos/**'],
    deep: 5,
  });

  const importFiles = lessFiles.map((lessPath) => {
    return `@import "./style/index.css";`;
  });

  // *.js导入less文件
  const distPathEs = `${join(__dirname, '../', 'dist', '/es/components/', `${path}/index.less`)}`;
  const distPathLib = `${join(__dirname, '../', 'dist', '/cjs/components/', `${path}/index.less`)}`;
  fs.writeFileSync(distPathEs, importFiles.join('\n'));
  fs.writeFileSync(distPathLib, importFiles.join('\n'));
});
