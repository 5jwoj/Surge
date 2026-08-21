# X (Twitter) 网页版去广告

移除网页版 X (Twitter) 广告，包括时间线推荐信息流广告、正在关注页面广告以及推文详情评论区的推广内容。

## 📌 功能特性

- 🎯 **信息流去广告**：移除「为你推荐」(HomeTimeline) 与「正在关注」(HomeLatestTimeline) 中的 Promoted 广告推文
- 💬 **推文详情去广告**：移除推文评论区与关联推荐中的推广内容
- ⚡ **高性能无依赖**：专为 Loon 及 Surge 优化，无多余冗余代码，执行迅速

---

## 📥 安装使用

### 1. Loon 插件安装

在 Loon 中点击下方链接一键导入，或在「配置」->「插件」中点击右上角「+」粘贴以下地址：

```text
https://raw.githubusercontent.com/5jwoj/Surge/main/X/X_ads.plugin
```

> **注意**：使用前请确保在 Loon 中启用了 **MITM**，并已正确生成并信任证书。需在 MITM 中包含主机名 `x.com`。

### 2. Surge 模块安装

在 Surge 中点击「模块」->「安装新模块」-> 粘贴以下地址：

```text
https://raw.githubusercontent.com/5jwoj/Surge/main/X/X_ads.sgmodule
```

---

## 📂 文件说明

- `X_ads.js`：核心广告过滤重写脚本 (v1.0.0)
- `X_ads.plugin`：Loon 专用插件配置文件
- `X_ads.sgmodule`：Surge 模块配置文件
