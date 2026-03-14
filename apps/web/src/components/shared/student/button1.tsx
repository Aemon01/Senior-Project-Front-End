"use client";
import type { NextPage } from "next";
import Image from "next/image";
import TopBarMenuFont from "./top-bar-menu-font";
import styles from "./button1.module.css";

export type Button1Type = {
  className?: string;
};

const Button1: NextPage<Button1Type> = ({ className = "" }) => {
  return (
    <button className={[styles.button4, className].join(" ")}>
      <Image
        className={styles.button4Child}
        width={58}
        height={17.3}
        sizes="100vw"
        alt=""
        src="/Rectangle-28.svg"
      />
      <Image
        className={styles.rectangle28Stroke}
        width={58}
        height={17.3}
        sizes="100vw"
        alt=""
      />
      <TopBarMenuFont />
      <Image
        className={styles.rectangle28Stroke2}
        width={58}
        height={17.3}
        sizes="100vw"
        alt=""
        src="/Rectangle-28-Stroke.svg"
      />
    </button>
  );
};

export default Button1;
