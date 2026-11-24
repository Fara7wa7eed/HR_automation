/** BrightPath Forms setup and trusted relay. No secrets belong in this source file. */
const BP_HEADERS={
 jobs:['Job ID','Job title','Department','Required skills','Nice-to-have skills','Minimum experience','Description','Status','Apply link','Referral link','Created date','CV folder ID','Request ID','Close reason'],
 candidates:['Application ID','Job ID','Candidate name','Email','Phone','Source','Referrer name','Referrer email','Skills','Years of experience','Education','Current/last job','Languages','Score','Score reason','Priority','CV link','Application date','Notification status','AI extracted name','AI extracted email','AI extracted phone','Scoring evidence'],
 queue:['Event ID','Form ID','Type','State','Attempts','Last attempt','Result','Created']
};
function bpProps(){return PropertiesService.getScriptProperties();}
function bpConfig(){const raw=bpProps().getProperty('BPATH_CONFIG');if(!raw)throw Error('Run bootstrap first');return JSON.parse(raw);}
function bpSheet(name,headers){const ss=SpreadsheetApp.create(name),s=ss.getSheets()[0];s.setName(name);s.getRange(1,1,1,headers.length).setValues([headers]).setBackground('#101b33').setFontColor('#ffffff').setFontWeight('bold');s.setFrozenRows(1);s.autoResizeColumns(1,headers.length);return ss;}
function bpText(form,title,required=true,paragraph=false){return (paragraph?form.addParagraphTextItem():form.addTextItem()).setTitle(title).setRequired(required);}
function bpCandidateForm(name,isReferral){const form=FormApp.create(name).setDescription('BrightPath job applications. Upload a PDF CV, maximum 10 MB. Submitting does not guarantee an interview.');bpText(form,'Full name');bpText(form,'Email');bpText(form,'Phone number');bpText(form,'Job ID');if(isReferral){form.setCollectEmail(true);bpText(form,'Referrer name');bpText(form,'Referrer email');}return form;}
function bootstrap(){
 const p=bpProps();if(p.getProperty('BPATH_CONFIG')){console.log(JSON.stringify(bpConfig(),null,2));return;}
 const jobs=bpSheet('Job Openings',BP_HEADERS.jobs),candidates=bpSheet('Candidates',BP_HEADERS.candidates);
 const queue=candidates.insertSheet('Automation Queue');queue.getRange(1,1,1,BP_HEADERS.queue.length).setValues([BP_HEADERS.queue]).setBackground('#741f3d').setFontColor('#ffffff').setFontWeight('bold');queue.setFrozenRows(1);
 const folder=DriveApp.createFolder('BrightPath CVs');
 const app=bpCandidateForm('BrightPath · Application',false),ref=bpCandidateForm('BrightPath · Employee Referral',true);
 const management=FormApp.create('BrightPath · Position Management').setCollectEmail(true).setDescription('For authorized HR staff only.');
 const action=management.addMultipleChoiceItem().setTitle('Action').setRequired(true);
 const open=management.addPageBreakItem().setTitle('Open a new position');
 bpText(management,'Job title');bpText(management,'Department');bpText(management,'Required skills',true,true);bpText(management,'Nice-to-have skills',false,true);bpText(management,'Minimum years of experience');bpText(management,'Short description',true,true);
 const close=management.addPageBreakItem().setTitle('Close a position');
 close.setGoToPage(FormApp.PageNavigationType.SUBMIT); // End of the preceding Open section.
 bpText(management,'Job ID');bpText(management,'Reason',false,true);
 action.setChoices([action.createChoice('Open a new position',open),action.createChoice('Close a position',close)]);
 const c={jobsSheetId:jobs.getId(),jobsTab:'Job Openings',candidatesSheetId:candidates.getId(),candidatesTab:'Candidates',cvRootFolderId:folder.getId(),applicationFormId:app.getId(),referralFormId:ref.getId(),managementFormId:management.getId(),applicationFormUrl:app.getPublishedUrl(),referralFormUrl:ref.getPublishedUrl(),positionManagementFormUrl:management.getPublishedUrl(),applicationFormEditUrl:app.getEditUrl(),referralFormEditUrl:ref.getEditUrl(),managementFormEditUrl:management.getEditUrl()};
 p.setProperty('BPATH_CONFIG',JSON.stringify(c));console.log(JSON.stringify(c,null,2));
 console.log('NEXT: add the CV upload questions, verify collected-email settings, set private Script Properties, then run finalizeSetup.');
}
function bpEntry(form){const item=form.getItems(FormApp.ItemType.TEXT).map(x=>x.asTextItem()).find(x=>x.getTitle()==='Job ID');if(!item)throw Error('Job ID item missing');let url=form.createResponse().withItemResponse(item.createResponse('JOB-CONFIG')).toPrefilledUrl();let match=url.match(/[?&](entry\.\d+)=/);if(!match)throw Error('Cannot derive Job ID prefill entry');return match[1];}
function bpVerifyIdentityForm(id){
 // A respondent-entered email is not an HR identity. Require Google's VERIFIED setting.
 const response=UrlFetchApp.fetch('https://forms.googleapis.com/v1/forms/'+encodeURIComponent(id),{headers:{Authorization:'Bearer '+ScriptApp.getOAuthToken()},muteHttpExceptions:true});
 if(response.getResponseCode()!==200){let message='Google Forms API request failed';try{message=JSON.parse(response.getContentText()).error?.message||message;}catch{}throw Error('Google Forms API HTTP '+response.getResponseCode()+': '+message);}
 const form=JSON.parse(response.getContentText());if(form.settings?.emailCollectionType!=='VERIFIED')throw Error('Set Collect email addresses to Verified in the HR and referral forms');
}
function finalizeSetup(){
 const c=bpConfig(),p=bpProps();
 for(const id of [c.applicationFormId,c.referralFormId]){const upload=FormApp.openById(id).getItems().find(x=>x.getTitle()==='CV upload');if(!upload||String(upload.getType())!=='FILE_UPLOAD')throw Error('Add a required file upload question titled CV upload to BOTH candidate forms. Restrict to one PDF, max 10 MB.');}
 for(const id of [c.managementFormId,c.referralFormId])bpVerifyIdentityForm(id);
 for(const key of ['N8N_BASE_URL','N8N_WEBHOOK_KEY','HR_ALLOWED_EMAILS','EMPLOYEE_ALLOWED_EMAILS'])if(!p.getProperty(key))throw Error('Set private Script Property '+key);
 if(!/^https:\/\//.test(p.getProperty('N8N_BASE_URL')))throw Error('Apps Script requires a reachable HTTPS n8n base URL');
 c.applicationJobEntry=bpEntry(FormApp.openById(c.applicationFormId));c.referralJobEntry=bpEntry(FormApp.openById(c.referralFormId));p.setProperty('BPATH_CONFIG',JSON.stringify(c));
 const handlers=new Set(ScriptApp.getProjectTriggers().map(t=>t.getHandlerFunction()));
 for(const [id,handler]of [[c.applicationFormId,'onExternalApplication'],[c.referralFormId,'onReferralApplication'],[c.managementFormId,'onPositionRequest']])if(!handlers.has(handler))ScriptApp.newTrigger(handler).forForm(id).onFormSubmit().create();
 if(!handlers.has('retryPending'))ScriptApp.newTrigger('retryPending').timeBased().everyMinutes(5).create();
 console.log(JSON.stringify(c,null,2));console.log('Copy these non-secret IDs/URLs into setup/config.json and portal/config.js, then run configure.cjs.');
}
function bpValues(response){const out={};for(const r of response.getItemResponses())out[r.getItem().getTitle()]=r.getResponse();return out;}
function bpEmail(s){s=String(s||'').trim().toLowerCase();if(!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(s)||/[\r\n]/.test(s))throw Error('Invalid email');return s;}
function bpPayload(response,type,formId){
 const v=bpValues(response),id=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,formId+':'+response.getId()).map(b=>('0'+((b+256)%256).toString(16)).slice(-2)).join('');
 if(type==='leave-review'){bpVerifyIdentityForm(formId);const who=bpEmail(response.getRespondentEmail());const allowed=(bpProps().getProperty('HR_ALLOWED_EMAILS')||'').split(',').map(x=>x.trim().toLowerCase());if(!allowed.includes(who))throw Error('HR respondent is not allowlisted');return {requestId:v['Leave request ID'],decision:v.Decision,reviewer:who};}
 if(type==='positions'){
  bpVerifyIdentityForm(formId);const who=bpEmail(response.getRespondentEmail());
  const allowed=(bpProps().getProperty('HR_ALLOWED_EMAILS')||'').split(',').map(x=>x.trim().toLowerCase());if(!allowed.includes(who))throw Error('HR respondent is not allowlisted');
  return {requestId:id,action:v.Action==='Open a new position'?'Open':v.Action==='Close a position'?'Close':'Invalid',jobId:v['Job ID'],title:v['Job title'],department:v.Department,requiredSkills:v['Required skills'],niceSkills:v['Nice-to-have skills'],minimumExperience:v['Minimum years of experience'],description:v['Short description'],reason:v.Reason};
 }
 let ids=v['CV upload'];if(!Array.isArray(ids)||ids.length!==1)throw Error('Exactly one uploaded CV is required');
 let body={applicationId:id,jobId:v['Job ID'],name:v['Full name'],email:bpEmail(v.Email),phone:v['Phone number'],cvFileId:ids[0]};
 if(type==='referral'){bpVerifyIdentityForm(formId);body.referrerName=v['Referrer name'];body.referrerEmail=bpEmail(response.getRespondentEmail());if(!(bpProps().getProperty('EMPLOYEE_ALLOWED_EMAILS')||'').split(',').map(x=>x.trim().toLowerCase()).includes(body.referrerEmail))throw Error('Verified referrer is not an authorized employee');if(bpEmail(v['Referrer email'])!==body.referrerEmail)throw Error('Referrer email must match verified Google account');}
 return body;
}
function bpQueue(){return SpreadsheetApp.openById(bpConfig().candidatesSheetId).getSheetByName('Automation Queue');}
function bpEnqueue(response,type,formId){const s=bpQueue(),id=response.getId(),last=s.getLastRow();if(last>1&&s.getRange(2,1,last-1,1).createTextFinder(id).matchEntireCell(true).findNext())return;s.appendRow([id,formId,type,'Pending',0,'','',new Date()]);}
function bpProcess(s,row){
 const values=s.getRange(row,1,1,8).getValues()[0];if(values[3]==='Done'||values[3]==='Needs attention')return;
 s.getRange(row,4,1,3).setValues([['Processing',Number(values[4])+1,new Date()]]);SpreadsheetApp.flush();
 try{const response=FormApp.openById(values[1]).getResponse(values[0]),body=bpPayload(response,values[2],values[1]);
  const endpoint=values[2]==='leave-review'?'brightpath-leave-review':values[2]==='positions'?'brightpath-positions':values[2]==='referral'?'brightpath-apply-referral':'brightpath-apply-external';
  const r=UrlFetchApp.fetch(bpProps().getProperty('N8N_BASE_URL').replace(/\/$/,'')+'/webhook/'+endpoint,{method:'post',contentType:'application/json',headers:{'X-BrightPath-Key':bpProps().getProperty('N8N_WEBHOOK_KEY')},payload:JSON.stringify(body),muteHttpExceptions:true});
  let result;try{result=JSON.parse(r.getContentText());}catch{throw Error('Invalid automation response');}
  if(r.getResponseCode()<200||r.getResponseCode()>=300||result.ok!==true)throw Error('Automation HTTP '+r.getResponseCode());
  s.getRange(row,4).setValue('Done');s.getRange(row,7).setValue('Accepted');
 }catch(e){s.getRange(row,4).setValue(Number(values[4])+1>=5?'Needs attention':'Retry');s.getRange(row,7).setValue(String(e.message).replace(/https?:\/\/\S+/g,'[service]').slice(0,180));}
}
function bpSubmit(e,type){if(!e?.response||!e.source)throw Error('This function is called by a Google Forms installable trigger');let lock=LockService.getScriptLock();lock.waitLock(30000);try{const s=bpQueue();bpEnqueue(e.response,type,e.source.getId());const hit=s.getRange(2,1,s.getLastRow()-1,1).createTextFinder(e.response.getId()).matchEntireCell(true).findNext();bpProcess(s,hit.getRow());}finally{lock.releaseLock();}}
function onExternalApplication(e){bpSubmit(e,'external');}
function onReferralApplication(e){bpSubmit(e,'referral');}
function onPositionRequest(e){bpSubmit(e,'positions');}
function retryPending(){const lock=LockService.getScriptLock();if(!lock.tryLock(1000))return;try{const c=bpConfig(),s=bpQueue(),since=new Date(bpProps().getProperty('BPATH_RECOVERY_SINCE')||Date.now()-86400000),forms=[[c.applicationFormId,'external'],[c.referralFormId,'referral'],[c.managementFormId,'positions'],...(c.leaveReviewFormId?[[c.leaveReviewFormId,'leave-review']]:[])];for(const [id,type]of forms)for(const response of FormApp.openById(id).getResponses(since))bpEnqueue(response,type,id);bpProps().setProperty('BPATH_RECOVERY_SINCE',new Date(Date.now()-300000).toISOString());const last=s.getLastRow();if(last<2)return;const rows=s.getRange(2,1,last-1,8).getValues();let count=0;for(let i=0;i<rows.length;i++)if(['Pending','Retry','Processing'].includes(rows[i][3])&&(!rows[i][5]||Date.now()-new Date(rows[i][5]).getTime()>300000)){bpProcess(s,i+2);if(++count>=2)break;}}finally{lock.releaseLock();}}
function recoverMissedResponses(){const c=bpConfig(),lock=LockService.getScriptLock();lock.waitLock(30000);try{for(const [id,type]of [[c.applicationFormId,'external'],[c.referralFormId,'referral'],[c.managementFormId,'positions']])for(const r of FormApp.openById(id).getResponses(new Date(Date.now()-30*86400000)))bpEnqueue(r,type,id);}finally{lock.releaseLock();}console.log('Queued missing responses from the past 30 days. Run retryPending.');}

/** Optional fourth form completes the existing leave workflow with HR review. */
function setupLeaveReview(){
 const c=bpConfig();c.leaveSheetId=c.leaveSheetId||'1xkt1O_iIgjrF5NZjXw21-1SweXUB5jCHgduqkvnho54';
 const ss=SpreadsheetApp.openById(c.leaveSheetId);
 for(const [name,required,extra]of [['Employees',['Employee ID','Used Leave','Remaining Leave'],['Last Leave Request ID']],['Leave Requests',['Request ID','Employee ID','Days Requested','Status'],['Used Before','Used After','Reviewer']]]){
  const s=ss.getSheetByName(name);if(!s)throw Error('Missing leave tab '+name);const headers=s.getRange(1,1,1,s.getLastColumn()).getValues()[0];if(required.some(h=>!headers.includes(h)))throw Error('Unexpected leave headers; review the selected workbook');for(const h of extra)if(!headers.includes(h)){headers.push(h);s.getRange(1,headers.length).setValue(h).setBackground('#101b33').setFontColor('#ffffff').setFontWeight('bold');}
 }
 if(!c.leaveReviewFormId){const f=FormApp.create('BrightPath · Leave Manager Review').setCollectEmail(true).setDescription('Authorized HR reviews only. Check handbook notice requirements, probation, holidays, and manager consent before approval.');bpText(f,'Leave request ID');f.addMultipleChoiceItem().setTitle('Decision').setChoiceValues(['Approve','Reject']).setRequired(true);c.leaveReviewFormId=f.getId();c.leaveReviewFormUrl=f.getPublishedUrl();c.leaveReviewFormEditUrl=f.getEditUrl();bpProps().setProperty('BPATH_CONFIG',JSON.stringify(c));console.log('Set Collect email addresses to Verified and publish: '+f.getEditUrl());}
 console.log(JSON.stringify(c,null,2));
}
function enableLeaveReview(){const c=bpConfig();if(!c.leaveReviewFormId)throw Error('Run setupLeaveReview first');bpVerifyIdentityForm(c.leaveReviewFormId);if(!ScriptApp.getProjectTriggers().some(t=>t.getHandlerFunction()==='onLeaveReview'))ScriptApp.newTrigger('onLeaveReview').forForm(c.leaveReviewFormId).onFormSubmit().create();console.log('Leave review enabled');}
function onLeaveReview(e){bpSubmit(e,'leave-review');}
