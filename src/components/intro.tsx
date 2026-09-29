"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import "./intro.css";

const storageKey = "kepil_intro_seen";
let dismissedInThisTab = false;
const IntroContext = createContext<(() => void) | null>(null);

const steps = [
  {
    title: "Объекты и гарантия",
    text: "В KEPIL хранятся городские объекты, их контракты, подрядчики и гарантийные сроки.",
  },
  {
    title: "Дефект и претензия",
    text: "Если возникает проблема, система связывает дефект с объектом, проверяет гарантию и создаёт претензию.",
  },
  {
    title: "Ремонт и проверка",
    text: "Подрядчик выполняет работу, прикладывает доказательства, а инспектор подтверждает результат. История сохраняется в системе.",
  },
] as const;

export function IntroProvider({ children }: { children: ReactNode }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [step, setStep] = useState(0);
  const current = steps[step];

  const openIntro = useCallback(() => {
    setStep(0);
    if (!dialogRef.current?.open) dialogRef.current?.showModal();
  }, []);

  useEffect(() => {
    if (dismissedInThisTab) return;
    try {
      if (localStorage.getItem(storageKey) === "true") return;
    } catch {
      // Storage can be unavailable in private or restricted browser contexts.
    }
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => dialog?.close();
  }, []);

  const dismiss = () => {
    dismissedInThisTab = true;
    try {
      localStorage.setItem(storageKey, "true");
    } catch {
      // Dismissal still works, and is remembered for this tab's lifetime.
    }
    dialogRef.current?.close();
  };

  return (
    <IntroContext.Provider value={openIntro}>
      {children}
      <dialog
        ref={dialogRef}
        className="kepil-intro"
        aria-labelledby="intro-title"
        aria-describedby="intro-description"
        onCancel={(event) => {
          event.preventDefault();
          dismiss();
        }}
        onKeyDown={(event) => {
          if (event.key !== "Tab") return;
          const buttons = Array.from(
            event.currentTarget.querySelectorAll<HTMLButtonElement>("button:not(:disabled)"),
          );
          const currentIndex = buttons.indexOf(document.activeElement as HTMLButtonElement);
          const nextIndex = currentIndex < 0
            ? event.shiftKey ? buttons.length - 1 : 0
            : (currentIndex + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length;
          buttons[nextIndex]?.focus();
          event.preventDefault();
        }}
      >
        <div className="intro-header">
          <span className="eyebrow">ЗНАКОМСТВО С KEPIL</span>
          <button type="button" className="intro-skip" onClick={dismiss}>
            Пропустить
          </button>
        </div>
        <div className="intro-progress" aria-label={`Шаг ${step + 1} из 3`}>
          <span>{step + 1} / 3</span>
          <div className="intro-progress-track" aria-hidden="true">
            {steps.map((item, index) => (
              <span key={item.title} className={index <= step ? "is-active" : ""} />
            ))}
          </div>
        </div>
        <div className="intro-content" aria-live="polite" aria-atomic="true">
          <div className="intro-step" key={step}>
            <h2 id="intro-title">{current.title}</h2>
            <p id="intro-description">{current.text}</p>
            {step === 2 && (
              <p className="intro-summary">
                KEPIL контролирует не только проблему, но и ответственность за её устранение.
              </p>
            )}
          </div>
        </div>
        <div className="intro-actions">
          <button
            type="button"
            className="button secondary"
            disabled={step === 0}
            onClick={() => setStep((previous) => Math.max(0, previous - 1))}
          >
            Назад
          </button>
          <button
            type="button"
            className="button primary"
            autoFocus
            onClick={() => step === 2 ? dismiss() : setStep((previous) => previous + 1)}
          >
            {step === 2 ? "Начать работу" : "Далее"}
          </button>
        </div>
      </dialog>
    </IntroContext.Provider>
  );
}

export function IntroTrigger() {
  const openIntro = useContext(IntroContext);
  if (!openIntro) return null;
  return (
    <button type="button" className="button secondary intro-trigger" onClick={openIntro}>
      Как пользоваться KEPIL
    </button>
  );
}
