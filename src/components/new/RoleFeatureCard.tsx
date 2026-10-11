"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";
import styles from "./RoleFeatureCard.module.css";

export function RoleFeatureCard({
  eyebrow,
  title,
  description,
  action,
  onAction,
  className = "",
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: string;
  onAction?: () => void;
  className?: string;
}) {
  return <section className={`${styles.card} ${className}`}>
    <div className={styles.copy}>
      <span>{eyebrow}</span>
      <h2>{title}</h2>
      <p>{description}</p>
      {action && onAction && <button type="button" onClick={onAction}>{action} <ArrowRight size={15} aria-hidden="true" /></button>}
    </div>
    <Image className={styles.vehicle} src="/images/dashboard-van.png" alt="" width={360} height={240} />
  </section>;
}
