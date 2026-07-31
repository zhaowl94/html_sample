# HTML Sample

一个无需前端框架或运行时构建即可使用的静态学习示例集。仓库包含三个独立练习，重点覆盖语义化 HTML、响应式 CSS、无障碍、表单交互与自动化浏览器测试。

An accessible collection of framework-free HTML and CSS exercises. Every published page works when opened directly, served locally, or deployed below a GitHub Pages project path.

在线入口：[https://zhaowl94.github.io/html_sample/](https://zhaowl94.github.io/html_sample/)

## 示例

| 入口                                                           | 内容                          | 重点                              |
| -------------------------------------------------------------- | ----------------------------- | --------------------------------- |
| [`Html5-Final-Project.html`](Html5-Final-Project.html)         | Learning Profile 单页练习     | 语义结构、列表、进度条、`details` |
| [`assignment-1 2/index.html`](assignment-1%202/index.html)     | Ultimate Field Notes 三页站点 | 响应式导航、布局、时间线、表格    |
| [`styles-conference/index.html`](styles-conference/index.html) | Signal Conference 五页站点    | 编辑型布局、表单、浏览器端校验    |

所有旧页面路径均继续有效。根目录新增 `index.html` 作为统一入口。

## 运行方式

页面没有构建依赖，可以直接双击任意 HTML 文件。若希望通过本地 HTTP 服务器查看：

```powershell
python -m http.server 8000
```

安装测试工具需要 Node.js 24 LTS：

```powershell
npm.cmd ci
npm.cmd run serve
```

PowerShell 若允许执行 `npm.ps1`，也可将 `npm.cmd` 写成 `npm`。仓库不会修改 Windows 执行策略、环境变量或全局 Git 配置，也不要求全局安装任何 npm 工具。

## 测试

```powershell
# 格式、HTML、CSS、JavaScript、本地链接和兼容路径
npm.cmd run check

# Node 单元测试
npm.cmd run test:unit

# Windows 浏览器矩阵
npm.cmd run test:e2e:windows

# 全部本地浏览器项目
npm.cmd run test:e2e

# Lighthouse 性能与质量门槛
npm.cmd run test:lighthouse
```

`test/` 包含：

- 10 个页面的加载与导航测试；
- Chromium、Chrome、Edge、Firefox、WebKit 和移动端视口覆盖；
- Axe WCAG 自动化扫描；
- 键盘、表单、零网络提交和零浏览器存储验证；
- 直接使用 `file://` 打开页面的兼容测试；
- 桌面、移动、浅色和深色截图基线；
- HTML/CSS 语法、本地链接、大小写和 500 KB 初始资源预算检查；
- Windows Edge 的高对比度和 200% 缩放自动验证，以及 Narrator 手动复核限制记录。

完整测试说明见 [`test/README.md`](test/README.md)。

## 设计边界

- 页面运行时不加载 CDN、远程字体、第三方脚本或统计服务。
- Signal 报名表单不发送请求、不设置 Cookie，也不使用 `localStorage` 或 `sessionStorage`。
- 关键页面初始本地资源不超过 500 KB。
- 支持系统浅色、深色、减少动画和强制颜色偏好。
- 正式兼容现代 Edge、Chrome、Firefox 与 Safari；不支持 Internet Explorer。
- HTML 结构直接保留在每个页面中，不依赖 JavaScript 注入或模板构建。

## 项目结构

```text
.
├── index.html                       # 示例导航
├── Html5-Final-Project.html         # Learning Profile
├── assets/                          # 根页面样式和社交预览
├── assignment-1 2/                  # Ultimate Field Notes
├── styles-conference/               # Signal Conference
├── scripts/                         # GitHub Pages 静态发布构建
├── test/                            # 全部自动化和人工测试材料
└── .github/                         # CI、Pages 和依赖维护
```

## 隐私与许可

页面只展示 GitHub 用户名 `zhaowl94`，不收集个人信息。原课程练习中的文字、人物照片和远程素材已由原创内容替换。

本次原创代码和内容采用 [MIT License](LICENSE)。学习来源、事实来源、生成图像及保留的历史练习文件边界见 [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md)。

## Contributing

修改说明、测试门禁和截图更新流程见 [`CONTRIBUTING.md`](CONTRIBUTING.md)。
