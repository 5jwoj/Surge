/**
 * Gemini 节点可用性检测工具
 * 
 * @author 5jwoj
 * @version 1.0.2
 * @description 检测代理节点是否能正常访问 Gemini AI
 * 
 * 使用方法:
 * 1. Surge: 添加到模块，通过面板触发
 * 2. Quan X: 添加为重写规则，通过 Shortcuts 触发
 * 
 * 功能特性:
 * - 检测当前节点是否可用
 * - 批量测试策略组所有节点
 * - 显示可用节点列表
 * - 记录历史可用节点
 */

const SCRIPT_NAME = "Gemini 检测器";
const VERSION = "1.0.2";

// Gemini API 测试端点
const GEMINI_TEST_URLS = [
    "https://gemini.google.com",
    "https://generativelanguage.googleapis.com/v1beta/models",
    "https://aistudio.google.com"
];

// 配置项
const CONFIG = {
    timeout: 10000,  // 超时时间（毫秒）
    policyGroup: "Proxy",  // 默认策略组名称
    checkMode: "current",  // 检测模式: current(当前节点) / all(所有节点)
    storageKey: "gemini_available_nodes"
};

/**
 * 主函数
 */
async function main() {
    console.log(`[${SCRIPT_NAME}] v${VERSION} 开始运行`);

    const mode = $argument || CONFIG.checkMode;

    try {
        if (mode === "all" || mode === "批量检测") {
            await checkAllNodes();
        } else {
            await checkCurrentNode();
        }
    } catch (error) {
        console.log(`[${SCRIPT_NAME}] 错误: ${error.message}`);
        notify("❌ 检测失败", "", error.message);
    }

    $done({});
}

/**
 * 检测当前节点
 */
async function checkCurrentNode() {
    console.log(`[${SCRIPT_NAME}] 检测当前节点...`);

    const result = await testGeminiAccess();

    if (result.success) {
        const msg = `✅ 当前节点可用\n` +
            `响应时间: ${result.latency}ms\n` +
            `测试端点: ${result.url}`;
        console.log(`[${SCRIPT_NAME}] ${msg}`);
        notify("✅ Gemini 可访问", "当前节点正常", `延迟: ${result.latency}ms`);

        // 保存当前节点信息
        await saveAvailableNode(getCurrentProxy(), result.latency);
    } else {
        const msg = `❌ 当前节点不可用\n` +
            `错误: ${result.error}\n` +
            `建议: 尝试切换其他节点`;
        console.log(`[${SCRIPT_NAME}] ${msg}`);
        notify("❌ Gemini 不可访问", result.error, "请尝试切换节点或运行批量检测");
    }
}

/**
 * 批量检测策略组所有节点
 */
async function checkAllNodes() {
    console.log(`[${SCRIPT_NAME}] 批量检测模式启动...`);

    // 获取策略组信息
    const policyGroup = CONFIG.policyGroup;
    const nodes = getPolicyGroupNodes(policyGroup);

    if (!nodes || nodes.length === 0) {
        notify("⚠️ 未找到节点", "", `策略组 "${policyGroup}" 没有可用节点`);
        return;
    }

    notify("🔍 开始批量检测", `策略组: ${policyGroup}`, `总计 ${nodes.length} 个节点`);

    const availableNodes = [];
    const unavailableNodes = [];

    // 逐个检测节点
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        console.log(`[${SCRIPT_NAME}] [${i + 1}/${nodes.length}] 检测节点: ${node}`);

        // 切换到该节点
        await setPolicy(policyGroup, node);
        await sleep(1000);  // 等待切换生效

        // 测试访问
        const result = await testGeminiAccess();

        if (result.success) {
            availableNodes.push({
                name: node,
                latency: result.latency,
                url: result.url
            });
            console.log(`[${SCRIPT_NAME}] ✅ ${node} - ${result.latency}ms`);
        } else {
            unavailableNodes.push({
                name: node,
                error: result.error
            });
            console.log(`[${SCRIPT_NAME}] ❌ ${node} - ${result.error}`);
        }
    }

    // 保存可用节点列表
    await saveAvailableNodes(availableNodes);

    // 显示检测结果
    showCheckResults(availableNodes, unavailableNodes, nodes.length);
}

/**
 * 测试 Gemini 访问
 */
async function testGeminiAccess() {
    const startTime = Date.now();

    // 尝试多个测试端点
    for (const url of GEMINI_TEST_URLS) {
        try {
            console.log(`[${SCRIPT_NAME}] 测试端点: ${url}`);

            const response = await httpRequest({
                url: url,
                method: "GET",
                timeout: CONFIG.timeout,
                headers: {
                    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
                }
            });

            const latency = Date.now() - startTime;

            // 检查响应状态
            if (response.status >= 200 && response.status < 500) {
                // 200-499 都认为是可访问（包括 403/404 等，说明至少能连上）
                // 如果是地区限制，通常会返回特定错误页面

                // 检查是否有地区限制标志
                const body = response.body || "";
                if (body.includes("not available in your country") ||
                    body.includes("不在受支持的国家/地区") ||
                    body.includes("This service is not available")) {
                    continue;  // 尝试下一个端点
                }

                return {
                    success: true,
                    url: url,
                    latency: latency,
                    status: response.status
                };
            }
        } catch (error) {
            console.log(`[${SCRIPT_NAME}] 端点 ${url} 测试失败: ${error.message}`);
            // 继续尝试下一个端点
        }
    }

    // 所有端点都失败
    return {
        success: false,
        error: "无法访问 Gemini（地区限制或网络异常）"
    };
}

/**
 * 显示检测结果
 */
function showCheckResults(available, unavailable, total) {
    const availCount = available.length;
    const unavailCount = unavailable.length;

    let title = `📊 检测完成 (${total} 个节点)`;
    let subtitle = `✅ 可用: ${availCount} | ❌ 不可用: ${unavailCount}`;
    let message = "";

    if (availCount > 0) {
        // 按延迟排序
        available.sort((a, b) => a.latency - b.latency);

        message = "🎯 可用节点列表:\n";
        available.forEach((node, index) => {
            message += `${index + 1}. ${node.name} (${node.latency}ms)\n`;
        });

        // 自动切换到最快的可用节点
        const fastestNode = available[0];
        setPolicy(CONFIG.policyGroup, fastestNode.name);
        message += `\n✨ 已自动切换到: ${fastestNode.name}`;
    } else {
        message = "😔 未找到可用节点\n";
        message += "建议:\n";
        message += "1. 检查代理服务器是否正常\n";
        message += "2. 尝试其他地区节点\n";
        message += "3. 联系机场客服咨询";
    }

    notify(title, subtitle, message);
    console.log(`[${SCRIPT_NAME}] ${title}\n${subtitle}\n${message}`);
}

/**
 * 保存可用节点信息
 */
async function saveAvailableNode(nodeName, latency) {
    try {
        const data = getStorage(CONFIG.storageKey) || { nodes: [], lastUpdate: null };

        // 更新或添加节点
        const existing = data.nodes.find(n => n.name === nodeName);
        if (existing) {
            existing.latency = latency;
            existing.lastCheck = new Date().toISOString();
        } else {
            data.nodes.push({
                name: nodeName,
                latency: latency,
                lastCheck: new Date().toISOString()
            });
        }

        data.lastUpdate = new Date().toISOString();
        setStorage(CONFIG.storageKey, data);
    } catch (error) {
        console.log(`[${SCRIPT_NAME}] 保存节点信息失败: ${error.message}`);
    }
}

/**
 * 保存可用节点列表
 */
async function saveAvailableNodes(nodes) {
    try {
        const data = {
            nodes: nodes,
            lastUpdate: new Date().toISOString(),
            totalChecked: nodes.length
        };
        setStorage(CONFIG.storageKey, data);
        console.log(`[${SCRIPT_NAME}] 已保存 ${nodes.length} 个可用节点`);
    } catch (error) {
        console.log(`[${SCRIPT_NAME}] 保存节点列表失败: ${error.message}`);
    }
}

/**
 * 获取当前代理节点
 */
function getCurrentProxy() {
    // Surge
    if (typeof $surge !== "undefined") {
        return $surge.selectGroupDetails()[CONFIG.policyGroup]?.selected || "未知";
    }
    // Quan X
    if (typeof $configuration !== "undefined") {
        return $configuration.selectedServer || "未知";
    }
    return "未知";
}

/**
 * 获取策略组节点列表
 */
function getPolicyGroupNodes(groupName) {
    // Surge
    if (typeof $surge !== "undefined" && $surge.selectGroupDetails) {
        const group = $surge.selectGroupDetails()[groupName];
        return group ? group.proxies : [];
    }
    // Quan X (需要手动配置节点列表)
    // 这里返回空数组，用户需要在配置中指定
    return [];
}

/**
 * 设置策略组选择
 */
function setPolicy(groupName, nodeName) {
    // Surge
    if (typeof $surge !== "undefined" && $surge.setSelectGroupPolicy) {
        $surge.setSelectGroupPolicy(groupName, nodeName);
        console.log(`[${SCRIPT_NAME}] 切换策略组 "${groupName}" 到节点 "${nodeName}"`);
        return true;
    }
    // Quan X (通过 HTTP API)
    // 需要在配置中启用 HTTP API
    return false;
}

/**
 * 发送通知
 */
function notify(title, subtitle, message) {
    if (typeof $notification !== "undefined") {
        $notification.post(title, subtitle, message);
    } else if (typeof $notify !== "undefined") {
        $notify(title, subtitle, message);
    }
}

/**
 * HTTP 请求封装
 */
function httpRequest(options) {
    return new Promise((resolve, reject) => {
        // Surge
        if (typeof $httpClient !== "undefined") {
            $httpClient.get(options, (error, response, data) => {
                if (error) {
                    reject(new Error(error));
                } else {
                    resolve({
                        status: response.status,
                        headers: response.headers,
                        body: data
                    });
                }
            });
        }
        // Quan X
        else if (typeof $task !== "undefined") {
            $task.fetch(options).then(
                response => resolve({
                    status: response.statusCode,
                    headers: response.headers,
                    body: response.body
                }),
                reason => reject(new Error(reason.error))
            );
        }
        else {
            reject(new Error("不支持的运行环境"));
        }
    });
}

/**
 * 存储数据
 */
function setStorage(key, value) {
    const data = JSON.stringify(value);
    if (typeof $persistentStore !== "undefined") {
        $persistentStore.write(data, key);
    } else if (typeof $prefs !== "undefined") {
        $prefs.setValueForKey(data, key);
    }
}

/**
 * 读取数据
 */
function getStorage(key) {
    let data = null;
    if (typeof $persistentStore !== "undefined") {
        data = $persistentStore.read(key);
    } else if (typeof $prefs !== "undefined") {
        data = $prefs.valueForKey(key);
    }
    return data ? JSON.parse(data) : null;
}

/**
 * 延迟函数
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 执行主函数
main();
