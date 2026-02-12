/**
 * Gemini 节点检测 - Surge 面板版
 * 
 * @author 5jwoj
 * @version 1.0.6
 * @description Surge 面板专用的 Gemini 节点检测脚本（显示节点信息）
 */

const SCRIPT_NAME = "Gemini检测";
const TEST_URL = "https://generativelanguage.googleapis.com/v1/models";
const TIMEOUT = 10; // 秒

console.log(`[${SCRIPT_NAME}] 开始检测...`);
console.log(`[${SCRIPT_NAME}] 测试URL: ${TEST_URL}`);

// 获取当前出站信息
let outboundInfo = "";
try {
    if (typeof $surge !== "undefined") {
        const outbound = $surge.outbound || "未知";
        outboundInfo = `\n出站: ${outbound}`;
        console.log(`[${SCRIPT_NAME}] 当前出站: ${outbound}`);
    }
} catch (e) {
    console.log(`[${SCRIPT_NAME}] 无法获取出站信息: ${e}`);
}

const startTime = Date.now();

// Surge 使用回调函数方式，不是 Promise
$httpClient.get({
    url: TEST_URL,
    timeout: TIMEOUT,
    headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15"
    }
}, function (error, response, data) {
    const latency = Date.now() - startTime;

    if (error) {
        console.log(`[${SCRIPT_NAME}] ❌ 请求错误: ${error}`);

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
        } else {
            errorDetail = error.substring(0, 30);
        }

        $done({
            title: "❌ Gemini 不可访问",
            content: `${errorMsg}\n${errorDetail}${outboundInfo}\n请切换其他节点`,
            icon: "xmark.circle.fill",
            "icon-color": "#FF3B30"
        });

    } else {
        const status = response.status || response.statusCode;
        console.log(`[${SCRIPT_NAME}] ✅ 响应状态: ${status}, 延迟: ${latency}ms`);

        // 检查响应状态
        if (status === 200 || status === 403) {
            // 200 = 成功访问
            // 403 = API需要密钥，但网络可达（说明节点支持Gemini）
            const statusText = status === 200 ? "API正常" : "网络可达";

            console.log(`[${SCRIPT_NAME}] ✅ 检测成功 - ${statusText}`);

            $done({
                title: "✅ Gemini 可访问",
                content: `延迟: ${latency}ms\n状态: ${status} (${statusText})${outboundInfo}`,
                icon: "checkmark.circle.fill",
                "icon-color": "#34C759"
            });

        } else if (status >= 500) {
            // 服务器错误
            console.log(`[${SCRIPT_NAME}] ⚠️ 服务器错误`);

            $done({
                title: "⚠️ 服务器错误",
                content: `状态码: ${status}\n延迟: ${latency}ms${outboundInfo}\nGoogle服务异常`,
                icon: "exclamationmark.triangle.fill",
                "icon-color": "#FF9500"
            });

        } else {
            // 其他状态码
            console.log(`[${SCRIPT_NAME}] ⚠️ 响应异常`);

            $done({
                title: "⚠️ 响应异常",
                content: `状态码: ${status}\n延迟: ${latency}ms${outboundInfo}\n可能存在地区限制`,
                icon: "exclamationmark.triangle.fill",
                "icon-color": "#FF9500"
            });
        }
    }
});
