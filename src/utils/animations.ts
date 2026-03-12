import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const EASE_SMOOTH = "power2.out";

export function createScrollTimeline(trigger: string, config?: Record<string, unknown>) {
  return gsap.timeline({
    scrollTrigger: {
      trigger,
      start: 'top 75%',
      end: 'bottom 25%',
      scrub: 1,
      ...config,
    }
  });
}

export function animateNodeIn(tl: gsap.core.Timeline, selector: string, position: number) {
  tl.fromTo(selector,
    { opacity: 0, scale: 0.8, y: 20 },
    { opacity: 1, scale: 1, y: 0, duration: 0.3, ease: EASE_SMOOTH },
    position
  );
}

export function animateArrowDraw(tl: gsap.core.Timeline, selector: string, position: number) {
  tl.fromTo(selector,
    { strokeDashoffset: 1000 },
    { strokeDashoffset: 0, duration: 0.3, ease: EASE_SMOOTH },
    position
  );
}

export function animateLabelFade(tl: gsap.core.Timeline, selector: string, position: number) {
  tl.fromTo(selector,
    { opacity: 0, x: -10 },
    { opacity: 1, x: 0, duration: 0.2, ease: EASE_SMOOTH },
    position
  );
}
