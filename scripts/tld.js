/* eslint-disable no-console */
const http = require('http');
const fs = require('fs');

const TLD_FETCH_URL = 'http://data.iana.org/TLD/tlds-alpha-by-domain.txt';
const TLD_MIN = 271; // Only update if at least this many found (original count)

const targetFile = 'assets/tld.json';

function cb() {
  console.log('Done!');
}

function parseTLDs(data) {
  // List of pseudo TLD-s we want to support
  const list = ['bit', 'exit', 'gnu', 'i2p', 'local', 'onion', 'zkey'];

  // Make sure data is string
  if (typeof data !== 'string') return null;

  // Parse response data by line
  const arr = data.split('\n');
  for (const idx of arr) {
    const tld = arr[idx];

    // Ignore invalid/weird TLDs or comment
    const shouldSkip =
      typeof tld !== 'string' ||
      tld.length < 1 ||
      tld[0] === '#' ||
      tld.indexOf('XN--') >= 0;

    if (!shouldSkip) {
      list.push(tld);
    }
  }

  // Only return fetched list if its larger than default
  if (list.length <= TLD_MIN) return null;

  list.sort((x, y) => {
    // Sort by size then alphabetically
    if (x.length === y.length) {
      if (x === y) {
        return 0;
      }

      return x < y ? -1 : 1;
    }
    return y.length - x.length;
  });
  return list;
}

// Asynchronously fetch TLDs, if valid then replace
http
  .get(TLD_FETCH_URL, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      // Join response till its complete
      data += chunk;
    });
    res.on('end', () => {
      // When response completes parse and replace
      const list = parseTLDs(data);
      console.log(`Retrieved ${list.length} tlds!`);
      fs.writeFile(targetFile, JSON.stringify(list), 'utf8', (err) => {
        if (err) {
          console.error(`IO error writing to ${targetFile} skipping write.`);
        } else {
          console.log(`Wrote new TLDs to file ${targetFile}!`);
        }
        cb();
      });
    });
  })
  .on('error', (e) => {
    console.log(`TLD fetch failed, using defaults: ${e.message}`);
    cb();
  });
