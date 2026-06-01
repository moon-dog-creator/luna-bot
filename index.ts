import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { Bot, webhookCallback } from "npm:grammy@1.22.4";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const bot = new Bot(Deno.env.get("TELEGRAM_BOT_TOKEN")!);
const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

bot.command("start", async (ctx) => {
  const responseId = ctx.match?.trim();
  if (!responseId) return ctx.reply("Привет, ты наверное прошел чек-ап. Подтверди, пожалуйста, свой тг и я пришлю тебе результат.");
  const { data } = await supabase.from("tally_results").select("*").eq("response_id", responseId).maybeSingle();
  if (!data) return ctx.reply("Не нашёл твой результат. Пройди тест ещё раз - https://tally.so/r/LZ6kLJ.");
  const userTag = ctx.from?.username? `@${ctx.from.username}` : null;
  if (data.tg_username && userTag && data.tg_username.toLowerCase()!== userTag.toLowerCase()) return ctx.reply(`Этот результат для ${data.tg_username}. Я такой же человек, проверь свой тег в форме.`);
  const blocks = [{ name: "Тело", score: data.block1, emoji: "🟦" },{ name: "Голова", score: data.block2, emoji: "🟨" },{ name: "Связи", score: data.block3, emoji: "🟩" },{ name: "Смысл", score: data.block4, emoji: "🟪" },];
  const lowest = [...blocks].sort((a,b)=>a.score-b.score)[0];
  const text = `Привет, ${ctx.from.first_name}. Я Лунный Пёс, обычный парень 29 лет.\n\nПроверим, где сейчас просело:\n\n${blocks.map(b=>`${b.emoji} ${b.name}: ${b.score}/9`).join("\n")}\n\nВ общем, сейчас сильнее всего проседает ${lowest.name.toLowerCase()}. Поэтому остальное и не клеится.\n\nЭто не лень у тебя, банально и просто нет ресурса.\n\nСделай сегодня две простые вещи: 3 минуты дыхания носом + 10 минут прогулки без телефона. Проверим вечером — стало легче хотя бы на 1 балл?`;
  await ctx.reply(text, { reply_markup: { inline_keyboard: [[{ text: "Дай День 1", callback_data: "day1" }],[{ text: "Как это работает", callback_data: "how" }],[{ text: "Поговорить со мной", url: "https://t.me/luna_pes" }],},});
});
bot.callbackQuery("day1", (ctx) => ctx.reply("День 1 — пришлю завтра в 9:00. Пока сделай дыхание."));
bot.callbackQuery("how", (ctx) => ctx.reply("Четыре опоры: тело, голова, связи, смысл. Находим где просело — даю одну практику. А ты проверяешь на себе"));
serve(webhookCallback(bot, "std/http"));
