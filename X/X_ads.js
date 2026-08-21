/**
 * @name X(Twitter)网页版去广告
 * @version 1.0.0
 * @author fmz200 & 5jwoj
 * @description 移除网页版 X (Twitter) 广告（时间线推荐/最新关注/推文详情评论区广告）
 * @date 2026-08-21
 */

const req_url = typeof $request !== 'undefined' && $request.url ? $request.url : '';
let rsp_body = (typeof $response !== 'undefined' && $response && $response.body) ? $response.body : '{}';

try {
  let mod_rsp = JSON.parse(rsp_body);

  // 1. "为你推荐"与"正在关注"信息流
  if (req_url.includes("/HomeTimeline") || req_url.includes("/HomeLatestTimeline")) {
    const timelineUrt = mod_rsp?.data?.home?.home_timeline_urt;
    if (timelineUrt && Array.isArray(timelineUrt.instructions)) {
      timelineUrt.instructions.forEach((instruction) => {
        if (Array.isArray(instruction.entries)) {
          // 过滤掉所有 Promoted (广告) 条目
          instruction.entries = instruction.entries.filter((entry) => {
            const isPromoted = entry.entryId?.includes("promoted-tweet") || Boolean(entry.content?.itemContent?.promotedMetadata);
            if (isPromoted) {
              console.log(`[X_ads] ❌ HomeTimeline 移除广告: ${entry.entryId}`);
            }
            return !isPromoted;
          });
        }
      });
    }
  }

  // 2. "推文详情"与评论区广告
  if (req_url.includes("/TweetDetail")) {
    const instructions = mod_rsp?.data?.threaded_conversation_with_injections_v2?.instructions;
    if (Array.isArray(instructions)) {
      instructions.forEach((instruction) => {
        if (Array.isArray(instruction.entries)) {
          instruction.entries = instruction.entries.filter((entry) => {
            // 检查 Entry 层级是否为直接广告
            const isDirectAd = entry.entryId?.includes("promoted") || Boolean(entry.content?.itemContent?.promotedMetadata);
            if (isDirectAd) {
              console.log(`[X_ads] ❌ TweetDetail 移除直接广告: ${entry.entryId}`);
              return false;
            }

            // 检查内部嵌套的 Items (详情页推荐或回复区广告)
            if (Array.isArray(entry.content?.items)) {
              entry.content.items = entry.content.items.filter((item) => {
                const itemContent = item.item?.itemContent || item.itemContent;
                const isItemAd = item.entryId?.includes("promoted") || Boolean(itemContent?.promotedMetadata);
                if (isItemAd) {
                  console.log(`[X_ads] ❌ TweetDetail 移除嵌套广告: ${item.entryId || 'item'}`);
                }
                return !isItemAd;
              });

              // 如果模块内的广告被清空，则移除整个模块
              if (entry.content.items.length === 0) {
                return false;
              }
            }

            return true;
          });
        }
      });
    }
  }

  $done({ body: JSON.stringify(mod_rsp) });
} catch (error) {
  console.log(`[X_ads] ⚠️ 脚本运行异常: ${error.message}`);
  $done({ body: rsp_body });
}
