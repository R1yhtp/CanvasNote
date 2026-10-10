const fs=require('node:fs/promises');
const path=require('node:path');
const crypto=require('node:crypto');
async function atomicWrite(target,bytes){const temp=path.join(path.dirname(target),'.'+path.basename(target)+'.'+crypto.randomUUID()+'.tmp');try{const f=await fs.open(temp,'wx');try{await f.writeFile(bytes);await f.sync();}finally{await f.close();}try{await fs.copyFile(target,target+'.bak');}catch(e){if(e.code!=='ENOENT')throw e;}await fs.rename(temp,target);}catch(e){await fs.unlink(temp).catch(()=>{});throw e;}}
module.exports={atomicWrite};
