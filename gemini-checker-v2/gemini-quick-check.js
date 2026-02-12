/**
 * Gemini 快速检测 - 轻量版
 * 
 * @version 1.0.1
 * @description 快速检测当前节点是否可访问 Gemini（轻量版）
 * 
 * 使用场景：
 * - 打开 Gemini 应用前快速检测
 * - 访问 Gemini 网页前预检查
 * - 集成到其他脚本中
 */

const TEST_URL = "https://gemini.google.com";
const TIMEOUT = 5000;

async function quickCheck() {
    try {
        const start = Date.now();

        const response = await new Promise((resolve, reject) => {
            const options = {
                url: TEST_URL,
                timeout: TIMEOUT,
                headers: {
                    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15"
                }
            };

            if (typeof $httpClient !== "undefined") {
                $httpClient.get(options, (err, resp, data) => {
                    if (err) reject(err);
                    else resolve({ status: resp.status, body: data });
                });
            } else if (typeof $task !== "undefined") {
                $task.fetch(options).then(
                    resp => resolve({ status: resp.statusCode, body: resp.body }),
                    err => reject(err)
                );
            } else {
                reject(new Error("不支持的环境"));
            }
        });

        const latency = Date.now() - start;

        // 检查是否有地区限制
        if (response.body && (
            response.body.includes("not available in your country") ||
            response.body.includes("不在受支持的国家") ||
            response.body.includes("blocked")
        )) {
            return { success: false, message: "地区限制", latency };
        }

        // 状态码 200-499 都认为可访问
        if (response.status >= 200 && response.status < 500) {
            return { success: true, message: "可访问", latency };
        }

        return { success: false, message: "访问异常", latency };

    } catch (error) {
        return { success: false, message: error.message || "网络错误", latency: 0 };
    }
}

// 执行检测
quickCheck().then(result => {
    const icon = result.success ? "✅" : "❌";
    const status = result.success ? "可访问" : "不可访问";
    const msg = result.latency > 0 ? `${result.message} (${result.latency}ms)` : result.message;

    console.log(`[Gemini 快速检测] ${icon} ${status} - ${msg}`);

    if (typeof $notification !== "undefined") {
        $notification.post(
            `${icon} Gemini ${status}`,
            msg,
            result.success ? "当前节点可用" : "建议切换节点"
        );
    } else if (typeof $notify !== "undefined") {
        $notify(`${icon} Gemini ${status}`, msg, result.success ? "当前节点可用" : "建议切换节点");
    }

    $done({ ok: result.success });
});
