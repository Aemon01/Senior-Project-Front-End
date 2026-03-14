"use client";
import type { NextPage } from "next";
import { Typography, Box } from "@mui/material";
import styles from "./title.module.css";

export type TitleType = {
  className?: string;
};

const Title: NextPage<TitleType> = ({ className = "" }) => {
  return (
    <Box className={[styles.title2, className].join(" ")}>
      <Typography
        className={styles.title22}
        variant="inherit"
        variantMapping={{ inherit: "h3" }}
        sx={{ fontWeight: "400" }}
      >
        Skill Progress graph
      </Typography>
    </Box>
  );
};

export default Title;
