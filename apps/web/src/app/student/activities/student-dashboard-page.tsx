"use client";
import type { NextPage } from "next";
import { useCallback } from "react";
import { Box, Typography, Button } from "@mui/material";
import Image from "next/image";
import SidebarManu from "@/components/shared/student/sidebar-manu";
import Title from "@/components/shared/student/title";
import GroupComponent from "@/components/shared/student/group-component";
import ActivitiesGroups from "@/components/shared/student/activities-groups";
import October from "@/components/shared/student/october";
import styles from "./student-dashboard-page.module.css";

const StudentDashboardPage: NextPage = () => {
  const onPortfolioButtonContainerClick = useCallback(() => {
    // Please sync "Portfolio-personal information" to the project
  }, []);

  return (
    <Box className={styles.studentdashboardpage}>
      <Box className={styles.sidebarManuWrapper}>
        <SidebarManu />
      </Box>
      <Box className={styles.bioBox}>
        <Box className={styles.bio} />
        <Box className={styles.bioBoxChild} />
        <Box className={styles.bioBoxItem} />
        <Box className={styles.bioBoxInner} />
        <Box className={styles.rectangleDiv} />
        <Box className={styles.bioBoxChild2} />
        <Box className={styles.bioBoxChild3} />
        <div className={styles.tel}>Tel.</div>
        <div className={styles.bio2}>Bio</div>
        <div className={styles.email}>Email</div>
        <div className={styles.name}>Name</div>
        <div className={styles.address}>{`Address `}</div>
        <div className={styles.university}>{`University `}</div>
      </Box>
      <Box className={styles.studentdashboardpageChild} />
      <main className={styles.studentdashboardpageInner}>
        <Box className={styles.frameParent}>
          <section className={styles.profileBoxParent}>
            <Image
              className={styles.profileBoxIcon}
              loading="lazy"
              width={155}
              height={155}
              sizes="100vw"
              alt=""
              src="/profile-box@2x.png"
            />
            <Box className={styles.bioBox2}>
              <Box className={styles.bio3} />
              <Box className={styles.frameDiv}>
                <Box className={styles.frameGroup}>
                  <Box className={styles.carolynStewartWrapper}>
                    <Typography
                      className={styles.carolynStewart}
                      variant="inherit"
                      variantMapping={{ inherit: "h3" }}
                      sx={{ fontWeight: "500" }}
                    >
                      Carolyn Stewart
                    </Typography>
                  </Box>
                  <Button
                    className={styles.editButtonIcon}
                    disableElevation
                    variant="text"
                    sx={{
                      borderRadius: "0px 0px 0px 0px",
                      width: 34,
                      height: 28,
                    }}
                  />
                </Box>
              </Box>
              <Box className={styles.experiencedProfessionalInDeWrapper}>
                <div className={styles.experiencedProfessionalIn}>
                  Experienced professional in design bringing fresh
                  perspectives. Committed to creating impactful solutions and
                  driving positive change.
                </div>
              </Box>
              <Box className={styles.bioSeparator}>
                <Box className={styles.bioSeparatorChild} />
              </Box>
              <Box className={styles.frameContainer}>
                <Box className={styles.contactRowParent}>
                  <Box className={styles.contactRow}>
                    <div className={styles.educationMahidolUniversity}>
                      Phone: 132-745-9803
                    </div>
                  </Box>
                  <Box className={styles.contactSeparator} />
                  <Box className={styles.contactDetail}>
                    <div className={styles.experiencedProfessionalIn}>
                      Address: 1754 Maple Drive Houston, PA 71107
                    </div>
                  </Box>
                </Box>
                <Box className={styles.sidebarManuWrapper}>
                  <Box className={styles.frameChild} />
                </Box>
                <Box className={styles.frameParent2}>
                  <Box className={styles.emailCarolynstewartexampleWrapper}>
                    <div className={styles.experiencedProfessionalIn}>
                      Email: carolyn.stewart@example.com
                    </div>
                  </Box>
                  <Box className={styles.contactSeparator} />
                  <Box className={styles.educationMahidolUniversityWrapper}>
                    <div className={styles.educationMahidolUniversity}>
                      Education: Mahidol University
                    </div>
                  </Box>
                </Box>
              </Box>
            </Box>
          </section>
          <section className={styles.frameSection}>
            <Box className={styles.frameParent3}>
              <Box className={styles.levelBoxParent}>
                <Box className={styles.levelBox}>
                  <Box className={styles.level} />
                  <Box className={styles.levelBoxChild} />
                  <div className={styles.xp}>500/1000 XP</div>
                  <div className={styles.level2}>level</div>
                  <Box className={styles.levelBoxItem} />
                  <Box className={styles.rectangleParent}>
                    <Box className={styles.frameInner} />
                    <Typography
                      className={styles.levelValue}
                      variant="inherit"
                      variantMapping={{ inherit: "h1" }}
                      sx={{ fontWeight: "800" }}
                    >
                      10
                    </Typography>
                  </Box>
                </Box>
                <Box className={styles.badgeRankBoxParent}>
                  <Image
                    className={styles.badgeRankBox}
                    width={209.6}
                    height={61}
                    sizes="100vw"
                    alt=""
                    src="/badge-rank-box@2x.png"
                  />
                  <Image
                    className={styles.badgeNoBg2}
                    loading="lazy"
                    width={48}
                    height={60}
                    sizes="100vw"
                    alt=""
                    src="/badge-no-bg-22@2x.png"
                  />
                </Box>
              </Box>
              <Box className={styles.buttonBar}>
                <Box className={styles.badgesButton}>
                  <Box className={styles.badgesButtonChild} />
                  <Image
                    className={styles.buttonBackgroundsIcon}
                    width={60.3}
                    height={60.3}
                    sizes="100vw"
                    alt=""
                    src="/Button-Backgrounds@2x.png"
                  />
                  <Box className={styles.badgeIconWrapper}>
                    <Box className={styles.badgeIcon}>
                      <Image
                        className={styles.badgeNoBg22}
                        width={37.1}
                        height={42.9}
                        sizes="100vw"
                        alt=""
                        src="/badge-no-bg-21@2x.png"
                      />
                      <Image
                        className={styles.badgeNoBg23}
                        width={29.1}
                        height={36.2}
                        sizes="100vw"
                        alt=""
                        src="/badge-no-bg-2@2x.png"
                      />
                    </Box>
                  </Box>
                  <div className={styles.badges}>badges</div>
                </Box>
                <Box className={styles.cerButton}>
                  <Box className={styles.badgesButtonChild} />
                  <Box className={styles.cerButtonItem} />
                  <Box className={styles.cerrtificateIconWrapper}>
                    <Image
                      className={styles.cerrtificateIcon}
                      width={48.9}
                      height={40.2}
                      sizes="100vw"
                      alt=""
                      src="/cerrtificate-icon@2x.png"
                    />
                  </Box>
                  <div className={styles.badges}>certificate</div>
                </Box>
                <Box
                  className={styles.portfolioButton}
                  onClick={onPortfolioButtonContainerClick}
                >
                  <Box className={styles.badgesButtonChild} />
                  <Box className={styles.portfolioButtonItem} />
                  <Box className={styles.porttfolioIconWrapper}>
                    <Image
                      className={styles.cerrtificateIcon}
                      loading="lazy"
                      width={52}
                      height={42}
                      sizes="100vw"
                      alt=""
                      src="/porttfolio-icon@2x.png"
                    />
                  </Box>
                  <div className={styles.portfolio}>portfolio</div>
                </Box>
              </Box>
            </Box>
            <Box className={styles.skillProgressGraph}>
              <Box className={styles.skillProgressGraphChild} />
              <Box className={styles.skillHeaderParent}>
                <Box className={styles.skillHeader}>
                  <Title />
                </Box>
                <Box className={styles.skillsBar}>
                  <Box className={styles.skillValuesParent}>
                    <Box className={styles.skillValues}>
                      <div className={styles.div}>0%</div>
                    </Box>
                    <Box className={styles.rectangleWrapper}>
                      <Box className={styles.frameChild2} />
                    </Box>
                    <div className={styles.skill1}>skill1</div>
                  </Box>
                  <Box className={styles.groupDiv}>
                    <Box className={styles.skillValues}>
                      <div className={styles.div}>0%</div>
                    </Box>
                    <Box className={styles.rectangleWrapper}>
                      <Box className={styles.frameChild2} />
                    </Box>
                    <div className={styles.skill1}>skill2</div>
                  </Box>
                  <Box className={styles.frameParent4}>
                    <Box className={styles.container}>
                      <div className={styles.div}>0%</div>
                    </Box>
                    <Box className={styles.rectangleFrame}>
                      <Box className={styles.frameChild2} />
                    </Box>
                    <div className={styles.skill1}>skill3</div>
                  </Box>
                  <Box className={styles.frameParent5}>
                    <Box className={styles.container}>
                      <div className={styles.div}>0%</div>
                    </Box>
                    <Box className={styles.rectangleFrame}>
                      <Box className={styles.frameChild2} />
                    </Box>
                    <div className={styles.skill1}>skill4</div>
                  </Box>
                  <Box className={styles.frameParent6}>
                    <Box className={styles.container}>
                      <div className={styles.div}>0%</div>
                    </Box>
                    <Box className={styles.rectangleFrame}>
                      <Box className={styles.frameChild2} />
                    </Box>
                    <div className={styles.skill1}>skill5</div>
                  </Box>
                  <Box className={styles.frameParent7}>
                    <Box className={styles.container}>
                      <div className={styles.div}>0%</div>
                    </Box>
                    <Box className={styles.rectangleFrame}>
                      <Box className={styles.frameChild2} />
                    </Box>
                    <div className={styles.skill1}>skill6</div>
                  </Box>
                  <Box className={styles.frameParent8}>
                    <Box className={styles.container}>
                      <div className={styles.div}>0%</div>
                    </Box>
                    <Box className={styles.rectangleFrame}>
                      <Box className={styles.frameChild2} />
                    </Box>
                    <div className={styles.skill1}>skill7</div>
                  </Box>
                  <Box className={styles.frameParent9}>
                    <Box className={styles.container}>
                      <div className={styles.div}>0%</div>
                    </Box>
                    <Box className={styles.rectangleFrame}>
                      <Box className={styles.frameChild2} />
                    </Box>
                    <div className={styles.skill1}>skill8</div>
                  </Box>
                  <Box className={styles.frameParent10}>
                    <Box className={styles.skillValues}>
                      <div className={styles.div}>0%</div>
                    </Box>
                    <Box className={styles.rectangleWrapper}>
                      <Box className={styles.frameChild2} />
                    </Box>
                    <div className={styles.skill1}>skill9</div>
                  </Box>
                </Box>
              </Box>
              <Box className={styles.skillProgressGraphInner}>
                <Box className={styles.rectangleGroup}>
                  <Box className={styles.frameChild11} />
                  <Box className={styles.frameChild12} />
                </Box>
              </Box>
            </Box>
          </section>
          <GroupComponent />
          <ActivitiesGroups />
        </Box>
      </main>
      <section className={styles.scheduleContainer}>
        <Box className={styles.scheduleWrapper}>
          <Image
            className={styles.scheduleWrapperChild}
            loading="lazy"
            width={331}
            height={403}
            sizes="100vw"
            alt=""
            src="/Group-107@2x.png"
          />
          <Box className={styles.scheduleBox}>
            <Box className={styles.scheduleBoxChild} />
            <Box className={styles.scheduleHeader}>
              <Box className={styles.dayHighlightParent}>
                <Box className={styles.dayHighlight}>
                  <Box className={styles.highlightRects} />
                  <Box className={styles.highlightRects2} />
                  <Box className={styles.indicatorBackdrop} />
                </Box>
                <Box className={styles.eventIndicator}>
                  <Box className={styles.indicatorCircles}>
                    <Box className={styles.eventCircles} />
                    <Box className={styles.eventCircles2} />
                  </Box>
                </Box>
              </Box>
              <Box className={styles.calendarHeader}>
                <October fill="none" />
                <Box className={styles.scheduleFooter}>
                  <Box className={styles.dateIndicator}>
                    <Box className={styles.indicatorBackdrop} />
                    <Box className={styles.indicatorBackdrop2} />
                  </Box>
                  <Box className={styles.scheduleFooterInner}>
                    <Box className={styles.frameChild13} />
                  </Box>
                  <Box className={styles.scheduleFooterChild}>
                    <Box className={styles.frameChild14} />
                  </Box>
                </Box>
              </Box>
              <Box className={styles.scheduleHeaderInner}>
                <Box className={styles.frameChild15} />
              </Box>
              <Box className={styles.scheduleHeaderChild}>
                <Box className={styles.frameChild16} />
              </Box>
            </Box>
          </Box>
        </Box>
      </section>
    </Box>
  );
};

export default StudentDashboardPage;
