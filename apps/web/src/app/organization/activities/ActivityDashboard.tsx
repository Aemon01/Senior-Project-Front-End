"use client";

import Image from "next/image";
import { Fragment, useState } from "react";
import styles from "./ActivityDashboard.module.css";

// กำหนด Interface สำหรับข้อมูลผู้เข้าร่วม
interface Participant {
  id: string;
  name: string;
  bio: string;
  profileImage: string;
  score: number;
  status: "Doing" | "Completed";
}

export default function ActivityDashboard() {
  const [selectedTab, setSelectedTab] = useState<"Meetings" | "Courses" | "Challenges">("Courses");

  // ตัวอย่างข้อมูล Mock Data (ในอนาคตเปลี่ยนเป็น Fetch จาก API)
  const [participants] = useState<Participant[]>([
    { id: "1", name: "Charlotte Garcia", bio: "Dedicated professional in marketing...", profileImage: "/images/icons/body-icon.png", score: 45, status: "Doing" },
    { id: "2", name: "Charlotte Garcia", bio: "Dedicated professional in marketing...", profileImage: "/images/icons/body-icon.png", score: 45, status: "Completed" },
    { id: "3", name: "Charlotte Garcia", bio: "Dedicated professional in marketing...", profileImage: "/images/icons/body-icon.png", score: 45, status: "Completed" },
    { id: "4", name: "Charlotte Garcia", bio: "Dedicated professional in marketing...", profileImage: "/images/icons/body-icon.png", score: 45, status: "Completed" },
  ]);

  return (
    <div className={styles.container}>
      {/* SECTION 1: TOP STATS & STATUS */}
      <div className={styles.topGrid}>
        <div className={styles.participantsStatsCard}>
          <div className={styles.activityTitleHeader}>
            {`Frontend Basics & Web Terminology Quiz`}
          </div>
          <div className={styles.statsItemsWrapper}>
            <div className={styles.statItemBox}>
              <div className={styles.statItemBg} />
              <div className={styles.statItemLabelWrap}>Registrants</div>
              <div className={styles.statItemValueWrap}>5</div>
            </div>
            <div className={styles.verticalDivider} />
            <div className={styles.statItemBox}>
              <div className={styles.statItemBg} />
              <div className={styles.statItemLabelWrap}>Doing activities</div>
              <div className={styles.statItemValueWrap}>5</div>
            </div>
            <div className={styles.verticalDivider} />
            <div className={styles.statItemBox}>
              <div className={styles.statItemBg} />
              <div className={styles.statItemLabelWrap}>Completed</div>
              <div className={styles.statItemValueWrap}>1</div>
            </div>
            <div className={styles.verticalDivider} />
            <div className={styles.statItemBox}>
              <div className={styles.statItemBg} />
              <div className={styles.statSubLabelNote}>(only challenge)</div>
              <div className={styles.statItemLabelWrap}>Awaiting check</div>
              <div className={styles.statValueWithNote}>0</div>
            </div>
          </div>
        </div>

        <div className={styles.statusToggleCard}>
          <div className={styles.publishStatusRow}>
            <button className={styles.statusTabBtn}>Draft</button>
            <div className={styles.shortVerticalDivider} />
            <button className={`${styles.statusTabBtn} ${styles.activePublished}`}>Published</button>
          </div>
          <div className={styles.horizontalDivider} />
          <div className={styles.activityTypeRow}>
            {(["Meetings", "Courses", "Challenges"] as const).map((type, idx) => (
              <Fragment key={type}>
                {idx > 0 && <div className={styles.shortVerticalDivider} />}
                <button
                  className={`${styles.typeTabBtn} ${selectedTab === type ? styles.activeType : ""}`}
                  onClick={() => setSelectedTab(type)}
                >{type}</button>
              </Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 2: ACTIVITY DETAILS */}
      <section className={styles.detailsCard}>
        <div className={styles.detailsHeader}>
          <p className={styles.descriptionText}>
            This activity helps learners build a foundation in frontend development by recalling key terms related to HTML, CSS, JavaScript, and the browser environment.
          </p>
          <button className={styles.editIconButton}>
            <Image src="/images/icons/button03-icon.png" alt="Edit" width={40} height={34} />
          </button>
        </div>
        <div className={styles.horizontalDivider} />
        <div className={styles.metaGrid}>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Category: </span>
            <span className={styles.metaValue}>Course</span><br />
            <span className={styles.metaLabel}>Estimated Time: </span>
            <span className={styles.metaValue}>20–30 minutes</span><br />
            <span className={styles.metaLabel}>due date: </span>
            <span className={styles.metaValue}>20 Jan 2026</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Tasks:</span>
            <ul className={styles.taskList}>
              <li>- Watch video</li>
              <li>- Multiple-choice questions</li>
            </ul>
          </div>
        </div>

        <div className={styles.skillsContainer}>
          <span className={styles.skillsSectionLabel}>Skills</span>
          <div className={styles.skillsWrapperBox}>
            {["Web Terminology", "HTML/CSS Concepts", "Knowledge Retention"].map((skill) => (
              <div key={skill} className={styles.skillBadgeItem}>
                <div className={styles.skillNameText}>{skill}</div>
                <div className={styles.skillLevelText}>(Remembering)</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3: PARTICIPANTS LIST */}
      <section className={styles.participantsListCard}>
        <div className={styles.scrollContainer}>
          {participants.map((person) => (
            <div key={person.id} className={styles.participantItemRow}>
              <div className={styles.profileWrap}>
                <Image
                  src={person.profileImage || "/images/avatar%20picture/default.png"}
                  alt="Avatar" width={50} height={50}
                  className={styles.avatarCircle}
                />
              </div>
              <div className={styles.participantMainInfo}>
                <div className={styles.participantName}>{person.name}</div>
                <div className={styles.participantBio}>{person.bio}</div>
              </div>
              <div className={styles.participantScoreWrap}>
                <Image src="/images/icons/badge04.png" alt="Badge" width={30} height={30} />
                <span>{person.score}</span>
              </div>
              <div className={styles.participantStatus}>
                <div className={`${styles.statusBadgeBase} ${person.status === "Doing" ? styles.statusDoing : styles.statusCompleted}`}>
                  {person.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}