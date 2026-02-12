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

    let startTime; // Declare startTime outside try-catch for catch block access

    try {
        console.log(`[${SCRIPT_NAME}] 开始检测...`);
        console.log(`[${SCRIPT_NAME}] 测试URL: ${TEST_URL}`);
        console.log(`[${SCRIPT_NAME}] 超时设置: ${TIMEOUT}秒`);

        startTime = Date.now();

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
        console.log(`[${SCRIPT_NAME}] 响应头: ${JSON.stringify(response.headers)}`);

        // 检查响应状态
        if (response.status === 200 || response.status === 403) {
            // 200 = 成功, 403 = API需要密钥但网络可达
            console.log(`[${SCRIPT_NAME}] ✅ 检测成功`);
            $done({
                title: "✅ Gemini 可访问",
                content: `延迟: ${latency}ms\n状态: ${response.status}`,
                icon: "checkmark.circle.fill",
                "icon-color": "#34C759"
            });
        } else {
            console.log(`[${SCRIPT_NAME}] ⚠️ 响应状态异常`);
            $done({
                title: "⚠️ 响应异常",
                content: `状态码: ${response.status}\n延迟: ${latency}ms`,
                icon: "exclamationmark.triangle.fill",
                "icon-color": "#FF9500"
            });
        }

    } catch (error) {
        const latency = startTime ? Date.now() - startTime : 'N/A'; // Calculate latency if startTime is set
        console.log(`[${SCRIPT_NAME}] ❌ 错误: ${error}`);
        console.log(`[${SCRIPT_NAME}] 错误类型: ${typeof error}`);
        console.log(`[${SCRIPT_NAME}] 错误详情: ${JSON.stringify(error)}`);

        // 判断错误类型
        let errorMsg = "网络错误";
        let errorDetail = "";

        const errorStr = error.toString().toLowerCase();

        if (errorStr.includes("timeout") || errorStr.includes("timed out")) {
            errorMsg = "连接超时";
            errorDetail = `超过${TIMEOUT}秒未响应`;
        } else if (errorStr.includes("connection") || errorStr.includes("connect")) {
            errorMsg = "连接失败";
            errorDetail = "无法建立连接";
        } else if (errorStr.includes("dns") || errorStr.includes("resolve")) {
            errorMsg = "DNS解析失败";
            errorDetail = "无法解析域名";
        } else if (errorStr.includes("ssl") || errorStr.includes("certificate")) {
            errorMsg = "SSL证书错误";
            errorDetail = "证书验证失败";
        } else {
            errorDetail = error.message || error.toString().substring(0, 30);
        }

        $done({
            title: "❌ Gemini 不可访问",
            content: `${errorMsg}\n${errorDetail}\n请切换其他节点`,
            icon: "xmark.circle.fill",
            "icon-color": "#FF3B30"
        });
    }
})();
