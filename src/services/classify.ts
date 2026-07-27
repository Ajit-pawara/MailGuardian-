import type { ClassificationResult, Category, CategoryGroup, ClassifyRequest } from "@/types/classification";
import { env, hasOpenAI } from "@/config/env";
import { CATEGORIES } from "@/config/constants";

const IMPORTANT_SENDERS = [
  "noreply@github.com",
  "jobs@linkedin.com",
  "notifications@github.com",
  "careers@",
  "hr@",
  "recruiter@",
  "recruiting@",
  "talent@",
  "university@",
  "admissions@",
  "registrar@",
  "bank",
  "chase",
  "wellsfargo",
  "bofa",
  "capitalone",
  "paypal",
  "stripe",
  "coinbase",
  "binance",
  "hackerone",
  "bugcrowd",
  "synack",
  "intigriti",
  "yeswehack",
  "cobalt",
];

const OTP_PATTERNS = [
  /otp/i,
  /one.?time.?pin/i,
  /one.?time.?password/i,
  /verification.?code/i,
  /security.?code/i,
  /authenticator/i,
  /2fa/i,
  /two.?factor/i,
  /mfa/i,
  /\b\d{4,8}\b.*(?:code|pin|otp)/,
];

const SECURITY_PATTERNS = [
  /security.?alert/i,
  /unusual.?sign.?in/i,
  /new.?device/i,
  /suspicious/i,
  /password.?changed/i,
  /account.?recovery/i,
  /login.?attempt/i,
  /unauthorized/i,
  /breach/i,
  /compromised/i,
];

export async function classifyEmail(request: ClassifyRequest): Promise<ClassificationResult> {
  if (hasOpenAI) {
    try {
      return await classifyWithAI(request);
    } catch {
      return classifyLocally(request);
    }
  }
  return classifyLocally(request);
}

function classifyLocally(request: ClassifyRequest): ClassificationResult {
  const { subject, bodyText, from } = request;
  const lowerSubject = subject.toLowerCase();
  const lowerBody = (bodyText || "").toLowerCase();
  const lowerFrom = from.toLowerCase();
  const combined = `${lowerSubject} ${lowerBody}`;

  const category = detectCategory(combined, lowerFrom);
  const categoryGroup = getCategoryGroup(category);
  const priorityScore = calculatePriority(category, combined, lowerFrom);
  const isImportant = categoryGroup === "critical" || categoryGroup === "important";
  const estimatedReadTime = estimateReadTime(bodyText);

  const deadlines = extractDeadlines(combined);
  const tasks = extractTasks(combined);
  const people = extractPeople(bodyText);
  const links = extractLinks(bodyText);
  const meetingInfo = extractMeetingInfo(combined);

  return {
    category,
    categoryGroup,
    priorityScore,
    isImportant,
    estimatedReadTimeSeconds: estimatedReadTime,
    deadlines: deadlines.length > 0 ? deadlines : undefined,
    tasks: tasks.length > 0 ? tasks : undefined,
    people: people.length > 0 ? people : undefined,
    links: links.length > 0 ? links : undefined,
    meetingInfo: meetingInfo || undefined,
    confidence: 0.7,
  };
}

async function classifyWithAI(request: ClassifyRequest): Promise<ClassificationResult> {
  const { default: OpenAI } = await import("openai");
  const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

  const prompt = `Classify this email and extract structured information:

From: ${request.from}
Subject: ${request.subject}
Date: ${request.date}
Body: ${(request.bodyText || "").slice(0, 3000)}

Respond with JSON:
{
  "category": "one of: otp, password_reset, security_alert, bank_transaction, bug_bounty_response, interview_invitation, internship_acceptance, professor, assignment, github, invoice, meeting, recruiter, college, friends, general, advertisement, newsletter, marketing, shopping_promotion, spam",
  "priorityScore": 0-100,
  "summary": "2-3 sentence summary",
  "deadlines": [{"title": "...", "date": "YYYY-MM-DD"}],
  "tasks": [{"title": "..."}],
  "people": ["name1", "name2"],
  "links": ["url1"],
  "meetingInfo": {"title": "...", "date": "...", "time": "...", "participants": ["..."], "location": "..."},
  "estimatedReadTimeSeconds": number
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are an email classification assistant. Extract structured data from emails." },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.1,
    max_tokens: 1000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("AI response empty");

  const data = JSON.parse(content);
  const category = (data.category || "general") as Category;
  const categoryGroup = getCategoryGroup(category);

  return {
    category,
    categoryGroup: data.categoryGroup || categoryGroup,
    priorityScore: data.priorityScore ?? calculatePriority(category, "", ""),
    isImportant: data.priorityScore ? data.priorityScore >= 60 : categoryGroup === "critical" || categoryGroup === "important",
    estimatedReadTimeSeconds: data.estimatedReadTimeSeconds || estimateReadTime(request.bodyText),
    summary: data.summary,
    deadlines: data.deadlines?.map((d: { title: string; date: string }) => ({ ...d, date: new Date(d.date) })),
    tasks: data.tasks,
    people: data.people,
    links: data.links,
    meetingInfo: data.meetingInfo,
    confidence: 0.9,
  };
}

function detectCategory(combined: string, from: string): Category {
  if (OTP_PATTERNS.some((p) => p.test(combined))) return "otp";
  if (/password.?reset|reset.?password|forgot.?password/i.test(combined)) return "password_reset";
  if (SECURITY_PATTERNS.some((p) => p.test(combined))) return "security_alert";
  if (/transaction|debited|credited|withdrawn|deposited|banking|account.?balance/i.test(combined)) return "bank_transaction";
  if (/bug.?bounty|vulnerability.?report|hackerone|bugcrowd|submission.?received/i.test(combined)) return "bug_bounty_response";
  if (/interview|technical.?round|onsite|phone.?screen|hiring.?manager/i.test(combined)) return "interview_invitation";
  if (/internship|intern.?offer|intern.?acceptance|congratulations.?intern/i.test(combined)) return "internship_acceptance";
  if (/professor|dr\.|ph\.d|research|academic|syllabus|office.?hours/i.test(combined)) return "professor";
  if (/assignment|homework|due.?date|submit.?by|deadline/i.test(combined)) return "assignment";
  if (/github|pull.?request|commit|issue|repository|merge|deploy/i.test(combined)) return "github";
  if (/invoice|receipt|billing|payment.?due|subscription/i.test(combined)) return "invoice";
  if (/meeting|schedule|calendar|invite|zoom|teams|google.?meet|conference/i.test(combined)) return "meeting";
  if (/recruiter|job.?opportunity|position|career|hiring|opening|role.?at/i.test(combined)) return "recruiter";
  if (/college|university|course|class|semester|exam|grade/i.test(combined)) return "college";
  if (from.includes("linkedin") || /connection|invitation to connect/i.test(combined)) return "friends";
  if (/unsubscribe|advertisement|promo|offer|discount|sale|buy.?now/i.test(combined)) return "advertisement";
  if (/newsletter|weekly.?digest|monthly.?update/i.test(combined)) return "newsletter";
  if (/marketing|campaign|brand|sponsor/i.test(combined)) return "marketing";
  if (/shop|store|cart|order|shipping|delivery|amazon|flipkart/i.test(combined)) return "shopping_promotion";

  const fromDomain = from.split("@")[1]?.toLowerCase() || "";
  if (fromDomain.includes("linkedin")) return "recruiter";
  if (fromDomain.includes("github")) return "github";

  return "general";
}

function getCategoryGroup(category: Category): CategoryGroup {
  for (const [group, cats] of Object.entries(CATEGORIES)) {
    if ((cats as readonly string[]).includes(category)) return group as CategoryGroup;
  }
  return "normal";
}

function calculatePriority(category: Category, combined: string, from: string): number {
  const group = getCategoryGroup(category);
  const baseScores: Record<CategoryGroup, number> = {
    critical: 85,
    important: 65,
    normal: 40,
    ignore: 15,
    spam: 5,
  };

  let score = baseScores[group] || 40;

  if (combined.includes("urgent") || combined.includes("asap")) score += 10;
  if (combined.includes("deadline")) score += 8;
  if (combined.includes("action required") || combined.includes("requires response")) score += 7;

  if (IMPORTANT_SENDERS.some((s) => from.toLowerCase().includes(s))) score += 10;

  return Math.min(100, Math.max(0, score));
}

function estimateReadTime(bodyText: string): number {
  const words = (bodyText || "").split(/\s+/).length;
  return Math.max(10, Math.round((words / 200) * 60));
}

function extractDeadlines(text: string) {
  const deadlines: { title: string; date: Date; description?: string }[] = [];
  const datePattern = /(?:due|deadline|submit|by|before)\s*:?\s*(\w+\s+\d{1,2},?\s*\d{4}|\d{1,2}\/\d{1,2}\/\d{4}|\w+\s+\d{1,2})/gi;
  let match;
  while ((match = datePattern.exec(text)) !== null) {
    deadlines.push({
      title: match[0].slice(0, 80),
      date: new Date(match[1]),
    });
  }
  return deadlines;
}

function extractTasks(text: string) {
  const tasks: { title: string }[] = [];
  const taskPattern = /(?:TODO|To.?do|Task|Action item|Follow.?up):\s*(.+)/gi;
  let match;
  while ((match = taskPattern.exec(text)) !== null) {
    tasks.push({ title: match[1].trim().slice(0, 150) });
  }
  return tasks;
}

function extractPeople(text: string) {
  const people: string[] = [];
  const namePattern = /(?:regards|sincerely|best|cheers|thanks),?\s*\n?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})/g;
  let match;
  while ((match = namePattern.exec(text)) !== null) {
    if (!people.includes(match[1])) people.push(match[1]);
  }
  return people;
}

function extractLinks(text: string) {
  const urlPattern = /https?:\/\/[^\s<>"']+/g;
  return (text.match(urlPattern) || []).slice(0, 10);
}

function extractMeetingInfo(text: string) {
  const meetingPatterns = [
    /(?:meeting|call|interview|sync)\s*(?:titled?|about|:)?\s*[""]?([^""\n]+)[""]?/i,
    /(?:zoom|teams|google.?meet|webex)\s*(?:link|invite|meeting)?\s*:?\s*(https?:\/\/[^\s<>]+)/i,
  ];

  let title: string | undefined;
  let link: string | undefined;

  for (const pattern of meetingPatterns) {
    const match = text.match(pattern);
    if (match) {
      if (pattern.source.includes("title")) title = match[1]?.trim();
      else link = match[1]?.trim();
    }
  }

  if (title || link) {
    const timePattern = /(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm))/;
    const timeMatch = text.match(timePattern);
    return {
      title: title || "Meeting",
      time: timeMatch?.[1],
      link,
    };
  }

  return undefined;
}

export async function batchClassify(
  emails: ClassifyRequest[]
): Promise<Map<string, ClassificationResult>> {
  const results = new Map<string, ClassificationResult>();
  const batchSize = 10;

  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize);
    const classifications = await Promise.all(
      batch.map((e) => classifyEmail(e))
    );
    batch.forEach((email, idx) => {
      results.set(email.emailId, classifications[idx]);
    });
  }

  return results;
}
