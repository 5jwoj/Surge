/**
 * Gemini 节点检测 - Surge 面板版
 * 
 * @author 5jwoj
 * @version 1.0.3
 * @description Surge 面板专用的 Gemini 节点检测脚本
 */

!(async () => {
    const SCRIPT_NAME = "Gemini检测";
    const TEST_URL = "https://generativelanguage.googleapis.com/v1/models";
    const TIMEOUT = 5; // 秒

    try {
        console.log(`[${SCRIPT_NAME}] 开始检测...`);

        const startTime = Date.now();

        // 发起请求
        const response = await $httpClient.get({
            url: TEST_URL,
            timeout: TIMEOUT,
            headers: {
                "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15"
            }
        });

        const latency = Date.now() - startTime;
        console.log(`[${SCRIPT_NAME}] 响应状态: ${response.status}, 延迟: ${latency}ms`);

        // 检查响应状态
        if (response.status === 200 || response.status === 403) {
            // 200 = 成功, 403 = API需要密钥但网络可达
            $done({
                title: "✅ Gemini 可访问",
                content: `延迟: ${latency}ms\n状态: ${response.status}`,
                icon: "checkmark.circle.fill",
                "icon-color": "#34C759"
            });
        } else {
            $done({
                title: "⚠️ 响应异常",
                content: `状态码: ${response.status}\n延迟: ${latency}ms`,
                icon: "exclamationmark.triangle.fill",
                "icon-color": "#FF9500"
            });
        }

    } catch (error) {
        console.log(`[${SCRIPT_NAME}] 错误: ${error}`);

        // 判断错误类型
        let errorMsg = "网络错误";
        if (error.toString().includes("timeout")) {
            errorMsg = "连接超时";
        } else if (error.toString().includes("connection")) {
            errorMsg = "连接失败";
        }

        $done({
            title: "❌ Gemini 不可访问",
            content: errorMsg + "\n请切换其他节点",
            icon: "xmark.circle.fill",
            "icon-color": "#FF3B30"
        });
    }
})();
