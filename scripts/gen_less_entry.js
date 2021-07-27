const fs = require('fs');
const { join } = require('path');
// const fg = require('fast-glob');

const pkgList = fs
  .readdirSync(join(__dirname, '../', 'src/components'))
  .filter((pkg) => pkg.charAt(0) !== '.');

pkgList.map(async (path) => {
  const baseUrl = `${join(__dirname, '../', 'src/components')}/${path}`;
  // const lessFiles = await fg(`${baseUrl}/*.less`, {
  //   ignore: ['**/demos/**'],
  //   deep: 5,
  // });
   
  // 读取./style/index.css文件内容后写入./index.less文件中
  let curLessUrl = `${join(__dirname, '../', 'dist', '/es/components/', `${path}/style/index.css`)}`;
  let cssData = fs.readFileSync(curLessUrl, 'utf-8')
  
  // *.js导入less文件
  const distPathEs = `${join(__dirname, '../', 'dist', '/es/components/', `${path}/index.less`)}`;
  const distPathLib = `${join(__dirname, '../', 'dist', '/cjs/components/', `${path}/index.less`)}`;
  fs.writeFileSync(distPathEs, cssData);
  fs.writeFileSync(distPathLib, cssData);
});
