"use client";
import type { NextPage } from "next";
import { useCallback } from "react";
import { Box } from "@mui/material";
import Image from "next/image";
import styles from "./sidebar-manu.module.css";

export type SidebarManuType = {
  className?: string;
};

const SidebarManu: NextPage<SidebarManuType> = ({ className = "" }) => {
  const onGroupImageClick = useCallback(() => {
    // Please sync "StudentExplorePage" to the project
  }, []);

  return (
    <Box className={[styles.sidebarManu, className].join(" ")}>
      <Box className={styles.sidebarManuChild} />
      <Box className={styles.frameParent}>
        <Image
          className={styles.frameChild}
          loading="lazy"
          width={65}
          height={65}
          sizes="100vw"
          alt=""
          src="/Group-26@2x.png"
        />
        <Image
          className={styles.frameItem}
          loading="lazy"
          width={65}
          height={65}
          sizes="100vw"
          alt=""
          src="/Group-25@2x.png"
          onClick={onGroupImageClick}
        />
        <Image
          className={styles.frameChild}
          loading="lazy"
          width={65}
          height={65}
          sizes="100vw"
          alt=""
          src="/Group-24@2x.png"
        />
        <Image
          className={styles.frameChild}
          loading="lazy"
          width={65}
          height={65}
          sizes="100vw"
          alt=""
          src="/Group-23@2x.png"
        />
        <Image
          className={styles.frameChild}
          loading="lazy"
          width={65}
          height={65}
          sizes="100vw"
          alt=""
          src="/Group-22@2x.png"
        />
        <Image
          className={styles.frameChild}
          loading="lazy"
          width={65}
          height={65}
          sizes="100vw"
          alt=""
          src="/Group-27@2x.png"
        />
        <Image
          className={styles.frameChild}
          loading="lazy"
          width={65}
          height={65}
          sizes="100vw"
          alt=""
          src="/Group-21@2x.png"
        />
      </Box>
      <Image
        className={styles.sidebarManuItem}
        loading="lazy"
        width={65}
        height={65}
        sizes="100vw"
        alt=""
        src="/Group-20@2x.png"
      />
    </Box>
  );
};

export default SidebarManu;
