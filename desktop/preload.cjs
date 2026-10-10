const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('canvasnote',{open:()=>ipcRenderer.invoke('project:open'),save:(data,name)=>ipcRenderer.invoke('project:save',data,name),exportPNG:(data,name)=>ipcRenderer.invoke('image:export',data,name),dirty:value=>ipcRenderer.send('project:dirty',Boolean(value))});
