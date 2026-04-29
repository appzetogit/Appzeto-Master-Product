const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach( f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
};

const srcDir = path.resolve(process.cwd(), 'Frontend/src');
console.log('Searching in:', srcDir);

walk(srcDir, (filePath) => {
  if (filePath.endsWith('.jsx') || filePath.endsWith('.js') || filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('@food/utils/businessSettings')) {
      console.log('Updating:', filePath);
      let updated = content.replace(/@food\/utils\/businessSettings/g, '@common/utils/businessSettings');
      fs.writeFileSync(filePath, updated, 'utf8');
    }
  }
});
