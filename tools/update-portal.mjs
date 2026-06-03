import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const LOCAL_ROOT = 'D:/桌面/Codex的游乐园/信息门户';
const CWD = process.cwd();
const RUNS_IN_REPO = process.env.GITHUB_ACTIONS === 'true'
  || process.env.PORTAL_REPO_MODE === '1'
  || (existsSync(path.join(CWD, '.git')) && existsSync(path.join(CWD, 'index.html')));
const ROOT = RUNS_IN_REPO ? CWD : LOCAL_ROOT;
const PUBLIC_ROOT = RUNS_IN_REPO ? ROOT : path.join(ROOT, '公开网页');
const SEEN_PATH = path.join(ROOT, 'data', 'seen-notices.json');
const PUBLIC_SEEN_PATH = path.join(PUBLIC_ROOT, 'data', 'seen-notices.json');
const REPORTS_DIR = path.join(ROOT, 'reports');
const WRITE_REPORTS = !RUNS_IN_REPO && process.env.PORTAL_WRITE_REPORTS !== '0';
const SHOULD_PUSH = process.env.PORTAL_NO_PUSH !== '1' && process.env.PORTAL_DRY_RUN !== '1';

const SOURCES = [
  ['校级', '学校主站', '通知公告', 'https://www.sxgkd.edu.cn/tzgg.htm'],
  ['校级', '教务部', '通知公告', 'https://jwb.sxgkd.edu.cn/yywzgz/tzgg.htm'],
  ['校级', '招生信息网', '招生快讯', 'https://zsxxw.sxgkd.edu.cn/'],
  ['校级', '学生工作部', '通知公告', 'https://xsgzb.sxgkd.edu.cn/tzgg.htm'],
  ['校级', '校团委', '通知公告', 'https://tw.sxgkd.edu.cn/index/tzgg.htm'],
  ['校级', '校团委', '学生社团', 'https://tw.sxgkd.edu.cn/xsst.htm'],
  ['校级', '后勤保卫', '通知公告', 'https://hqbwb.sxgkd.edu.cn/index/tzgg.htm'],
  ['校级', '就业中心', '通知公告', 'https://cjrh.sxgkd.edu.cn/index/tzgg.htm'],
  ['校级', '创新创业学院', '通知公告', 'https://cxcyxy.sxgkd.edu.cn/tzgg.htm'],
  ['校级', '智慧校园中心', '信息服务', 'https://zhxyzx.sxgkd.edu.cn/'],
  ['校级', '国内国际合作与交流中心', '通知公告', 'https://gjjlhzb.sxgkd.edu.cn/tzgg.htm'],
  ['学院', '建筑工程学院', '学院公开页', 'https://jzgcxy.sxgkd.edu.cn/'],
  ['学院', '交通工程学院', '通知公告', 'https://jtgcxy.sxgkd.edu.cn/tzgg.htm'],
  ['学院', '汽车工程学院', '通知公告', 'https://qcgcxy.sxgkd.edu.cn/index/tzgg.htm'],
  ['学院', '设备工程学院', '通知公告', 'https://sbgcxy.sxgkd.edu.cn/tzgg.htm'],
  ['学院', '建筑设计学院', '通知公告', 'https://jzsjxy.sxgkd.edu.cn/index/tzgg.htm'],
  ['学院', '工程管理学院', '通知公告', 'https://gcglxy.sxgkd.edu.cn/index/tzgg.htm'],
  ['学院', '智能制造学院', '公示公开', 'https://znzzxy.sxgkd.edu.cn/index/gsgk.htm'],
  ['学院', '信息工程学院', '通知公告', 'https://xxgcxy.sxgkd.edu.cn/index/tzgg.htm'],
  ['学院', '计算机工程学院', '学院公开页', 'https://jsjgcxy.sxgkd.edu.cn/'],
  ['学院', '安全与应急管理学院', '通知公告', 'https://aqyyjglxy.sxgkd.edu.cn/tzgg.htm'],
  ['学院', '现代物流学院', '通知公告', 'https://xdwlxy.sxgkd.edu.cn/index/tzgg.htm'],
  ['学院', '会计学院', '通知公告', 'https://kjxy.sxgkd.edu.cn/index/tzgg.htm'],
  ['学院', '经济学院', '通知公告', 'https://jjxy.sxgkd.edu.cn/index/tzgg.htm'],
  ['学院', '管理学院', '学院公开页', 'https://glxy.sxgkd.edu.cn/'],
  ['学院', '文法学院', '通知公告', 'https://wfxy.sxgkd.edu.cn/index/tzgg.htm'],
  ['学院', '艺术设计学院', '通知公告', 'https://yssjxy.sxgkd.edu.cn/index/tzgg.htm'],
  ['学院', '音乐舞蹈学院', '公示公告', 'https://yywdxy.sxgkd.edu.cn/index/gsgg.htm'],
  ['学院', '外国语学院', '通知公告', 'https://wgyxy.sxgkd.edu.cn/tzgg/1.htm'],
  ['学院', '体育学院', '通知公告', 'https://tyxy.sxgkd.edu.cn/tzgg.htm'],
  ['学院', '继续教育与培训学院', '通知公告', 'https://jxjyxy.sxgkd.edu.cn/index/tzgg.htm'],
  ['学院', '创新创业学院', '通知公告', 'https://cxcyxy.sxgkd.edu.cn/tzgg/1.htm'],
  ['学院', '马克思主义学院', '通知公告', 'https://szb.sxgkd.edu.cn/tzgg/1.htm'],
  ['学院', '基础课教学部', '通知公告', 'https://jckjxb.sxgkd.edu.cn/tzgg.htm'],
  ['学院', '实验实训教学部', '学院公开页', 'https://sysxjxb.sxgkd.edu.cn/']
].map(([scope, unit, page, url]) => ({ scope, unit, page, url }));

const BAD_NAV = /^(首页|学校首页|网站首页|更多|more|English|旧版|设为首页|加入收藏|联系我们|学院概况|组织机构|师资队伍|教学科研|党建工作|学团工作|招生就业|人才培养|专业建设|党群工作|部门概况|政策制度|资料下载|校友工作|图片新闻|学院新闻|工作动态|新闻动态|综合新闻|通知公告|招生就业)$/i;
const NAV_WORDS = /(通知|公告|公示|学生|招生|就业|竞赛|技能|实训|社团|下载|报名)/;

const now = chinaNow();
const today = now.slice(0, 10);
const weekStart = mondayOf(today);
const weekEnd = addDays(weekStart, 6);

await fs.mkdir(path.join(ROOT, 'data'), { recursive: true });
await fs.mkdir(path.join(PUBLIC_ROOT, 'data'), { recursive: true });
if (WRITE_REPORTS) await fs.mkdir(REPORTS_DIR, { recursive: true });
await fs.mkdir(PUBLIC_ROOT, { recursive: true });
syncPublicRepo();

const seen = await readSeen();
const seenIds = new Set(seen.items.map((item) => item.id || item.url));
const fetched = new Map();
const errors = [];

const candidates = await collectCandidates();
const additions = [];
for (const candidate of candidates.values()) {
  if (seenIds.has(candidate.url)) continue;

  const article = await get(candidate.url);
  if (!article.html) continue;

  const body = strip(article.html);
  const date = articleDate(article.html, candidate.listDate);
  if (!date || date < weekStart || date > weekEnd) continue;

  const title = pickTitle(candidate.listTitle, article.html, body);
  if (!title || BAD_NAV.test(title)) continue;

  const category = classify(title, body);
  if (!category || isExcluded(title, body)) continue;

  additions.push({
    id: candidate.url,
    category,
    title,
    date,
    source: `${candidate.unit} / ${candidate.page}`,
    url: candidate.url,
    summary: summarize(title, category, body),
    attachments: attachments(article.html, candidate.url),
    firstSeenAt: now,
    lastSeenAt: now,
    timeHints: timeHints(title, body),
    scope: candidate.scope,
    unit: candidate.unit
  });
}

for (const item of additions) {
  if (!seen.items.some((existing) => existing.id === item.id || existing.url === item.url)) {
    seen.items.push(item);
  }
}
seen.lastCheckAt = now;

const publicIndex = await fs.readFile(path.join(PUBLIC_ROOT, 'index.html'), 'utf8').catch(() => '');
const base = extractBase(publicIndex);
const indexHtml = renderIndex(seen, additions, base);
const historyHtml = renderHistory(seen, additions, base);

await writeSeen(seen);
await fs.writeFile(path.join(ROOT, 'index.html'), indexHtml, 'utf8');
await fs.writeFile(path.join(ROOT, 'history.html'), historyHtml, 'utf8');
if (PUBLIC_ROOT !== ROOT) {
  await fs.writeFile(path.join(PUBLIC_ROOT, 'index.html'), indexHtml, 'utf8');
  await fs.writeFile(path.join(PUBLIC_ROOT, 'history.html'), historyHtml, 'utf8');
}
if (WRITE_REPORTS) await fs.writeFile(path.join(REPORTS_DIR, reportName(now)), indexHtml, 'utf8');

commitAndPush(additions.length);

console.log(JSON.stringify({
  checkedAt: now,
  sourceCount: SOURCES.length,
  fetched: fetched.size,
  candidateCount: candidates.size,
  newCount: additions.length,
  total: seen.items.length,
  errors
}, null, 2));

async function readSeen() {
  const local = await loadSeen(SEEN_PATH);
  const publicSeen = PUBLIC_SEEN_PATH === SEEN_PATH ? null : await loadSeen(PUBLIC_SEEN_PATH);
  return latestSeen(local, publicSeen) || { lastCheckAt: '', items: [] };
}

async function loadSeen(filePath) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.items)) parsed.items = [];
    return parsed;
  } catch {
    return null;
  }
}

function latestSeen(a, b) {
  if (!a) return b;
  if (!b) return a;
  return String(b.lastCheckAt || '').localeCompare(String(a.lastCheckAt || '')) > 0 ? b : a;
}

async function writeSeen(seen) {
  const json = `${JSON.stringify(seen, null, 2)}\n`;
  await fs.writeFile(SEEN_PATH, json, 'utf8');
  if (PUBLIC_SEEN_PATH !== SEEN_PATH) {
    await fs.writeFile(PUBLIC_SEEN_PATH, json, 'utf8');
  }
}

async function collectCandidates() {
  const out = new Map();
  for (const source of SOURCES) {
    const queue = [source.url];
    const visited = new Set();
    let pages = 0;
    while (queue.length && pages < 6) {
      const pageUrl = queue.shift();
      if (visited.has(pageUrl)) continue;
      visited.add(pageUrl);
      pages += 1;

      const page = await get(pageUrl);
      if (!page.html) continue;
      const host = new URL(page.url).hostname;
      for (const link of extractLinks(page.html, page.url)) {
        let parsed;
        try {
          parsed = new URL(link.url);
        } catch {
          continue;
        }
        if (parsed.hostname !== host) continue;

        const text = cleanListTitle(link.text);
        if (!text || BAD_NAV.test(text)) continue;

        const lower = parsed.href.toLowerCase();
        const looksArticle = (/\/info\/|\/content\/|\d+\.html?$/.test(lower)) && !/tzgg|index|list|xwzx|xygk|jxky|szdw|djgz|xyxw|gsgk\.htm$|gsgg\.htm$/.test(lower);
        if (looksArticle && text.length >= 4) {
          const key = parsed.href.replace(/#.*$/, '');
          if (!out.has(key)) {
            out.set(key, { ...source, url: key, listTitle: text, listDate: link.date, fromPage: pageUrl });
          }
        }

        const navish = NAV_WORDS.test(text) || /tzgg|gsgg|gsgk|xsgz|zsjy|sxxw|xsstd|xsst|jingsai|gg|notice/i.test(lower);
        if (navish && !looksArticle && !visited.has(parsed.href) && !queue.includes(parsed.href) && queue.length < 12) {
          queue.push(parsed.href);
        }
      }
    }
  }
  return out;
}

async function get(url) {
  if (fetched.has(url)) return fetched.get(url);
  try {
    const result = await fetchHtml(url);
    fetched.set(url, result);
    return result;
  } catch (error) {
    const failed = { ok: false, status: 0, url, html: '' };
    errors.push({ url, error: error.message });
    fetched.set(url, failed);
    return failed;
  }
}

async function fetchHtml(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 portal monitor',
        Accept: 'text/html,application/xhtml+xml'
      }
    });
    const buffer = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get('content-type') || '';
    let encoding = (contentType.match(/charset=([^;]+)/i) || [])[1];
    if (!encoding) {
      const head = buffer.toString('latin1').slice(0, 3000);
      encoding = (head.match(/charset\s*=\s*["']?([\w-]+)/i) || [])[1];
    }
    encoding = (encoding || 'utf-8').toLowerCase().replace('gb2312', 'gbk');
    let html;
    try {
      html = new TextDecoder(encoding).decode(buffer);
    } catch {
      html = new TextDecoder('utf-8').decode(buffer);
    }
    return { ok: response.ok, status: response.status, url: response.url || url, html };
  } finally {
    clearTimeout(timer);
  }
}

function extractLinks(html, base) {
  const links = [];
  const regex = /<a\b([^>]*)href\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))([^>]*)>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = regex.exec(html))) {
    const href = decodeEntities(match[2] || match[3] || match[4] || '').trim();
    if (!href || /^(javascript:|#|mailto:|tel:)/i.test(href)) continue;
    let url;
    try {
      url = new URL(href, base).href;
    } catch {
      continue;
    }
    const around = html.slice(Math.max(0, match.index - 180), Math.min(html.length, regex.lastIndex + 180));
    links.push({ url, text: strip(match[6]), date: dateInContext(strip(around)) });
  }
  return links;
}

function pickTitle(listTitle, html, body) {
  const h1 = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1];
  const titleTag = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1];
  const fromH1 = cleanListTitle(strip(h1 || ''));
  const fromTitle = cleanListTitle(strip(titleTag || '').replace(/[-_—].*$/, ''));
  const fromBody = cleanListTitle((body.match(/^(.{4,90}?)-山西/) || [])[1] || '');
  for (const value of [fromH1, fromTitle, listTitle, fromBody]) {
    if (value && !BAD_NAV.test(value) && !/^(首页|通知公告|招生就业|新闻中心)$/.test(value)) return value;
  }
  return '';
}

function cleanListTitle(value) {
  return decodeEntities(String(value || ''))
    .replace(/[【】\[\]]/g, '')
    .replace(/^\d{1,2}\s+20\d{2}[-/.年]\d{1,2}[-/.月]\d{1,2}\s*/, '')
    .replace(/^20\d{2}[-/.年]\d{1,2}[-/.月]\d{1,2}\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function articleDate(html, fallback) {
  const text = strip(html).slice(0, 6000);
  const patterns = [
    /(?:发布时间|发布日期|时间|日期|发稿时间|更新时间)[:：\s]*(20\d{2}[-/.年]\d{1,2}[-/.月]\d{1,2})/,
    /(20\d{2}[-/.年]\d{1,2}[-/.月]\d{1,2})/
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return normalizeDate(match[1]);
  }
  return fallback || '';
}

function attachments(html, base) {
  return extractLinks(html, base)
    .filter((link) => /附件|\.docx?|\.pdf|\.xlsx?|\.zip|download/i.test(`${link.text} ${link.url}`))
    .filter((link) => !/^(下载中心|相关下载|资料下载|表格下载)$/.test(link.text))
    .slice(0, 6)
    .map((link) => ({ name: link.text || link.url.split('/').pop(), url: link.url }));
}

function classify(title, body) {
  if (!/(关于|通知|公告|安排|报名|考试|竞赛|招生|公示|预告|倡议书|简章|说明)/.test(title)) return '';
  const text = `${title} ${body.slice(0, 1800)}`;
  const groups = [
    ['学业考试', /考试|专升本|计算机等级|四六级|补考|缓考|普通话|成绩|报名|准考证|录取|志愿|考查|考场|学位|毕业资格/],
    ['竞赛活动', /比赛|竞赛|技能大赛|创新创业大赛|挑战杯|互联网\+|征集|活动|讲座|游园会|心理|培训|宣讲|招募|项目|社团|志愿服务/],
    ['奖助评优', /奖学金|奖助学金|国家奖学金|励志奖学金|助学金|资助|评审|公示|评优|优秀毕业生|表彰|推优|创业奖/],
    ['校园生活', /停水|停电|停气|停暖|供水|供电|网络|断网|校园网|宿舍|食堂|浴室|维修|施工|物业|后勤|门禁|校园卡|餐饮|电动车|交通管控|安全文明/],
    ['假期安排', /放假|假期|校历|调休|节假日|返校|离校|寒假|暑假/]
  ];
  for (const [category, regex] of groups) {
    if (regex.test(text)) return category;
  }
  if (/学生|同学|班级|学院|报名|毕业生|就业|实习|招聘会|双选会|课程|微专业/.test(text)) return '其他通知';
  return '';
}

function isExcluded(title, body) {
  const text = `${title} ${body.slice(0, 1200)}`;
  if (/座谈会|专项调研|党支部|党员服务岗|值班安排|新闻稿|工作动态/.test(title)) return true;
  return /采购|招标|询价|成交|中标|博士招聘|人才引进|高层次人才|职称评审|教职工|教师教学能力|科研项目|课题申报|学术论文|党委|党纪|理论学习|中心组|领导调研|会议|培训会|座谈会/.test(text)
    && !/学生|同学|毕业生|考试|竞赛|奖学金|助学|宿舍|校园卡|社团|报名|缓考/.test(text);
}

function summarize(title, category, body) {
  const hints = timeHints(title, body);
  const place = (body.match(/(?:地点|考试地点|比赛地点)[:：]\s*([^。；\n]{2,40})/) || [])[1];
  if (/名单|学号|序号\s*姓名|缓考学生/.test(body)) {
    const bits = [`${sourceLead(title)}发布${category}相关通知，面向相关学生提醒办理或参加事项。`];
    if (hints.length) bits.push(`${hints[0].label}为${hints[0].value}。`);
    if (place) bits.push(`地点为${place.trim()}。`);
    if (/开卷/.test(body)) bits.push('通知说明为开卷考试，请携带教材。');
    bits.push('具体名单和要求以官网原文为准。');
    return bits.join('');
  }
  const main = strip(body)
    .replace(title, '')
    .replace(/当前位置[:：]?.*?正文/, '')
    .replace(/作者[:：]?.*?点击[:：]?.*?次/, '')
    .slice(0, 260);
  return `${sourceLead(title)}发布${category}相关通知。${main || '请打开官网原文查看具体安排。'}`;
}

function sourceLead(title) {
  const match = title.match(/^(.*?学院|.*?部|.*?中心|.*?团委)/);
  return match ? match[1] : '官网';
}

function timeHints(title, body) {
  const text = `${title} ${body}`;
  const out = [];
  const exact = text.match(/20\d{2}年\d{1,2}月\d{1,2}日(?:周.)?(?:上午|下午|晚上)?\s*\d{1,2}[:：]\d{2}/);
  if (exact) {
    const value = normalizeDate(exact[0]) + ' ' + (exact[0].match(/\d{1,2}[:：]\d{2}/) || [''])[0].replace('：', ':');
    out.push({ label: /考试|缓考/.test(text) ? '缓考时间' : '活动时间', value, startDate: value.slice(0, 10), startTime: value.slice(11).replace(':', '') });
  }
  const deadline = text.match(/(?:截止|报送).*?(20\d{2}[-/.年]\d{1,2}[-/.月]\d{1,2})/);
  if (deadline && !out.some((item) => item.value.includes(normalizeDate(deadline[1])))) {
    const value = normalizeDate(deadline[1]);
    out.push({ label: '截止时间', value, startDate: value });
  }
  return out.slice(0, 3);
}

function renderIndex(seen, newItems, base) {
  const newIds = new Set(newItems.map((item) => item.id));
  const all = sortItems(seen.items);
  const current = all.filter((item) => item.date >= weekStart && item.date <= weekEnd);
  const school = current.filter((item) => item.scope === '校级');
  const college = current.filter((item) => item.scope === '学院');
  const historyCount = all.length - current.length;
  const schoolHtml = school.length ? `<div class="notice-list">${school.map((item, index) => noticeFold(item, `notice-fold-home-school-${index}`, newIds.has(item.id), newIds.has(item.id))).join('')}</div>` : '<div class="empty-state">本周暂无校级通知</div>';
  const collegeHtml = college.length ? [...groupBy(college, (item) => item.unit || '学院通知').entries()].sort((a, b) => a[0].localeCompare(b[0], 'zh-CN')).map(([unit, items], groupIndex) => `<details class="unit-group" open><summary><span>${esc(unit)}</span><strong>${items.length}</strong></summary><div class="unit-body"><div class="notice-list">${sortItems(items).map((item, index) => noticeFold(item, `notice-fold-home-college-${groupIndex}-${index}`, newIds.has(item.id), newIds.has(item.id))).join('')}</div></div></details>`).join('') : '<div class="empty-state">本周暂无学院通知</div>';

  return `${head('山西工程科技职业大学信息门户', base)}
<body>
  <div class="startup-screen" aria-hidden="true"><div class="startup-panel"><span class="startup-kicker">公开通知整理</span><strong>山西工程科技职业大学信息门户</strong><span class="startup-line"></span></div></div>
  <main class="page">
    <section class="hero" aria-labelledby="page-title"><div class="hero-top"><div><p class="eyebrow">公开通知整理</p><h1 id="page-title">山西工程科技职业大学信息门户</h1><p class="hero-copy">汇总学校和各学院公开发布的学生通知，重点整理考试报名、竞赛活动、奖助评优、校园生活和假期安排，方便快速查看原文和附件。</p></div><div class="status-card">${themeButton()}<div class="status-line"><p class="status-label">最后更新</p><p class="status-value">${esc(now)}</p></div><div class="status-line"><p class="status-label">下次更新</p><p class="status-value">${esc(nextUpdateLabel(now))}</p></div></div></div><div class="metrics" aria-label="检测概览"><div class="metric${newItems.length ? ' is-hot' : ''}"><span>本次新增</span><strong>${newItems.length}<small>条</small></strong>${newItems.length ? '<em class="metric-badge">有更新</em>' : ''}</div><div class="metric"><span>已记录通知</span><strong>${seen.items.length}<small>条</small></strong></div></div><div class="source-row" aria-label="数据来源"><a href="https://www.sxgkd.edu.cn/tzgg.htm" target="_blank" rel="noreferrer">学校主站</a><a href="https://jwb.sxgkd.edu.cn/yywzgz/tzgg.htm" target="_blank" rel="noreferrer">教务部</a><a href="https://xsgzb.sxgkd.edu.cn/tzgg.htm" target="_blank" rel="noreferrer">学生工作部</a><a href="https://tw.sxgkd.edu.cn/index/tzgg.htm" target="_blank" rel="noreferrer">校团委</a><a href="https://hqbwb.sxgkd.edu.cn/index/tzgg.htm" target="_blank" rel="noreferrer">后勤保卫</a><a href="https://zsxxw.sxgkd.edu.cn/" target="_blank" rel="noreferrer">招生信息网</a><a href="https://cjrh.sxgkd.edu.cn/index/tzgg.htm" target="_blank" rel="noreferrer">就业中心</a><a href="https://www.sxgkd.edu.cn/jxjg/ejxy.htm" target="_blank" rel="noreferrer">22个二级学院</a></div></section>
    <div class="layout">
      <section class="notice-block school-block"><div class="section-head"><div><p class="section-kicker">校级</p><h2>校级通知</h2></div><span class="section-count other">${school.length}</span></div>${schoolHtml}</section>
      <section class="notice-block college-block"><div class="section-head"><div><p class="section-kicker">二级学院</p><h2>学院通知</h2></div><span class="section-count other">${college.length}</span></div>${collegeHtml}</section>
    </div>
    <section class="history-footer"><div><p class="section-kicker">历史归档</p><h2>更早通知已收纳</h2><p>本周以前的通知会在这里保留，方便回看往期事项和原文链接。</p></div><a href="history.html">查看历史归档 <strong>${historyCount}</strong></a></section>
    <p class="site-note">非学校官方，仅整理公开信息，原文以官网为准。</p>
  </main>
  ${base.bodyScript}
  ${pwaScript()}
</body>
</html>
`;
}

function renderHistory(seen, newItems, base) {
  const newIds = new Set(newItems.map((item) => item.id));
  const history = sortItems(seen.items.filter((item) => item.date < weekStart));
  return `${head('历史归档 - 山西工程科技职业大学信息门户', base)}
<body>
  <div class="startup-screen" aria-hidden="true"><div class="startup-panel"><span class="startup-kicker">公开通知整理</span><strong>山西工程科技职业大学信息门户</strong><span class="startup-line"></span></div></div>
  <main class="page">
    <section class="hero"><p class="eyebrow">历史归档</p><h1>历史通知</h1><p class="hero-copy">这里保存本周以前的学生通知，方便回看往期考试报名、活动安排、资助评优、校园生活提醒和对应官网原文。</p><div class="source-row"><a href="index.html">返回首页</a><a href="https://www.sxgkd.edu.cn/jxjg/ejxy.htm" target="_blank" rel="noreferrer">二级学院来源</a>${themeButton()}</div></section>
    ${historyScope('校级', '校级通知', '校级历史', history.filter((item) => item.scope === '校级'), newIds)}
    ${historyScope('学院', '二级学院', '学院历史', history.filter((item) => item.scope === '学院'), newIds)}
    <p class="site-note">非学校官方，仅整理公开信息，原文以官网为准。</p>
  </main>
  ${base.bodyScript}
  ${pwaScript()}
</body>
</html>
`;
}

function historyScope(scope, title, kicker, items, newIds) {
  const months = [...groupBy(items, (item) => monthLabel(item.date)).entries()].sort((a, b) => b[0].localeCompare(a[0], 'zh-CN'));
  const body = months.length ? months.map(([month, monthItems], monthIndex) => {
    const monthNumber = Number((month.match(/年(\d+)月/) || [])[1]);
    const weeks = ['第一周', '第二周', '第三周', '第四周'];
    const weekHtml = weeks.map((label, weekIndex) => {
      const weekName = `${monthNumber}月${label}`;
      const weekItems = monthItems.filter((item) => weekLabel(item.date) === weekName);
      let content;
      if (scope === '学院') {
        content = weekItems.length ? [...groupBy(weekItems, (item) => item.unit || '学院通知').entries()].sort((a, b) => a[0].localeCompare(b[0], 'zh-CN')).map(([unit, unitItems], unitIndex) => `<details class="unit-group" open><summary><span>${esc(unit)}</span><strong>${unitItems.length}</strong></summary><div class="unit-body"><div class="notice-list">${sortItems(unitItems).map((item, index) => noticeFold(item, `notice-fold-college-${monthIndex}-w${weekIndex}-unit-${unitIndex}-${index}`, newIds.has(item.id), false)).join('')}</div></div></details>`).join('') : '<div class="empty-state compact">暂无学院通知</div>';
      } else {
        content = weekItems.length ? `<div class="notice-list">${sortItems(weekItems).map((item, index) => noticeFold(item, `notice-fold-school-${monthIndex}-w${weekIndex}-${index}`, newIds.has(item.id), false)).join('')}</div>` : '<div class="empty-state compact">暂无校级通知</div>';
      }
      return `<details class="week-group" open><summary><span>${esc(weekName)}</span><strong>${weekItems.length}</strong></summary><div class="week-body">${content}</div></details>`;
    }).join('');
    return `<details class="month-card" open><summary><span>${esc(month)}</span><strong>${monthItems.length}</strong></summary><div class="month-body">${weekHtml}</div></details>`;
  }).join('') : '<div class="empty-state">暂无历史通知</div>';
  return `<section class="archive-scope ${scope === '校级' ? 'school-archive' : 'college-archive'}"><div class="archive-scope-head"><div><p class="section-kicker">${esc(kicker)}</p><h2>${esc(title)}</h2></div><span class="section-count other">${items.length}</span></div>${body}</section>`;
}

function noticeFold(item, id, isNew, open) {
  const slug = categorySlug(item.category);
  return `<section class="notice-fold ${slug}${isNew ? ' is-new' : ''}${open ? ' is-open' : ''}" data-fold>
  <button class="fold-summary" type="button" aria-expanded="${open ? 'true' : 'false'}" aria-controls="${esc(id)}">
    <span class="fold-title">${esc(item.title)}</span>
    <span class="fold-badges">${isNew ? '<span class="new-badge">新</span>' : ''}<span class="category-tag ${slug}">${esc(item.category)}</span></span>
    <span class="fold-meta">${esc(item.date)} · ${esc(item.unit || item.source)}</span>
  </button>
  <div class="fold-body" id="${esc(id)}" ${open ? 'style="height:auto"' : 'hidden'}>
    <article class="notice-card ${slug}${isNew ? ' is-new' : ''}">
      <div class="notice-topline"><span>${esc(item.date)}</span><span>${esc(item.source)}</span></div>
      <div class="notice-title-row"><a class="notice-title" href="${esc(item.url)}" target="_blank" rel="noreferrer">${esc(item.title)}</a><span class="notice-badges">${isNew ? '<span class="new-badge">新</span>' : ''}<span class="category-tag ${slug}">${esc(item.category)}</span><button class="fold-close" type="button" aria-label="收起通知" title="收起"><span aria-hidden="true">↑</span></button></span></div>
      ${timeHintHtml(item)}
      <p>${esc(item.summary)}</p>
      ${attachmentHtml(item)}
    </article>
  </div>
</section>`;
}

function extractBase(html) {
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((match) => match[0]);
  const style = (html.match(/<style>[\s\S]*?<\/style>/) || [])[0];
  return {
    headScript: scripts[0] || '',
    bodyScript: scripts[1] || '',
    style: style || ''
  };
}

function head(title, base) {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="theme-color" content="#0f766e">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-title" content="信息门户">
  <link rel="manifest" href="manifest.webmanifest">
  <link rel="icon" href="icon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="icon.svg">
  <title>${esc(title)}</title>
  ${base.headScript}
  ${base.style}
</head>`;
}

function pwaScript() {
  return `<script>
    (() => {
      if (!('serviceWorker' in navigator)) return;
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(() => {});
      });
    })();
  </script>`;
}

function themeButton() {
  return '<button class="theme-toggle" type="button" aria-label="切换为夜间模式" aria-pressed="false" title="切换为夜间模式"><span class="theme-track" aria-hidden="true"><span class="theme-icon theme-icon-sun"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"></path></svg></span><span class="theme-icon theme-icon-moon"><svg viewBox="0 0 24 24"><path d="M20 14.5A7.5 7.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5Z"></path></svg></span><span class="theme-thumb"></span></span></button>';
}

function timeHintHtml(item) {
  const hints = item.timeHints || [];
  return hints.length ? `<div class="time-hints">${hints.map((hint) => `<span><strong>${esc(hint.label)}</strong>${esc(hint.value)}</span>`).join('')}</div>` : '';
}

function attachmentHtml(item) {
  const list = item.attachments || [];
  return list.length ? `<div class="attachments"><strong>附件</strong>${list.map((attachment) => `<a href="${esc(attachment.url)}" target="_blank" rel="noreferrer">${esc(attachment.name)}</a>`).join('')}</div>` : '<div class="attachments"><strong>附件</strong><span class="muted">无附件</span></div>';
}

function commitAndPush(newCount) {
  if (!SHOULD_PUSH) return;
  const status = spawnSync('git', ['status', '--short', '--', 'index.html', 'history.html', 'data/seen-notices.json'], { cwd: PUBLIC_ROOT, encoding: 'utf8' });
  if (!status.stdout.trim()) return;
  spawnSync('git', ['add', 'index.html', 'history.html', 'data/seen-notices.json'], { cwd: PUBLIC_ROOT, stdio: 'inherit' });
  const commit = spawnSync('git', ['commit', '-m', `Auto update portal ${today} (${newCount} new)`], { cwd: PUBLIC_ROOT, stdio: 'inherit' });
  if (commit.status === 0) {
    spawnSync('git', ['push', 'origin', 'main'], { cwd: PUBLIC_ROOT, stdio: 'inherit' });
  }
}

function syncPublicRepo() {
  if (RUNS_IN_REPO || !SHOULD_PUSH || !existsSync(path.join(PUBLIC_ROOT, '.git'))) return;
  const status = spawnSync('git', ['status', '--short'], { cwd: PUBLIC_ROOT, encoding: 'utf8' });
  if (status.stdout.trim()) return;
  const pull = spawnSync('git', ['pull', '--ff-only', '--quiet', 'origin', 'main'], { cwd: PUBLIC_ROOT, encoding: 'utf8' });
  if (pull.status !== 0) {
    if (pull.stdout) process.stdout.write(pull.stdout);
    if (pull.stderr) process.stderr.write(pull.stderr);
  }
}

function strip(value) {
  return decodeEntities(String(value || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

function decodeEntities(value) {
  return String(value || '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, number) => String.fromCharCode(Number(number)))
    .replace(/&#x([0-9a-f]+);/gi, (_, number) => String.fromCharCode(parseInt(number, 16)));
}

function normalizeDate(value) {
  const match = String(value || '').match(/(20\d{2})[-/.年](\d{1,2})[-/.月](\d{1,2})/);
  return match ? `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}` : '';
}

function dateInContext(value) {
  const match = String(value || '').match(/20\d{2}[-/.年]\d{1,2}[-/.月]\d{1,2}/);
  return match ? normalizeDate(match[0]) : '';
}

function chinaNow() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).formatToParts(new Date());
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${map.year}-${map.month}-${map.day} ${map.hour}:${map.minute}:${map.second}`;
}

function mondayOf(date) {
  const value = new Date(`${date}T00:00:00+08:00`);
  const day = value.getDay() || 7;
  value.setDate(value.getDate() - day + 1);
  return value.toISOString().slice(0, 10);
}

function addDays(date, days) {
  const value = new Date(`${date}T00:00:00+08:00`);
  value.setDate(value.getDate() + days);
  return value.toISOString().slice(0, 10);
}

function nextUpdateLabel(current) {
  const hourMinute = current.slice(11, 16);
  const slots = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'];
  const next = slots.find((slot) => hourMinute < slot);
  return next ? `今日 ${next}` : '明日 08:00';
}

function reportName(current) {
  return `${current.slice(0, 16).replace(' ', '_').replace(':', '-')}.html`;
}

function monthLabel(date) {
  const [year, month] = date.split('-');
  return `${year}年${Number(month)}月`;
}

function weekLabel(date) {
  const day = Number(date.split('-')[2]);
  const month = Number(date.split('-')[1]);
  const name = day <= 7 ? '第一周' : day <= 14 ? '第二周' : day <= 21 ? '第三周' : '第四周';
  return `${month}月${name}`;
}

function sortItems(items) {
  return [...items].sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.firstSeenAt || '').localeCompare(a.firstSeenAt || '') || a.title.localeCompare(b.title, 'zh-CN'));
}

function groupBy(items, getKey) {
  const map = new Map();
  for (const item of items) {
    const key = getKey(item);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  }
  return map;
}

function categorySlug(category) {
  return {
    学业考试: 'exam',
    竞赛活动: 'activity',
    奖助评优: 'award',
    校园生活: 'life',
    假期安排: 'holiday',
    其他通知: 'other'
  }[category] || 'other';
}

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
