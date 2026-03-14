"use client";
import type { NextPage } from "next";
import { useCallback } from "react";
import { Box, Typography } from "@mui/material";
import Image from "next/image";
import Button1 from "./button1";
import Body from "./body";
import styles from "./group-component.module.css";

export type GroupComponentType = {
  className?: string;
};

const GroupComponent: NextPage<GroupComponentType> = ({ className = "" }) => {
  const onFrameContainerClick = useCallback(() => {
    const anchor = document.querySelector("[data-scroll-to='frameContainer']");
    if (anchor) {
      anchor.scrollIntoView({ block: "start", behavior: "smooth" });
    }
  }, []);

  return (
    <section className={[styles.rectangleParent, className].join(" ")}>
      <Box className={styles.frameChild} />
      <Box className={styles.frameParent}>
        <Box className={styles.frameWrapper}>
          <Box className={styles.frameGroup}>
            <Box className={styles.frameContainer}>
              <Box className={styles.activitiesIcon1Parent}>
                <Image
                  className={styles.activitiesIcon1}
                  loading="lazy"
                  width={52.5}
                  height={50.3}
                  sizes="100vw"
                  alt=""
                  src="/activities-icon-1@2x.png"
                />
                <Typography
                  className={styles.activityOverview}
                  variant="inherit"
                  variantMapping={{ inherit: "h3" }}
                  sx={{ fontWeight: "400" }}
                >
                  Activity Overview
                </Typography>
              </Box>
            </Box>
            <Button1 />
          </Box>
        </Box>
        <Box className={styles.frameDiv}>
          <Box className={styles.frameWrapper2} onClick={onFrameContainerClick}>
            <Box
              className={styles.activityListItemsWrapper}
              data-scroll-to="frameContainer"
            >
              <Box className={styles.activityListItems}>
                <Box className={styles.rectangleGroup}>
                  <Image
                    className={styles.frameItem}
                    width={111.2}
                    height={104}
                    sizes="100vw"
                    alt=""
                    src="/Rectangle-51@2x.png"
                  />
                  <Body body={`Frontend Basics & Web Terminology Quiz`} />
                  <Image
                    className={styles.image4Icon}
                    loading="lazy"
                    width={49}
                    height={59}
                    sizes="100vw"
                    alt=""
                    src="/image-4@2x.png"
                  />
                  <Box className={styles.bodyWrapper}>
                    <Body
                      bodyWidth="53px"
                      bodyHeight="20px"
                      bodyPadding="unset"
                      bodyAlignSelf="unset"
                      body="20 XP"
                      bodyHeight1="20px"
                      bodyWidth1="53px"
                      bodyFontSize="14px"
                      bodyTextAlign="center"
                      bodyDisplay="flex"
                      bodyAlignItems="center"
                      bodyJustifyContent="center"
                    />
                  </Box>
                </Box>
                <Box className={styles.rectangleGroup}>
                  <Image
                    className={styles.frameItem}
                    width={111.2}
                    height={104}
                    sizes="100vw"
                    alt=""
                    src="/Rectangle-51@2x.png"
                  />
                  <Body
                    bodyWidth="88px"
                    bodyHeight="24px"
                    bodyPadding="unset"
                    bodyAlignSelf="unset"
                    body="UI Layout Explanation Task"
                    bodyHeight1="24px"
                    bodyWidth1="88px"
                    bodyFontSize="10px"
                    bodyTextAlign="left"
                    bodyDisplay="inline-block"
                    bodyAlignItems="unset"
                    bodyJustifyContent="unset"
                  />
                  <Image
                    className={styles.image4Icon}
                    loading="lazy"
                    width={49}
                    height={59}
                    sizes="100vw"
                    alt=""
                    src="/image-4@2x.png"
                  />
                  <Box className={styles.bodyWrapper}>
                    <Body
                      bodyWidth="53px"
                      bodyHeight="20px"
                      bodyPadding="unset"
                      bodyAlignSelf="unset"
                      body="15 XP"
                      bodyHeight1="20px"
                      bodyWidth1="53px"
                      bodyFontSize="14px"
                      bodyTextAlign="center"
                      bodyDisplay="flex"
                      bodyAlignItems="center"
                      bodyJustifyContent="center"
                    />
                  </Box>
                </Box>
                <Box className={styles.rectangleGroup}>
                  <Image
                    className={styles.frameItem}
                    width={111.2}
                    height={104}
                    sizes="100vw"
                    alt=""
                    src="/Rectangle-51@2x.png"
                  />
                  <Body
                    bodyWidth="88px"
                    bodyHeight="24px"
                    bodyPadding="unset"
                    bodyAlignSelf="unset"
                    body="Responsive Web Page Workshop"
                    bodyHeight1="24px"
                    bodyWidth1="88px"
                    bodyFontSize="10px"
                    bodyTextAlign="left"
                    bodyDisplay="inline-block"
                    bodyAlignItems="unset"
                    bodyJustifyContent="unset"
                  />
                  <Image
                    className={styles.image4Icon}
                    loading="lazy"
                    width={49}
                    height={59}
                    sizes="100vw"
                    alt=""
                    src="/image-4@2x.png"
                  />
                  <Box className={styles.bodyWrapper}>
                    <Body
                      bodyWidth="53px"
                      bodyHeight="20px"
                      bodyPadding="unset"
                      bodyAlignSelf="unset"
                      body="50 XP"
                      bodyHeight1="20px"
                      bodyWidth1="53px"
                      bodyFontSize="14px"
                      bodyTextAlign="center"
                      bodyDisplay="flex"
                      bodyAlignItems="center"
                      bodyJustifyContent="center"
                    />
                  </Box>
                </Box>
                <Box className={styles.rectangleGroup}>
                  <Image
                    className={styles.frameItem}
                    width={111.2}
                    height={104}
                    sizes="100vw"
                    alt=""
                    src="/Rectangle-51@2x.png"
                  />
                  <Body
                    bodyWidth="88px"
                    bodyHeight="24px"
                    bodyPadding="unset"
                    bodyAlignSelf="unset"
                    body="Responsive Web Page Workshop"
                    bodyHeight1="24px"
                    bodyWidth1="88px"
                    bodyFontSize="10px"
                    bodyTextAlign="left"
                    bodyDisplay="inline-block"
                    bodyAlignItems="unset"
                    bodyJustifyContent="unset"
                  />
                  <Image
                    className={styles.image4Icon}
                    loading="lazy"
                    width={49}
                    height={59}
                    sizes="100vw"
                    alt=""
                    src="/image-4@2x.png"
                  />
                  <Box className={styles.bodyWrapper}>
                    <Body
                      bodyWidth="53px"
                      bodyHeight="20px"
                      bodyPadding="unset"
                      bodyAlignSelf="unset"
                      body="50 XP"
                      bodyHeight1="20px"
                      bodyWidth1="53px"
                      bodyFontSize="14px"
                      bodyTextAlign="center"
                      bodyDisplay="flex"
                      bodyAlignItems="center"
                      bodyJustifyContent="center"
                    />
                  </Box>
                </Box>
                <Box className={styles.rectangleParent3}>
                  <Image
                    className={styles.frameItem}
                    width={111.2}
                    height={104}
                    sizes="100vw"
                    alt=""
                    src="/Rectangle-51@2x.png"
                  />
                  <Body
                    bodyWidth="88px"
                    bodyHeight="24px"
                    bodyPadding="unset"
                    bodyAlignSelf="unset"
                    body="Responsive Web Page Workshop"
                    bodyHeight1="24px"
                    bodyWidth1="88px"
                    bodyFontSize="10px"
                    bodyTextAlign="left"
                    bodyDisplay="inline-block"
                    bodyAlignItems="unset"
                    bodyJustifyContent="unset"
                  />
                  <Image
                    className={styles.image4Icon}
                    loading="lazy"
                    width={49}
                    height={59}
                    sizes="100vw"
                    alt=""
                    src="/image-4@2x.png"
                  />
                  <Box className={styles.bodyWrapper}>
                    <Body
                      bodyWidth="53px"
                      bodyHeight="20px"
                      bodyPadding="unset"
                      bodyAlignSelf="unset"
                      body="50 XP"
                      bodyHeight1="20px"
                      bodyWidth1="53px"
                      bodyFontSize="14px"
                      bodyTextAlign="center"
                      bodyDisplay="flex"
                      bodyAlignItems="center"
                      bodyJustifyContent="center"
                    />
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
          <Box className={styles.rectangleParent4}>
            <Box className={styles.rectangleDiv} />
            <Box className={styles.frameChild4} />
          </Box>
        </Box>
      </Box>
      <Box className={styles.activitiesSeparator}>
        <Box className={styles.activitiesSeparatorChild} />
      </Box>
      <Box className={styles.todaysMissionParent}>
        <Typography
          className={styles.todaysMission}
          variant="inherit"
          variantMapping={{ inherit: "h3" }}
          sx={{ fontWeight: "400" }}
        >
          Today's mission
        </Typography>
        <Box className={styles.frameWrapper3}>
          <Box className={styles.frameParent2}>
            <Box className={styles.rectangleParent5}>
              <Box className={styles.frameChild5} />
              <Body
                bodyWidth="109px"
                bodyHeight="19px"
                bodyPadding="0px 0px 3px"
                bodyAlignSelf="unset"
                body="Join 2 activities"
                bodyHeight1="16px"
                bodyWidth1="109px"
                bodyFontSize="11px"
                bodyTextAlign="left"
                bodyDisplay="flex"
                bodyAlignItems="center"
                bodyJustifyContent="unset"
              />
              <Body
                bodyWidth="42px"
                bodyHeight="19px"
                bodyPadding="0px 0px 3px"
                bodyAlignSelf="unset"
                body="10 XP"
                bodyHeight1="16px"
                bodyWidth1="42px"
                bodyFontSize="11px"
                bodyTextAlign="right"
                bodyDisplay="flex"
                bodyAlignItems="center"
                bodyJustifyContent="flex-end"
              />
            </Box>
            <Box className={styles.rectangleParent6}>
              <Box className={styles.frameChild5} />
              <Body
                bodyWidth="156px"
                bodyHeight="19px"
                bodyPadding="0px 0px 3px"
                bodyAlignSelf="unset"
                body="Complete one activity"
                bodyHeight1="16px"
                bodyWidth1="156px"
                bodyFontSize="11px"
                bodyTextAlign="left"
                bodyDisplay="flex"
                bodyAlignItems="center"
                bodyJustifyContent="unset"
              />
              <Body
                bodyWidth="42px"
                bodyHeight="19px"
                bodyPadding="0px 0px 3px"
                bodyAlignSelf="unset"
                body="10 XP"
                bodyHeight1="16px"
                bodyWidth1="42px"
                bodyFontSize="11px"
                bodyTextAlign="right"
                bodyDisplay="flex"
                bodyAlignItems="center"
                bodyJustifyContent="flex-end"
              />
            </Box>
            <Box className={styles.rectangleParent6}>
              <Box className={styles.frameChild5} />
              <Body
                bodyWidth="156px"
                bodyHeight="19px"
                bodyPadding="0px 0px 3px"
                bodyAlignSelf="unset"
                body="Join activity in 15 minutes"
                bodyHeight1="16px"
                bodyWidth1="156px"
                bodyFontSize="11px"
                bodyTextAlign="left"
                bodyDisplay="flex"
                bodyAlignItems="center"
                bodyJustifyContent="unset"
              />
              <Body
                bodyWidth="42px"
                bodyHeight="19px"
                bodyPadding="0px 0px 3px"
                bodyAlignSelf="unset"
                body="10 XP"
                bodyHeight1="16px"
                bodyWidth1="42px"
                bodyFontSize="11px"
                bodyTextAlign="right"
                bodyDisplay="flex"
                bodyAlignItems="center"
                bodyJustifyContent="flex-end"
              />
            </Box>
          </Box>
        </Box>
      </Box>
    </section>
  );
};

export default GroupComponent;
