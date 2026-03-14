"use client";
import type { NextPage } from "next";
import { type CSSProperties } from "react";
import { Box } from "@mui/material";
import styles from "./dey-number.module.css";

export type DeyNumberType = {
  className?: string;
  text?: string;
  fill?: boolean;
  strok?: boolean;
  weekend?: boolean;
};

const DeyNumber: NextPage<DeyNumberType> = ({
  className = "",
  fill = false,
  strok = false,
  weekend = false,
  text,
}) => {
  return (
    <Box
      className={[styles.root, className].join(" ")}
      data-fill={fill}
      data-strok={strok}
      data-weekend={weekend}
    >
      <div className={styles.text}>{text}</div>
    </Box>
  );
};

export default DeyNumber;
