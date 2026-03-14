"use client";
import type { NextPage } from "next";
import { Box } from "@mui/material";
import styles from "./top-bar-menu-font.module.css";

export type TopBarMenuFontType = {
  className?: string;
};

const TopBarMenuFont: NextPage<TopBarMenuFontType> = ({ className = "" }) => {
  return (
    <Box className={[styles.topBarMenuFont, className].join(" ")}>
      <div className={styles.topBarMenu}>view all</div>
    </Box>
  );
};

export default TopBarMenuFont;
