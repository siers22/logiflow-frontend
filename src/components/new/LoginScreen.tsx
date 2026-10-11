"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, Check, Eye, EyeOff, LockKeyhole, Moon, Sun, Truck } from "lucide-react";
import { useUser } from "@/lib/UserContext";
import { useTheme } from "@/lib/ThemeContext";
import { ApiError } from "@/lib/api";
import { BrandMark } from "./BrandMark";
import styles from "./LoginScreen.module.css";

type Mode = "login" | "register";

export function LoginScreen() {
  const { login, register } = useUser();
  const { theme, toggleTheme } = useTheme();
  const [mode, setMode] = useState<Mode>("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setPassword("");
    setConfirmation("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (mode === "register") {
      if (fullName.trim().length < 2) return setError("Укажите имя не короче двух символов.");
      if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
        return setError("Пароль: минимум 8 символов, заглавная буква и цифра.");
      }
      if (password !== confirmation) return setError("Пароли не совпадают.");
    }
    setSubmitting(true);
    try {
      if (mode === "login") await login(email.trim(), password);
      else await register(email.trim(), password, fullName.trim());
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Не удалось подключиться. Попробуйте ещё раз.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.story} aria-label="О платформе">
        <div className={styles.storyTop}>
          <BrandMark className={styles.brandLight} />
          <span className={styles.storyTag}>ЛОГИСТИКА БЕЗ ЛИШНЕГО ШУМА</span>
        </div>
        <div className={styles.storyCenter}>
          <span className={styles.eyebrow}>ЕДИНАЯ РАБОЧАЯ СРЕДА</span>
          <h1>Всё движение.<br /><em>В одном месте.</em></h1>
          <p>Заказы, команда и маршруты соединены в понятный рабочий процесс.</p>
          <div className={styles.flowCard} aria-label="Этапы доставки">
            <div className={styles.flowHead}>
              <span className={styles.flowIcon}><Truck size={19} aria-hidden="true" /></span>
              <div><strong>Путь доставки</strong><small>От заявки до вручения</small></div>
              <span className={styles.flowDot} />
            </div>
            <div className={styles.flowSteps}>
              <span><Check size={14} aria-hidden="true" /> Заявка</span>
              <span className={styles.flowLine} aria-hidden="true" />
              <span><Check size={14} aria-hidden="true" /> Назначение</span>
              <span className={styles.flowLine} aria-hidden="true" />
              <span><Truck size={14} aria-hidden="true" /> Доставка</span>
            </div>
          </div>
        </div>
        <div className={styles.storyBottom}>Одна платформа для каждого участника перевозки.</div>
      </section>

      <section className={styles.formSide} aria-label={mode === "login" ? "Вход" : "Регистрация"}>
        <div className={styles.formTop}>
          <span className={styles.mobileBrand}><BrandMark /></span>
          <button className={styles.themeButton} type="button" onClick={(event) => toggleTheme(event)} aria-label={theme === "dark" ? "Светлая тема" : "Тёмная тема"}>
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
        <div className={styles.formWrap}>
          <div className={styles.formIntro}>
            <span className={styles.formEyebrow}><LockKeyhole size={14} aria-hidden="true" /> ЛИЧНЫЙ КАБИНЕТ</span>
            <h2>{mode === "login" ? "С возвращением" : "Начните с LogiFlow"}</h2>
            <p>{mode === "login" ? "Войдите, чтобы продолжить работу с доставками." : "Создайте аккаунт клиента для оформления и отслеживания заказов."}</p>
          </div>

          <div className={styles.modeSwitch} role="tablist" aria-label="Режим входа">
            <button type="button" role="tab" aria-selected={mode === "login"} className={mode === "login" ? styles.activeMode : ""} onClick={() => switchMode("login")}>Вход</button>
            <button type="button" role="tab" aria-selected={mode === "register"} className={mode === "register" ? styles.activeMode : ""} onClick={() => switchMode("register")}>Регистрация</button>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            {mode === "register" && <label>Полное имя<input type="text" autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Как к вам обращаться" required disabled={submitting} /></label>}
            <label>Email<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@company.ru" required disabled={submitting} /></label>
            <label>Пароль<div className={styles.passwordField}><input type={showPassword ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Введите пароль" required disabled={submitting} /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label>
            {mode === "register" && <label>Повторите пароль<input type={showPassword ? "text" : "password"} autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="Повторите пароль" required disabled={submitting} /></label>}
            {error && <p className={styles.error} role="alert">{error}</p>}
            <button className={styles.submit} type="submit" disabled={submitting}><span>{submitting ? "Подождите..." : mode === "login" ? "Войти в систему" : "Создать аккаунт"}</span><ArrowRight size={18} aria-hidden="true" /></button>
          </form>
          <p className={styles.formNote}>{mode === "login" ? "Нет аккаунта?" : "Уже зарегистрированы?"} <button type="button" onClick={() => switchMode(mode === "login" ? "register" : "login")}>{mode === "login" ? "Зарегистрироваться" : "Войти"}</button></p>
        </div>
        <div className={styles.formBottom}>LogiFlow · Управление перевозками</div>
      </section>
    </main>
  );
}
