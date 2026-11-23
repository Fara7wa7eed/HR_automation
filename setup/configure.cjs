// Run after editing setup/config.json. Rewrites only generated workflow settings.
const fs=require('fs'),path=require('path');const root=path.resolve(__dirname,'..');
const conf=JSON.parse(fs.readFileSync(path.join(__dirname,'config.json')));
const refsPath=path.join(__dirname,'credential-ids.json');const refs=fs.existsSync(refsPath)?JSON.parse(fs.readFileSync(refsPath)):{};
let all=[];for(const file of fs.readdirSync(path.join(root,'workflows')).filter(f=>/^\d.*\.json$/.test(f))){let w=JSON.parse(fs.readFileSync(path.join(root,'workflows',file)));for(const n of w.nodes){
 if(n.name==='Configuration')n.parameters.jsonOutput='={{ { ...$json, config: '+JSON.stringify(conf)+' } }}';
 if(n.type==='n8n-nodes-base.webhook')n.parameters.options.allowedOrigins=conf.portalOrigin;
 const p=n.parameters;if(p.documentId){let previous=p.documentId.value;if(previous==='CONFIGURE_JOBS_SHEET_ID'||p.sheetName?.value===conf.jobsTab)p.documentId.value=conf.jobsSheetId;if(previous==='CONFIGURE_CANDIDATES_SHEET_ID'||p.sheetName?.value===conf.candidatesTab)p.documentId.value=conf.candidatesSheetId;if(['Employees','Leave Requests'].includes(p.sheetName?.value))p.documentId.value=conf.leaveSheetId;}
 if(n.name==='Create job CV folder')p.folderId.value=conf.cvRootFolderId;
 for(const [type,c]of Object.entries(n.credentials||{}))if(refs[type])c.id=refs[type];
 }fs.writeFileSync(path.join(root,'workflows',file),JSON.stringify(w,null,2));all.push(w);}fs.writeFileSync(path.join(root,'workflows/all-workflows.json'),JSON.stringify(all,null,2));console.log('Configured '+all.length+' workflow files. Credential IDs contain references only.');
