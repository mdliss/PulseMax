'use client';

import { useEffect, useState } from 'react';

interface AnimatedCounterProps {
  value: number | string;
  className?: string;
  style?: React.CSSProperties;
}

export function AnimatedCounter({ value, className = '', style = {} }: AnimatedCounterProps) {
  const [currentValue, setCurrentValue] = useState(value.toString());

  useEffect(() => {
    setCurrentValue(value.toString());
  }, [value]);

  const chars = currentValue.split('');

  return (
    <div className={`inline-flex items-baseline ${className}`} style={{ ...style, fontVariantNumeric: 'tabular-nums' }}>
      {chars.map((char, index) => {
        const isDigit = /\d/.test(char);

        if (!isDigit) {
          return (
            <span key={`${index}-static`} style={{ display: 'inline-block', lineHeight: 'inherit' }}>
              {char}
            </span>
          );
        }

        const digit = parseInt(char);

        return (
          <span
            key={index}
            className="digit-container"
            style={{
              display: 'inline-block',
              position: 'relative',
              height: '1em',
              width: '0.6em',
              overflow: 'hidden',
              verticalAlign: 'baseline',
            }}
          >
            <span
              className="digit-roller"
              style={{
                display: 'block',
                position: 'relative',
                transition: 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
                transform: `translateY(${-digit}em)`,
              }}
            >
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <span
                  key={num}
                  style={{
                    display: 'block',
                    height: '1em',
                    lineHeight: '1em',
                    textAlign: 'center',
                  }}
                >
                  {num}
                </span>
              ))}
            </span>
          </span>
        );
      })}
    </div>
  );
}
