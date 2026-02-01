const fs = require("fs");
const path = require("path");
const rabbit = require("rabbit-node");

async function startConversion() {
  const SQL_PATH = path.join(__dirname, "../source/dictionary2.sql");
  const OUT_PATH = path.join(__dirname, "../extension/data/ornagai.json");

  const sqlContent = fs.readFileSync(SQL_PATH, "utf8");
  const dict = {};
  let recordCount = 0;

  console.log("🚀 Ornagai SQL to Unicode JSON is running...");

  // dblist VALUES(1, 'word', 'type', 'meaning', '1', 0); ပုံစံကို ဖမ်းမယ်
  // Regex ကို ပိုပြီး တိကျအောင် ပြင်ထားပါတယ်
  const recordRegex = /VALUES\s*\((.*?)\);/gs;
  const rowRegex = /\(\s*\d+\s*,\s*'(.*?)'\s*,\s*'(.*?)'\s*,\s*'(.*?)'/g;

  let match;
  while ((match = rowRegex.exec(sqlContent)) !== null) {
    const rawWord = match[1];
    const rawType = match[2];
    const rawMeaning = match[3];

    // ၁။ Zawgyi to Unicode အရင်ပြောင်း
    let uni = rabbit.zg2uni(rawMeaning);

    // ၂။ Space တွေ၊ Pipe တွေကို ရှင်းထုတ်မယ်
    let cleanMM = uni
      .replace(/\|/g, "") // Pipe ဖြုတ်
      .replace(/\\r|\\n/g, " ") // Newline ရှင်း
      // မြန်မာစာလုံးအချင်းချင်းကြားက အပို space တွေကို ရှင်းတဲ့ အဓိက Regex
      .replace(/([\u1000-\u104F])\s+(?=[\u1000-\u104F\u102B-\u103E])/g, "$1")
      .replace(/\s+/g, " ") // အပို space ကြီးတွေကို တစ်ခုတည်းဖြစ်အောင်လုပ်
      .trim();

    // ၃။ Word ကို Clean လုပ်မယ်
    const wordKey = rawWord.trim().toLowerCase();

    dict[wordKey] = {
      type: rawType.trim() || "unknown",
      mm: cleanMM,
    };

    recordCount++;
    if (recordCount % 1000 === 0) process.stdout.write(`\r⏳ Converted: ${recordCount} words...`);
  }

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(dict, null, 2), "utf8");
  console.log(`\n\n✨ Success! Total ${recordCount} entries converted.`);
}

startConversion().catch(console.error);
