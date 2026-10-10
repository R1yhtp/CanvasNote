const {app,BrowserWindow,dialog,ipcMain}=require('electron');
const path=require('node:path');
const fs=require('node:fs/promises');
const {atomicWrite}=require('./files.cjs');
let win,dirty=false,closing=false;
app.commandLine.appendSwitch('lang','zh-CN');
const safeName=name=>typeof name==='string'?name.replace(/[\\/:*?"<>|]/g,'_').slice(0,100):'CanvasNote';
function checkData(data){if(!Array.isArray(data)||data.length>105*1024*1024||data.some(x=>!Number.isInteger(x)||x<0||x>255))throw Error('文件数据无效或超过100MB');return Buffer.from(data);}
function trusted(event){if(!win||event.sender!==win.webContents)throw Error('请求来源无效');}
ipcMain.handle('project:open',async event=>{trusted(event);const r=await dialog.showOpenDialog(win,{title:'打开 CanvasNote 项目',properties:['openFile'],filters:[{name:'CanvasNote 项目',extensions:['canvasnote']}]});if(r.canceled)return null;const file=r.filePaths[0];if((await fs.stat(file)).size>100*1024*1024)throw Error('文件超过100MB');return {data:Array.from(await fs.readFile(file)),path:file};});
async function save(event,data,name,exporting){trusted(event);const bytes=checkData(data),ext=exporting?'png':'canvasnote',r=await dialog.showSaveDialog(win,{title:exporting?'导出 PNG':'保存 CanvasNote 项目',defaultPath:safeName(name),filters:[{name:exporting?'PNG 图片':'CanvasNote 项目',extensions:[ext]}]});if(r.canceled||!r.filePath)return null;await atomicWrite(r.filePath,bytes);return r.filePath;}
ipcMain.handle('project:save',(event,data,name)=>save(event,data,name,false));ipcMain.handle('image:export',(event,data,name)=>save(event,data,name,true));
ipcMain.on('project:dirty',(event,value)=>{trusted(event);dirty=Boolean(value);});
app.whenReady().then(()=>{win=new BrowserWindow({width:1280,height:850,minWidth:680,minHeight:480,title:'CanvasNote',backgroundColor:'#f6f7f9',icon:path.join(__dirname,'../icon.png'),autoHideMenuBar:true,webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,sandbox:true,nodeIntegration:false}});win.webContents.setWindowOpenHandler(()=>({action:'deny'}));win.webContents.on('will-navigate',e=>e.preventDefault());win.webContents.session.setPermissionRequestHandler((_web,_permission,callback)=>callback(false));win.loadFile(path.join(__dirname,'../dist/index.html'));win.on('close',event=>{if(!dirty||closing)return;event.preventDefault();dialog.showMessageBox(win,{type:'question',title:'保存尚未完成',message:'本机保存还没有完成。',detail:'返回画布等待保存完成，或导出项目文件。',buttons:['返回画布','直接退出'],defaultId:0,cancelId:0}).then(r=>{if(r.response===1){closing=true;win.destroy();app.quit();}});});});
app.on('window-all-closed',()=>app.quit());
