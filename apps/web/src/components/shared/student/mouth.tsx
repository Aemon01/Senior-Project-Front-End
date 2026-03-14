"use client";
import type { NextPage } from "next";
import { type CSSProperties } from "react";
import { Typography, Box } from "@mui/material";
import styles from "./mouth.module.css";

export type MouthType = {
  className?: string;

  /** Variant props */
  fill?: CSSProperties["fill"];
};

const Mouth: NextPage<MouthType> = ({ className = "", fill = false }) => {
  return (
    <Box className={[styles.atomsMouth, className].join(" ")} data-fill={fill}>
      <Typography
        className={styles.text}
        variant="inherit"
        variantMapping={{ inherit: "h3" }}
        sx={{ fontWeight: "900" }}
      >
        October
      </Typography>
    </Box>
  );
};

export default Mouth;
