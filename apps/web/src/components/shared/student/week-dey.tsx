"use client";
import type { NextPage } from "next";
import { type CSSProperties } from "react";
import { Box } from "@mui/material";
import styles from "./week-dey.module.css";

export type WeekDeyType = {
  className?: string;
  text?: string;

  /** Variant props */
  weekend?: CSSProperties["weekend"];
};

const WeekDey: NextPage<WeekDeyType> = ({
  className = "",
  weekend = false,
  text,
}) => {
  return (
    <Box className={[styles.root, className].join(" ")} data-weekend={weekend}>
      <div className={styles.text}>{text}</div>
    </Box>
  );
};

export default WeekDey;
