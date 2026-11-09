import { ArrowDownRight, CircleDot, MoveUpRight } from 'lucide-react';
import { CROSSWORD_ENTRIES } from '../data/crosswordData';

export default function HeroSection() {
  return (
    <section className="fc-hero" aria-labelledby="fc-title">
      <div className="fc-hero-copy">
        <div className="fc-eyebrow"><span className="fc-eyebrow-dot" /> ИНТЕРАКТИВНЫЙ КРОССВОРД <span>— ВЫПУСК 001</span></div>
        <h1 id="fc-title">Рынок.<br /><em>В словах.</em></h1>
        <p>Финансы становятся понятнее, когда находишь правильные слова. Разгадай понятия, собери кроссворд и открой теорию за каждым ответом.</p>
        <div className="fc-hero-actions">
          <a href="#play" className="fc-hero-play">К кроссворду <ArrowDownRight size={17} /></a>
          <div className="fc-hero-footnote"><CircleDot size={15} /><span>Прогресс сохраняется автоматически</span></div>
        </div>
      </div>
      <div className="fc-hero-index" aria-hidden="true">
        <div className="fc-hero-index-top"><span>FINANCIAL<br/>LITERACY</span><MoveUpRight size={20}/></div>
        <span className="fc-hero-index-number">{String(CROSSWORD_ENTRIES.length).padStart(2, '0')}</span>
        <div className="fc-hero-index-bottom"><span>СЛОВ<br />ДЛЯ РАЗГАДЫВАНИЯ</span><ArrowDownRight size={27}/></div>
      </div>
    </section>
  );
}
