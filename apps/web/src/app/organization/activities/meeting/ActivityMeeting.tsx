"use client";

import { useState } from "react";
import styles from "./ActivityMeeting.module.css";

type ActivityType = "Meetings" | "Courses" | "Challenges";
type AudienceMode = "invited" | "everyone";
type JoinMode = "anytime" | "scheduled";
type LocationMode = "onsite" | "online";

const skillRows = [
  { name: "Performance Analysis", level: "Understanding", percent: "30%" },
  { name: "Performance Analysis", level: "Remembering", percent: "20%" },
  { name: "Performance Analysis", level: "Applying", percent: "10%" },
  { name: "Performance Analysis", level: "Analyzing", percent: "20%" },
  { name: "Performance Analysis", level: "Creating", percent: "10%" },
];

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.inlineIcon}>
      <path
        d="M11 4a7 7 0 1 1 0 14a7 7 0 0 1 0-14Zm0 0l9 9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.inlineIcon}>
      <path
        d="M12 21s6-5.25 6-11a6 6 0 1 0-12 0c0 5.75 6 11 6 11Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="10" r="2.3" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.actionIcon}>
      <path
        d="M4 17.5V20h2.5L18 8.5L15.5 6L4 17.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M14.8 6.7l2.5 2.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function PuzzleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.actionIcon}>
      <path
        d="M10 4h3a2 2 0 1 1 0 4h3v4h-3a2 2 0 1 0 0 4h3v4H8v-4H5v-4h3a2 2 0 1 0 0-4H5V4h5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.optionIcon}>
      <path
        d="M8 11a3 3 0 1 0 0-6a3 3 0 0 0 0 6Zm8 1a2.5 2.5 0 1 0 0-5a2.5 2.5 0 0 0 0 5ZM3.5 19a4.5 4.5 0 0 1 9 0M13 19a3.8 3.8 0 0 1 7.5 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckUserIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.optionIcon}>
      <path
        d="M9 11a3 3 0 1 0 0-6a3 3 0 0 0 0 6Zm-5 8a5 5 0 0 1 10 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="m14.5 16.5 1.8 1.8 3.2-3.7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.smallIcon}>
      <path
        d="M4 6h16M7 12h10M10 18h4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MedalIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.statIconSvg}>
      <path
        d="M8 3h3l1 4l1-4h3l-2.2 6H10.2L8 3Zm4 8.2a4.8 4.8 0 1 1 0 9.6a4.8 4.8 0 0 1 0-9.6Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BadgeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.statIconSvg}>
      <path
        d="M12 3l2.2 4.4L19 8l-3.5 3.4.8 4.8L12 14l-4.3 2.2.8-4.8L5 8l4.8-.6L12 3Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CertificateIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.statIconSvg}>
      <path
        d="M7 4h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm5 5.2 1.2 2.3 2.5.4-1.8 1.8.4 2.5-2.3-1.2-2.3 1.2.4-2.5-1.8-1.8 2.5-.4L12 9.2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckBox({ checked }: { checked: boolean }) {
  return (
    <span
      className={`${styles.checkBox} ${checked ? styles.checkBoxActive : ""}`}
      aria-hidden="true"
    >
      {checked ? "✓" : ""}
    </span>
  );
}

export default function ActivityMeeting() {
  const [activityType, setActivityType] = useState<ActivityType>("Meetings");
  const [audienceMode, setAudienceMode] = useState<AudienceMode>("everyone");
  const [joinMode, setJoinMode] = useState<JoinMode>("scheduled");
  const [locationMode, setLocationMode] = useState<LocationMode>("onsite");
  const [isMapOpen, setIsMapOpen] = useState(false);

  return (
    <div>

      <div className={styles.page}>
        <div className={styles.column}>
          <section className={`${styles.card} ${styles.infoCard}`}>
            <label className={styles.fieldLabel}>Activity Title</label>
            <input
              className={styles.longInput}
              placeholder="Body"
              defaultValue=""
            />

            <label className={styles.fieldLabel}>Description</label>
            <textarea
              className={styles.largeTextarea}
              placeholder="Body"
              defaultValue=""
            />
          </section>

          <section className={`${styles.card} ${styles.typeCard}`}>
            <div className={styles.typeRow}>
              {(["Meetings", "Courses", "Challenges"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`${styles.typeButton} ${activityType === item ? styles.typeButtonActive : ""
                    }`}
                  onClick={() => setActivityType(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </section>

          <section className={`${styles.card} ${styles.speakerCard}`}>
            <div className={styles.locationBlock}>
              <div className={styles.locationRow}>
                <button
                  type="button"
                  className={styles.locationToggle}
                  onClick={() => setLocationMode("onsite")}
                >
                  <CheckBox checked={locationMode === "onsite"} />
                  <span>On-site</span>
                </button>
                <input className={styles.shortInput} placeholder="Location" />
              </div>

              <div className={styles.locationRow}>
                <button
                  type="button"
                  className={styles.locationToggle}
                  onClick={() => setLocationMode("online")}
                >
                  <CheckBox checked={locationMode === "online"} />
                  <span>Online</span>
                </button>
                <input className={styles.shortInput} placeholder="Link" />
              </div>
            </div>

            <div className={styles.separator} />

            <div className={styles.formGroup}>
              <label className={styles.sectionLabel}>Speakers/Hosts</label>
              <input className={styles.shortInputFull} placeholder="Body" />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.sectionLabel}>Position/Bio</label>
              <textarea
                className={styles.bioTextarea}
                placeholder="description"
                defaultValue=""
              />
            </div>

            <div className={styles.checkInWrap}>
              <div className={styles.checkInTitle}>Check-in</div>
              <button
                type="button"
                className={styles.checkInPreview}
                onClick={() => setIsMapOpen(true)}
              >
                <div className={styles.previewMap}>
                  <div className={styles.previewRoadA} />
                  <div className={styles.previewRoadB} />
                  <div className={styles.previewRoadC} />
                  <div className={styles.previewMarkerOne} />
                  <div className={styles.previewMarkerTwo} />
                  <div className={styles.previewMarkerThree} />
                </div>
              </button>
            </div>
          </section>
        </div>

        <div className={styles.column}>
          <section className={`${styles.card} ${styles.actionCard}`}>
            <div className={styles.actionGrid}>
              <button
                type="button"
                className={`${styles.actionButton} ${styles.actionDraft}`}
                onClick={() => setIsMapOpen(true)}
              >
                <EditIcon />
                <span>Draft</span>
              </button>

              <button
                type="button"
                className={`${styles.actionButton} ${styles.actionPublish}`}
              >
                <PuzzleIcon />
                <span>Publish</span>
              </button>
            </div>
          </section>

          <section className={`${styles.card} ${styles.rewardsCard}`}>
            <div className={styles.rewardsHead}>
              <div className={styles.rewardsTitle}>Skills</div>
              <FilterIcon />
            </div>

            <div className={styles.skillList}>
              {skillRows.map((item, index) => (
                <div className={styles.skillRow} key={`${item.level}-${index}`}>
                  <div className={styles.skillName}>{item.name}</div>
                  <div className={styles.skillLevel}>{item.level}</div>
                  <div className={styles.skillPercent}>{item.percent}</div>
                </div>
              ))}
            </div>

            <div className={styles.statsGrid}>
              <div className={styles.statCell}>
                <div className={styles.statTitle}>XP</div>
                <div className={styles.xpBox}>20</div>
                <div className={styles.statIconWrap}>
                  <MedalIcon />
                </div>
              </div>

              <div className={styles.statCell}>
                <div className={styles.statTitle}>Badges</div>
                <button type="button" className={styles.uploadBox}>
                  upload
                </button>
                <div className={styles.statIconWrap}>
                  <BadgeIcon />
                </div>
              </div>

              <div className={styles.statCell}>
                <div className={styles.statTitle}>Certificate</div>
                <button type="button" className={styles.uploadBox}>
                  upload
                </button>
                <div className={styles.statIconWrap}>
                  <CertificateIcon />
                </div>
              </div>
            </div>
          </section>

          <section className={`${styles.card} ${styles.settingsCard}`}>
            <div className={styles.optionGrid}>
              <button
                type="button"
                className={`${styles.optionCard} ${audienceMode === "invited" ? styles.optionCardActive : ""
                  }`}
                onClick={() => setAudienceMode("invited")}
              >
                <div className={styles.optionTitle}>Invited only</div>
                <CheckUserIcon />
              </button>

              <button
                type="button"
                className={`${styles.optionCard} ${audienceMode === "everyone" ? styles.optionCardActive : ""
                  }`}
                onClick={() => setAudienceMode("everyone")}
              >
                <div className={styles.optionTitle}>Everyone can join</div>
                <UsersIcon />
              </button>
            </div>

            <div className={styles.separator} />

            <div className={styles.joinGrid}>
              <button
                type="button"
                className={`${styles.joinButton} ${joinMode === "anytime" ? styles.joinButtonActive : ""
                  }`}
                onClick={() => setJoinMode("anytime")}
              >
                Join anytime
              </button>
              <button
                type="button"
                className={`${styles.joinButton} ${joinMode === "scheduled" ? styles.joinButtonActive : ""
                  }`}
                onClick={() => setJoinMode("scheduled")}
              >
                Scheduled Participation
              </button>
            </div>

            <div className={styles.separator} />

            <div className={styles.periodSection}>
              <div className={styles.periodTitle}>Enrollment Period</div>
              <div className={styles.periodGrid}>
                <div className={styles.periodCol}>
                  <div className={styles.periodLabel}>Start</div>
                  <div className={styles.periodFields}>
                    <input className={styles.miniFieldDate} placeholder="date" />
                    <input className={styles.miniFieldTime} placeholder="time" />
                  </div>
                </div>

                <div className={styles.periodCol}>
                  <div className={styles.periodLabel}>End</div>
                  <div className={styles.periodFields}>
                    <input className={styles.miniFieldDate} placeholder="date" />
                    <input className={styles.miniFieldTime} placeholder="time" />
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.separator} />

            <div className={styles.periodSection}>
              <div className={styles.periodTitle}>Activity Run Period</div>
              <div className={styles.periodGrid}>
                <div className={styles.periodCol}>
                  <div className={styles.periodLabel}>Start</div>
                  <div className={styles.periodFields}>
                    <input className={styles.miniFieldDate} placeholder="date" />
                    <input className={styles.miniFieldTime} placeholder="time" />
                  </div>
                </div>

                <div className={styles.periodCol}>
                  <div className={styles.periodLabel}>End</div>
                  <div className={styles.periodFields}>
                    <input className={styles.miniFieldDate} placeholder="date" />
                    <input className={styles.miniFieldTime} placeholder="time" />
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.separator} />

            <div className={styles.maxRow}>
              <div className={styles.maxGroup}>
                <label className={styles.maxLabel}>Max Participants</label>
                <input className={styles.maxInput} defaultValue="0" />
              </div>

              <button type="button" className={styles.noToggle}>
                <CheckBox checked={false} />
                <span>No</span>
              </button>
            </div>
          </section>
        </div>
      </div>

      {isMapOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsMapOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalMap}>
              <div className={styles.modalMapRoadA} />
              <div className={styles.modalMapRoadB} />
              <div className={styles.modalMapRoadC} />
              <div className={styles.modalMapRoadD} />
              <div className={styles.modalPinOne} />
              <div className={styles.modalPinTwo} />
              <div className={styles.modalPinThree} />
            </div>

            <div className={styles.modalSearch}>
              <PinIcon />
              <div className={styles.modalSearchText}>
                <SearchIcon />
                <span>Search</span>
              </div>
            </div>

            <button
              type="button"
              className={styles.okButton}
              onClick={() => setIsMapOpen(false)}
            >
              <span>ok</span>
            </button>
          </div>
        </div>
      )}

    </div>

  );
}