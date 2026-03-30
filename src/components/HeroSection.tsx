import { motion } from 'framer-motion';

const TICKERS = ['SBER', 'AAPL', 'GAZP', 'TSLA', 'NVDA', 'BTC', 'S&P500', 'RTS'];

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-white/8 py-8 px-4 sm:px-6">
      <div className="absolute -top-20 -left-20 w-72 h-72 bg-[#ccff00]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 right-10 w-56 h-56 bg-violet-500/8 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 bg-[#ccff00]/10 border border-[#ccff00]/20 rounded-full px-3 py-1 mb-4"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-[#ccff00] animate-pulse" />
          <span className="text-[#ccff00] text-xs font-semibold tracking-widest uppercase">
            Финансовый словарь · 20 терминов · таймер и score
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight text-white mb-3"
        >
          Проверь свою{' '}
          <span className="text-[#ccff00] drop-shadow-[0_0_20px_rgba(204,255,0,0.4)]">
            финансовую
          </span>{' '}
          <br className="hidden sm:block" />
          грамотность
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="text-white/50 text-sm sm:text-base max-w-2xl leading-relaxed"
        >
          Разгадывай термины фондового рынка, проверяй ответы, следи за таймером и
          набирай очки за точность. Каждое собранное слово открывает карточку с
          теорией и делает прохождение заметно глубже.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex gap-2 mt-5 overflow-hidden"
        >
          {TICKERS.map((ticker, index) => (
            <motion.span
              key={ticker}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.05 }}
              className="flex-shrink-0 font-mono text-xs px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white/40"
            >
              {ticker}
            </motion.span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
