"use client";

import { useRef, useState } from "react";

export default function OtpInput({ length = 8, onComplete }) {
  const [code, setCode] = useState(Array(length).fill(""));
  const inputRefs = useRef([]);

  const handleChange = (value, index) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    // Keep only the last character entered
    const val = value.substring(value.length - 1);
    newCode[index] = val;
    setCode(newCode);

    // Auto-advance to next input if value was entered
    if (val && index < length - 1) {
      inputRefs.current[index + 1].focus();
    }

    // Trigger completion callback if all boxes are filled
    const combinedCode = newCode.join("");
    if (combinedCode.length === length) {
      onComplete(combinedCode);
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      if (!code[index] && index > 0) {
        // If current box is empty, clear previous box and focus it
        const newCode = [...code];
        newCode[index - 1] = "";
        setCode(newCode);
        inputRefs.current[index - 1].focus();
      } else {
        // Clear current box
        const newCode = [...code];
        newCode[index] = "";
        setCode(newCode);
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    // Only allow digits
    if (!/^\d+$/.test(pastedData)) return;

    const digits = pastedData.substring(0, length).split("");
    const newCode = [...code];

    for (let i = 0; i < length; i++) {
      if (digits[i]) {
        newCode[i] = digits[i];
      }
    }

    setCode(newCode);

    // Focus the last filled box or final box
    const focusIndex = Math.min(digits.length, length - 1);
    if (inputRefs.current[focusIndex]) {
      inputRefs.current[focusIndex].focus();
    }

    const combinedCode = newCode.join("");
    if (combinedCode.length === length) {
      onComplete(combinedCode);
    }
  };

  return (
    <div className="flex gap-1.5 sm:gap-2 justify-center" onPaste={handlePaste}>
      {code.map((num, idx) => (
        <input
          key={idx}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={num}
          ref={(el) => (inputRefs.current[idx] = el)}
          onChange={(e) => handleChange(e.target.value, idx)}
          onKeyDown={(e) => handleKeyDown(e, idx)}
          className="w-9 h-9 sm:w-12 sm:h-12 text-center text-lg sm:text-xl font-bold rounded-xl sm:rounded-2xl bg-brand-bg/50 dark:bg-brand-bg/25 text-brand-dark focus:bg-brand-card focus:ring-2 focus:ring-brand-primary/20 focus:outline-none transition-all duration-200 shadow-sm border border-brand-dark/5"
        />
      ))}
    </div>
  );
}
