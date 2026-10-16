import React, { useEffect, useRef } from 'react';

const ScrollReveal = ({ children, className = '', delayIndex = 0 }) => {
  const ref = useRef(null);

  useEffect(() => {
    // Respect reduced motion setting
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const currentRef = ref.current;
    if (!currentRef) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('scroll-visible');
          }
        });
      },
      {
        threshold: 0.08,
        rootMargin: '20px 0px -30px 0px',
      }
    );

    observer.observe(currentRef);

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  const delayClass = delayIndex > 0 ? `scroll-stagger-${Math.min(delayIndex, 5)}` : '';

  return (
    <div ref={ref} className={`scroll-reveal ${delayClass} ${className}`}>
      {children}
    </div>
  );
};

export default ScrollReveal;
