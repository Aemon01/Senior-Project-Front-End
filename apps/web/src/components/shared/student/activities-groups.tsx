"use client";
import type { NextPage } from "next";
import { useState } from "react";
import { Box, Typography } from "@mui/material";
import Body from "./body";
import styles from "./activities-groups.module.css";

export type ActivitiesGroupsType = {
  className?: string;
};

const ActivitiesGroups: NextPage<ActivitiesGroupsType> = ({
  className = "",
}) => {
  const [bodyItems] = useState([
    {
      bodyWidth: "unset" as const,
      bodyHeight: "12px" as const,
      bodyPadding: undefined,
      bodyAlignSelf: "stretch" as const,
      body: "- Frontend Basics & Web Terminology ...",
      bodyHeight1: "12px" as const,
      bodyWidth1: "158px" as const,
      bodyFontSize: "8px" as const,
      bodyTextAlign: undefined,
      bodyDisplay: undefined,
      bodyAlignItems: undefined,
      bodyJustifyContent: undefined,
    },
    {
      bodyWidth: "unset" as const,
      bodyHeight: "12px" as const,
      bodyPadding: undefined,
      bodyAlignSelf: "stretch" as const,
      body: "- UI Layout Explanation Task",
      bodyHeight1: "12px" as const,
      bodyWidth1: "158px" as const,
      bodyFontSize: "8px" as const,
      bodyTextAlign: undefined,
      bodyDisplay: undefined,
      bodyAlignItems: undefined,
      bodyJustifyContent: undefined,
    },
    {
      bodyWidth: "unset" as const,
      bodyHeight: "12px" as const,
      bodyPadding: undefined,
      bodyAlignSelf: "stretch" as const,
      body: "- Responsive Web Page Workshop",
      bodyHeight1: "12px" as const,
      bodyWidth1: "158px" as const,
      bodyFontSize: "8px" as const,
      bodyTextAlign: undefined,
      bodyDisplay: undefined,
      bodyAlignItems: undefined,
      bodyJustifyContent: undefined,
    },
  ]);
  return (
    <section className={[styles.activitiesGroups, className].join(" ")}>
      <Box className={styles.activitiesGroupsChild} />
      <Box className={styles.frameParent}>
        <Box className={styles.frameGroup}>
          <Box className={styles.activityCompletionStatusWrapper}>
            <div className={styles.activityCompletionStatus}>
              Activity Completion Status
            </div>
          </Box>
          <Box className={styles.donutChartParent}>
            <Box className={styles.donutChart}>
              <Box className={styles.donutChartChild} />
              <Box className={styles.ellipseParent}>
                <Box className={styles.frameChild} />
                <div className={styles.chartPercent}>1</div>
                <Box className={styles.completedParent}>
                  <div className={styles.completed}>
                    <Typography
                      variant="inherit"
                      variantMapping={{ inherit: "span" }}
                    >
                      3<br />
                    </Typography>
                    <Typography
                      variant="inherit"
                      variantMapping={{ inherit: "span" }}
                      sx={{ fontWeight: "300", fontSize: "var(--fs-6)" }}
                    >
                      Completed
                    </Typography>
                  </div>
                  <div className={styles.incomplete}>Incomplete</div>
                </Box>
              </Box>
              <Box className={styles.donutChartInner}>
                <Box className={styles.ellipseGroup}>
                  <Box className={styles.frameItem} />
                  <Box className={styles.frameInner} />
                  <Box className={styles.ellipseDiv} />
                  <Box className={styles.frameChild2} />
                  <Box className={styles.frameWrapper}>
                    <Box className={styles.indicatorPercentParent}>
                      <div className={styles.indicatorPercent}>1</div>
                      <div className={styles.registered}>Registered</div>
                    </Box>
                  </Box>
                  <Box className={styles.progressStatus}>
                    <Box className={styles.ellipseContainer}>
                      <Box className={styles.frameChild3} />
                      <div className={styles.progressPercent}>15</div>
                    </Box>
                    <Box className={styles.inProgressWrapper}>
                      <div className={styles.inProgress}>
                        <Typography
                          variant="inherit"
                          variantMapping={{ inherit: "span" }}
                        >
                          10
                          <br />
                        </Typography>
                        <Typography
                          variant="inherit"
                          variantMapping={{ inherit: "span" }}
                          sx={{ fontWeight: "300", fontSize: "var(--fs-6)" }}
                        >
                          In Progress
                        </Typography>
                      </div>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
            <Box className={styles.completedDetailsWrapper}>
              <Box className={styles.completedDetails}>
                <Box className={styles.rectangleParent}>
                  <Box className={styles.rectangleDiv} />
                  <div className={styles.completed3}>Completed</div>
                </Box>
                <Box className={styles.bodyParent}>
                  {bodyItems.map((item, index) => (
                    <Body
                      key={index}
                      bodyWidth={item.bodyWidth}
                      bodyHeight={item.bodyHeight}
                      bodyPadding={item.bodyPadding}
                      bodyAlignSelf={item.bodyAlignSelf}
                      body={item.body}
                      bodyHeight1={item.bodyHeight1}
                      bodyWidth1={item.bodyWidth1}
                      bodyFontSize={item.bodyFontSize}
                      bodyTextAlign={item.bodyTextAlign}
                      bodyDisplay={item.bodyDisplay}
                      bodyAlignItems={item.bodyAlignItems}
                      bodyJustifyContent={item.bodyJustifyContent}
                    />
                  ))}
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
        <Box className={styles.lineWrapper}>
          <Box className={styles.lineDiv} />
        </Box>
      </Box>
      <Box className={styles.graphContainerParent}>
        <Box className={styles.graphContainer}>
          <Box className={styles.graphHeader}>
            <Box className={styles.graphTitle}>
              <div className={styles.xp}>กราฟ XP ต่อวัน</div>
            </Box>
            <Box className={styles.periodButton}>
              <Box className={styles.periodButtonChild} />
              <Box className={styles.rectangleGroup}>
                <Box className={styles.frameChild4} />
                <div className={styles.weekly}>weekly</div>
              </Box>
              <Box className={styles.rectangleContainer}>
                <Box className={styles.frameChild5} />
                <div className={styles.daily}>daily</div>
              </Box>
              <Box className={styles.buttonSeparator} />
            </Box>
          </Box>
        </Box>
        <Box className={styles.graphData}>
          <Box className={styles.dataSeparator} />
          <Box className={styles.xpData}>
            <Box className={styles.frameContainer}>
              <Box className={styles.frameDiv}>
                <Box className={styles.rectangleParent2}>
                  <Box className={styles.frameChild6} />
                  <div className={styles.xp2}>20 XP</div>
                </Box>
              </Box>
              <div className={styles.sun04012026}>
                <span className={styles.sun04012026TxtContainer}>
                  <Typography
                    variant="inherit"
                    variantMapping={{ inherit: "span" }}
                    sx={{ fontWeight: "500" }}
                  >
                    SUN
                    <br />
                  </Typography>
                  <Typography
                    variant="inherit"
                    variantMapping={{ inherit: "span" }}
                    sx={{ fontWeight: "300", fontSize: "var(--fs-5)" }}
                  >
                    04/01/2026
                  </Typography>
                </span>
              </div>
            </Box>
            <Box className={styles.groupDiv}>
              <Box className={styles.frameDiv}>
                <Box className={styles.rectangleParent3}>
                  <Box className={styles.frameChild7} />
                  <div className={styles.xp2}>25 XP</div>
                </Box>
              </Box>
              <div className={styles.sun04012026}>
                <span className={styles.sun04012026TxtContainer}>
                  <Typography
                    variant="inherit"
                    variantMapping={{ inherit: "span" }}
                    sx={{ fontWeight: "500" }}
                  >
                    MON
                    <br />
                  </Typography>
                  <Typography
                    variant="inherit"
                    variantMapping={{ inherit: "span" }}
                    sx={{ fontWeight: "300", fontSize: "var(--fs-5)" }}
                  >
                    05/02/2026
                  </Typography>
                </span>
              </div>
            </Box>
            <Box className={styles.frameParent2}>
              <Box className={styles.frameDiv}>
                <Box className={styles.rectangleParent4}>
                  <Box className={styles.frameChild8} />
                  <div className={styles.xp2}>15 XP</div>
                </Box>
              </Box>
              <div className={styles.sun04012026}>
                <span className={styles.sun04012026TxtContainer}>
                  <Typography
                    variant="inherit"
                    variantMapping={{ inherit: "span" }}
                    sx={{ fontWeight: "500" }}
                  >
                    TUE
                    <br />
                  </Typography>
                  <Typography
                    variant="inherit"
                    variantMapping={{ inherit: "span" }}
                    sx={{ fontWeight: "300", fontSize: "var(--fs-5)" }}
                  >
                    06/02/2026
                  </Typography>
                </span>
              </div>
            </Box>
            <Box className={styles.frameParent3}>
              <Box className={styles.frameDiv}>
                <Box className={styles.rectangleParent5}>
                  <Box className={styles.frameChild9} />
                  <div className={styles.xp2}>23 XP</div>
                </Box>
              </Box>
              <div className={styles.sun04012026}>
                <span className={styles.sun04012026TxtContainer}>
                  <Typography
                    variant="inherit"
                    variantMapping={{ inherit: "span" }}
                    sx={{ fontWeight: "500" }}
                  >
                    WEN
                    <br />
                  </Typography>
                  <Typography
                    variant="inherit"
                    variantMapping={{ inherit: "span" }}
                    sx={{ fontWeight: "300", fontSize: "var(--fs-5)" }}
                  >
                    07/02/2026
                  </Typography>
                </span>
              </div>
            </Box>
            <Box className={styles.frameParent4}>
              <Box className={styles.frameDiv}>
                <Box className={styles.rectangleParent6}>
                  <Box className={styles.frameChild10} />
                  <div className={styles.xp6}>12 XP</div>
                </Box>
              </Box>
              <div className={styles.sun04012026}>
                <span className={styles.sun04012026TxtContainer}>
                  <Typography
                    variant="inherit"
                    variantMapping={{ inherit: "span" }}
                    sx={{ fontWeight: "500" }}
                  >
                    THU
                    <br />
                  </Typography>
                  <Typography
                    variant="inherit"
                    variantMapping={{ inherit: "span" }}
                    sx={{ fontWeight: "300", fontSize: "var(--fs-5)" }}
                  >
                    08/02/2026
                  </Typography>
                </span>
              </div>
            </Box>
            <Box className={styles.frameParent5}>
              <Box className={styles.frameDiv}>
                <Box className={styles.rectangleParent7}>
                  <Box className={styles.frameChild11} />
                  <div className={styles.xp2}>25 XP</div>
                </Box>
              </Box>
              <div className={styles.sun04012026}>
                <span className={styles.sun04012026TxtContainer}>
                  <Typography
                    variant="inherit"
                    variantMapping={{ inherit: "span" }}
                    sx={{ fontWeight: "500" }}
                  >
                    FRI
                    <br />
                  </Typography>
                  <Typography
                    variant="inherit"
                    variantMapping={{ inherit: "span" }}
                    sx={{ fontWeight: "300", fontSize: "var(--fs-5)" }}
                  >
                    09/02/2026
                  </Typography>
                </span>
              </div>
            </Box>
            <Box className={styles.frameParent6}>
              <Box className={styles.frameDiv}>
                <Box className={styles.rectangleParent8}>
                  <Box className={styles.frameChild12} />
                  <div className={styles.xp2}>30 XP</div>
                </Box>
              </Box>
              <div className={styles.sun04012026}>
                <span className={styles.sun04012026TxtContainer}>
                  <Typography
                    variant="inherit"
                    variantMapping={{ inherit: "span" }}
                    sx={{ fontWeight: "500" }}
                  >
                    SAT
                    <br />
                  </Typography>
                  <Typography
                    variant="inherit"
                    variantMapping={{ inherit: "span" }}
                    sx={{ fontWeight: "300", fontSize: "var(--fs-5)" }}
                  >
                    10/02/2026
                  </Typography>
                </span>
              </div>
            </Box>
          </Box>
        </Box>
      </Box>
    </section>
  );
};

export default ActivitiesGroups;
