# Gemini 节点可用性检测器

> 快速检测代理节点是否能正常访问 Google Gemini AI，避免"地区未开通"和"网络异常"问题

![Version](https://img.shields.io/badge/version-1.0.2-blue.svg)
![Platform](https://img.shields.io/badge/platform-Surge%20%7C%20QuantumultX-orange.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## ✨ 功能特性

- ✅ **单节点检测** - 快速测试当前节点是否可用
- 🔍 **批量检测** - 自动测试策略组所有节点，找出可用节点
- ⚡ **智能切换** - 自动切换到延迟最低的可用节点
- 📊 **详细报告** - 显示每个节点的可用性和响应延迟
- 💾 **历史记录** - 保存可用节点列表，方便快速切换
- 📱 **通知提醒** - 实时推送检测结果到通知中心

## 🎯 应用场景

### 痛点
使用机场代理访问 Gemini 时，经常遇到：
- ❌ "This service is not available in your country"
- ❌ "所在地区未开通此服务"
- ❌ "Network error" / "网络异常"
- ❌ 明明是美国/新加坡/日本节点，却无法访问

### 解决方案
本工具可以：
1. 快速检测当前节点是否支持 Gemini
2. 批量测试所有节点，筛选出可用节点
3. 自动切换到最优节点，省去手动尝试的麻烦

## 📦 安装方法

### Surge 用户

#### 方法一：通过 URL 安装（推荐）
1. 打开 Surge
2. 进入 `模块` → `安装新模块`
3. 粘贴以下 URL：
   ```
   https://raw.githubusercontent.com/5jwoj/Surge/main/gemini-checker-v2/Surge/gemini-checker.sgmodule
   ```
4. 点击确定安装

#### 方法二：本地安装
1. 下载 `Surge/gemini-checker.sgmodule` 文件
2. 在 Surge 中选择 `模块` → `从文件安装`
3. 选择下载的文件

### Quan X 用户

#### 方法一：添加重写
1. 打开 Quan X 配置文件
2. 在 `[rewrite_remote]` 部分添加：
   ```
   https://raw.githubusercontent.com/5jwoj/Surge/main/gemini-checker-v2/QuantumultX/gemini-checker.conf, tag=Gemini检测器, update-interval=86400, opt-parser=false, enabled=true
   ```
3. 重新载入配置

#### 方法二：添加定时任务
1. 在 `[task_local]` 部分添加：
   ```
   0 9 * * * https://raw.githubusercontent.com/5jwoj/Surge/main/gemini-checker-v2/gemini-checker.js, tag=Gemini节点检测, enabled=true
   ```
2. 重新载入配置

## 📖 使用指南

### Surge 使用方法

#### 1. 检测当前节点
- 在 Surge 面板中找到 **"Gemini 检测器"**
- 点击面板图标，即可检测当前节点
- 查看通知中心的检测结果

#### 2. 批量检测所有节点
通过快捷指令或脚本触发器运行：
```javascript
$surge.setSelectGroupPolicy("Proxy", "自动选择");
// 运行批量检测脚本
```

或者在终端中执行：
```bash
# 使用 surge-cli（需要先安装）
surge-cli execute gemini-checker-all
```

### Quan X 使用方法

#### 1. 检测当前节点
创建一个 Shortcuts 快捷指令：
1. 打开 Shortcuts 应用
2. 创建新快捷指令
3. 添加 "URL" 操作：`http://gemini-check.local/current`
4. 添加 "Get Contents of URL" 操作
5. 命名为 "检测 Gemini"
6. 在快捷指令中运行即可

#### 2. 批量检测所有节点
同上，但 URL 改为：`http://gemini-check.local/all`

#### 3. 定时检测
在配置文件中已添加定时任务（默认关闭）：
```
0 9 * * * gemini-checker.js, tag=Gemini节点检测, enabled=false
```
将 `enabled=false` 改为 `enabled=true` 即可启用每天早上 9 点自动检测

## ⚙️ 配置选项

在脚本中可以修改以下配置（位于 `CONFIG` 对象）：

```javascript
const CONFIG = {
    timeout: 10000,           // 超时时间（毫秒），默认 10 秒
    policyGroup: "Proxy",     // 策略组名称，改为你的策略组名
    checkMode: "current",     // 检测模式: current / all
    storageKey: "gemini_available_nodes"  // 存储键名
};
```

### 常见策略组名称
- Surge: `Proxy`, `国外流量`, `Global` 等
- Quan X: `Proxy`, `节点选择`, `全球加速` 等

## 📊 检测原理

### 测试端点
脚本会依次测试以下 Gemini 相关端点：
1. `https://gemini.google.com` - Gemini 官网
2. `https://generativelanguage.googleapis.com/v1beta/models` - Gemini API
3. `https://aistudio.google.com` - Google AI Studio

### 判断标准
- ✅ **可用**：能成功访问任一端点，且无地区限制提示
- ❌ **不可用**：
  - 无法连接到任何端点
  - 返回地区限制提示
  - 连接超时（>10秒）

### 优化建议
- 响应延迟 < 500ms：优秀
- 响应延迟 500-1000ms：良好
- 响应延迟 > 1000ms：较慢，建议更换节点

## 🔔 通知示例

### 当前节点可用
```
✅ Gemini 可访问
当前节点正常
延迟: 342ms
```

### 当前节点不可用
```
❌ Gemini 不可访问
无法访问 Gemini（地区限制或网络异常）
请尝试切换节点或运行批量检测
```

### 批量检测完成
```
📊 检测完成 (15 个节点)
✅ 可用: 5 | ❌ 不可用: 10

🎯 可用节点列表:
1. 美国-洛杉矶-01 (342ms)
2. 新加坡-SG-03 (456ms)
3. 日本-东京-02 (523ms)
4. 美国-纽约-05 (612ms)
5. 台湾-TW-01 (734ms)

✨ 已自动切换到: 美国-洛杉矶-01
```

## 🎨 高级用法

### 1. 配合 Shortcuts 自动化
创建 iOS 自动化规则：
- 触发条件：打开 ChatGPT/Gemini 应用
- 操作：运行检测快捷指令
- 效果：自动确保使用可用节点

### 2. 配合 Surge 面板
在 Surge 配置中添加更多面板：
```ini
[Panel]
gemini-status = script-name=gemini-checker-current, title="Gemini", content="点击检测", update-interval=-1
```

### 3. 定期自动检测
在 Quan X 中启用定时任务，每天定时检测并自动切换节点

### 4. 集成到其他脚本
在其他脚本中调用：
```javascript
// 在访问 Gemini 前先检测
$httpClient.get("http://gemini-check.local/current", (error, response, data) => {
    // 继续执行主逻辑
});
```

## 🛠️ 故障排除

### 问题 1：批量检测时无法切换节点
**原因**：Quan X 不支持自动切换策略组  
**解决**：
- 使用 Surge（支持 API 切换）
- 或者手动根据检测结果切换节点

### 问题 2：所有节点都显示不可用
**可能原因**：
1. 机场本身被 Google 封禁
2. 节点 IP 被污染
3. 超时时间设置过短

**解决方法**：
- 尝试增加 `timeout` 配置
- 联系机场客服确认节点状态
- 更换其他机场

### 问题 3：检测显示可用，但实际仍无法访问
**原因**：Gemini 的访问策略可能发生变化  
**解决**：
- 清除浏览器缓存和 Cookie
- 尝试无痕模式访问
- 检查是否需要登录 Google 账号

### 问题 4：通知没有显示
**检查**：
- Surge/Quan X 是否允许通知权限
- iOS 系统通知设置是否开启
- 是否在免打扰模式

## 📝 更新日志

### v1.0.0 (2026-02-12)
- 🎉 首次发布
- ✅ 支持 Surge 和 Quan X
- ✅ 单节点和批量检测功能
- ✅ 自动切换最优节点
- ✅ 可用节点历史记录

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

### 开发建议
1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

## 💬 联系方式

- GitHub: [@5jwoj](https://github.com/5jwoj)
- Issues: [提交问题](https://github.com/5jwoj/Surge/issues)

## 🌟 致谢

- 感谢 Surge 和 Quan X 提供强大的脚本支持
- 感谢社区贡献的各类工具和脚本

---

**免责声明**: 本工具仅供学习交流使用，请遵守相关法律法规。使用本工具产生的任何问题，作者不承担责任。

**提示**: 如果本工具对你有帮助，欢迎 ⭐ Star 本项目！
