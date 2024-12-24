/* eslint-disable no-console, import/no-extraneous-dependencies */
const fs = require('fs');
const path = require('path');
const Spritesmith = require('spritesmith');

const NEWLINE = '\r\n';

function glueImages(dir, name, cb) {
  const out = `${dir + name}.png`;
  fs.readdir(`${dir + name}/`, (err, files) => {
    if (err) {
      throw err;
    }
    const paths = files.map((a) => `${dir + name}/${a}`);
    Spritesmith.run(
      {
        src: paths,
        algorithm: 'binary-tree',
        padding: 2,
      },
      (e, result) => {
        if (e) {
          throw e;
        }
        fs.writeFileSync(out, result.image);
        if (cb) {
          cb(dir, name, result.coordinates);
        }
      },
    );
  });
}

glueImages('./assets/icons/', 'icons', (dir, name, coordinates) => {
  const names = Object.keys(coordinates)
    .map((f) => path.basename(f, path.extname(f)))
    .map((a) => `.icon-${a}`)
    .join(',');
  let scss = '';
  scss += `${names}{${NEWLINE}`;
  scss += `    background-image:url('../../icons/${name}.png');${NEWLINE}`;
  scss += `    background-repeat:no-repeat;${NEWLINE}`;
  scss += `    display: inline-block;${NEWLINE}`;
  scss += `}`;
  scss += NEWLINE;
  scss += Object.keys(coordinates)
    .map((f) => {
      const fileName = path.basename(f, path.extname(f));
      const d = coordinates[f];
      return (
        `` +
        `.icon-${fileName} {${NEWLINE}    background-position: -${d.x}px -${d.y}px;${NEWLINE}    width: ${d.width}px;${NEWLINE}    height: ${d.height}px;${NEWLINE}}`
      );
    })
    .join(NEWLINE);
  fs.writeFileSync('./assets/icons/icons.scss', scss);
  console.log(`Completed ${name} sprites`);
});
