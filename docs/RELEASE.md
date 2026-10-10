# GitHub 首发

当前版本：**v0.1.0**。

## 上传源码

1. 解压 `CanvasNote-v0.1.0-Source.zip`。
2. 在 GitHub 新建自己的仓库。
3. 将 `CanvasNote/` 文件夹内的内容放到仓库根目录，包含 `.github/`、`.gitignore` 和 `.nvmrc`。不要把 `node_modules/`、`release/`、`dist/` 或个人笔记上传。
4. 代码推送后，Actions 会执行测试和网页构建。配置已附上，首次 GitHub 运行结果需在仓库中查看。

可用的仓库简介：

> Local canvas notebook for visual notes, study materials, and sketches. Windows and web.

## 创建 Release

在仓库的 Releases 中选择 Draft a new release，使用标签 `v0.1.0`。上传 `CanvasNote-v0.1.0-Windows-x64.zip` 作为下载附件。

GitHub 会为标签提供源码下载；本次另附的源码 ZIP 也可以作为附件。发布前先在 Windows 和常用平板上完成实机验收，具体范围见 [VALIDATION.md](VALIDATION.md)。

参考：[GitHub 官方 Release 说明](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository)。

## 可直接使用的发布文案

### CanvasNote v0.1.0

CanvasNote 是一款本地画布笔记软件，可用于学习资料整理、视觉笔记和草稿。

第一版包含：

- 空白无限画布、画笔、橡皮擦、便签、文字、形状和图片。
- 工具栏内撤销与重做，双箭头收起，底部、左侧、右侧位置可选。
- 一键清空当前画布，支持撤销恢复。
- 本机自动保存、单个可编辑项目文件和 PNG 导出。
- PDF 单页导入、深浅色与自定义背景。

Windows 用户完整解压便携包后运行 CanvasNote.exe。平板用户使用部署后的网页版，操作说明在 Help 中。

本版没有云同步、多人协作、压感或掌触拒绝。跨设备使用时请导出并导入 .canvasnote 文件。

欢迎反馈设备、浏览器和可复现步骤。
