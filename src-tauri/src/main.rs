#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use std::{fs,io::Write,path::Path,sync::atomic::{AtomicBool,Ordering}};
use tauri::{Manager,State};
use tauri_plugin_dialog::{DialogExt,FilePath,MessageDialogButtons};
#[derive(serde::Serialize)] struct Opened { data: Vec<u8>, path: String }
fn atomic_write(path: &Path, data: &[u8]) -> Result<(), String> {
    let tmp=path.with_file_name(format!(".{}.{}.tmp",path.file_name().unwrap().to_string_lossy(),uuid::Uuid::new_v4()));
    let result=(|| {let mut f=fs::OpenOptions::new().write(true).create_new(true).open(&tmp)?;f.write_all(data)?;f.sync_all()?;drop(f);
        if path.exists(){let bak=path.with_file_name(format!("{}.bak",path.file_name().unwrap().to_string_lossy()));fs::copy(path,bak)?;}
        fs::rename(&tmp,path)
    })();
    if let Err(e)=result{let _=fs::remove_file(&tmp);return Err(e.to_string());}Ok(())
}
#[tauri::command] async fn project_open(app: tauri::AppHandle)->Result<Option<Opened>,String>{
    tauri::async_runtime::spawn_blocking(move||{let picked=app.dialog().file().add_filter("CanvasNote",&["canvasnote"]).blocking_pick_file();
        if let Some(FilePath::Path(path))=picked{if fs::metadata(&path).map_err(|e|e.to_string())?.len()>104857600{return Err("文件超过100MB".into());}
            Ok(Some(Opened{data:fs::read(&path).map_err(|e|e.to_string())?,path:path.to_string_lossy().to_string()}))}else{Ok(None)}
    }).await.map_err(|e|e.to_string())?
}
#[tauri::command] async fn project_save(app: tauri::AppHandle,data:Vec<u8>,name:String,exporting:bool)->Result<Option<String>,String>{
    if data.len()>104857600{return Err("文件超过100MB".into());}
    tauri::async_runtime::spawn_blocking(move||{let extension=if exporting{"png"}else{"canvasnote"};let name:String=name.chars().filter(|c|!"\\/:*?\"<>|".contains(*c)).take(100).collect();
        let picked=app.dialog().file().set_file_name(name).add_filter("CanvasNote",&[extension]).blocking_save_file();
        if let Some(FilePath::Path(path))=picked{atomic_write(&path,&data)?;Ok(Some(path.to_string_lossy().to_string()))}else{Ok(None)}
    }).await.map_err(|e|e.to_string())?
}
#[tauri::command] fn project_dirty(value:bool,state:State<'_,AtomicBool>){state.store(value,Ordering::SeqCst);}
fn main(){tauri::Builder::default().plugin(tauri_plugin_dialog::init()).manage(AtomicBool::new(false)).invoke_handler(tauri::generate_handler![project_open,project_save,project_dirty]).on_window_event(|window,event|{
    if let tauri::WindowEvent::CloseRequested{api,..}=event{if window.state::<AtomicBool>().load(Ordering::SeqCst){api.prevent_close();let app=window.app_handle().clone();window.dialog().message("还有未保存的更改，是否直接退出？").title("CanvasNote").buttons(MessageDialogButtons::YesNoCustom("直接退出".into(),"返回画布".into())).show(move|exit|{if exit{app.exit(0);}});}}
}).run(tauri::generate_context!()).expect("failed to launch CanvasNote");}
