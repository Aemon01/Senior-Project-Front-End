"use client";
import type { NextPage } from "next";
import { useMemo, type CSSProperties } from "react";
import { Box } from "@mui/material";
import styles from "./body.module.css";

export type BodyType = {
  className?: string;
  body?: string;

  /** Style props */
  bodyWidth?: CSSProperties["width"];
  bodyHeight?: CSSProperties["height"];
  bodyPadding?: CSSProperties["padding"];
  bodyAlignSelf?: CSSProperties["alignSelf"];
  bodyHeight1?: CSSProperties["height"];
  bodyWidth1?: CSSProperties["width"];
  bodyFontSize?: CSSProperties["fontSize"];
  bodyTextAlign?: CSSProperties["textAlign"];
  bodyDisplay?: CSSProperties["display"];
  bodyAlignItems?: CSSProperties["alignItems"];
  bodyJustifyContent?: CSSProperties["justifyContent"];
};

const Body: NextPage<BodyType> = ({
  className = "",
  bodyWidth,
  bodyHeight,
  bodyPadding,
  bodyAlignSelf,
  body,
  bodyHeight1,
  bodyWidth1,
  bodyFontSize,
  bodyTextAlign,
  bodyDisplay,
  bodyAlignItems,
  bodyJustifyContent,
}) => {
  const bodyStyle: CSSProperties = useMemo(() => {
    return {
      width: bodyWidth,
      height: bodyHeight,
      padding: bodyPadding,
      alignSelf: bodyAlignSelf,
    };
  }, [bodyWidth, bodyHeight, bodyPadding, bodyAlignSelf]);

  const body1Style: CSSProperties = useMemo(() => {
    return {
      height: bodyHeight1,
      width: bodyWidth1,
      fontSize: bodyFontSize,
      textAlign: bodyTextAlign,
      display: bodyDisplay,
      alignItems: bodyAlignItems,
      justifyContent: bodyJustifyContent,
    };
  }, [
    bodyHeight1,
    bodyWidth1,
    bodyFontSize,
    bodyTextAlign,
    bodyDisplay,
    bodyAlignItems,
    bodyJustifyContent,
  ]);

  return (
    <Box className={[styles.body, className].join(" ")} style={bodyStyle}>
      <div className={styles.body2} style={body1Style}>
        {body}
      </div>
    </Box>
  );
};

export default Body;
