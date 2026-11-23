const fs=require('fs'),path=require('path');const c=JSON.parse(fs.readFileSync(path.join(__dirname,'config.json'))),refs=JSON.parse(fs.readFileSync(path.join(__dirname,'credential-ids.json')));let missing=[];
for(const [k,v]of Object.entries(c))if(!v||String(v).includes('CONFIGURE_'))missing.push('setup/config.json: '+k);
for(const [k,v]of Object.entries(refs))if(!v||String(v).includes('CONFIGURE_'))missing.push('setup/credential-ids.json: '+k);
if(missing.length){console.log('Still required:\n'+missing.map(x=>' - '+x).join('\n'));process.exitCode=1;}else console.log('Configuration IDs supplied. This checks presence only; run the live acceptance checks before activation.');
