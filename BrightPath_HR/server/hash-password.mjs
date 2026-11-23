// Read a new password privately from stdin, output a salted scrypt hash (never the password).
import {randomBytes,scryptSync} from 'node:crypto';
let input='';for await(const chunk of process.stdin)input+=chunk;
const password=input.replace(/[\r\n]+$/,'');if(password.length<14||password.length>256)throw Error('Use a password of 14–256 characters.');
const salt=randomBytes(16).toString('hex');console.log('scrypt:'+salt+':'+scryptSync(password,salt,64).toString('hex'));
