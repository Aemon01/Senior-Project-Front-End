"use client";
import type { NextPage } from "next";
import { useState, type CSSProperties } from "react";
import { Box } from "@mui/material";
import Mouth from "./mouth";
import WeekDey from "./week-dey";
import DeyNumber from "./dey-number";
import styles from "./october.module.css";

export type OctoberType = {
  className?: string;
  fill?: CSSProperties["fill"];
};

const October: NextPage<OctoberType> = ({ className = "", fill }) => {
  const [weekDeyItems] = useState([
    {
      weekend: true,
      text: "Sun",
    },
    {
      weekend: false,
      text: "Mon",
    },
    {
      weekend: false,
      text: "Tue",
    },
    {
      weekend: false,
      text: "Wed",
    },
    {
      weekend: false,
      text: "Thu",
    },
    {
      weekend: false,
      text: "Fri",
    },
    {
      weekend: true,
      text: "Sat",
    },
  ]);
  const [deyNumberItems] = useState([
    {
      fill: false,
      strok: false,
      weekend: true,
      text: "28",
    },
    {
      fill: false,
      strok: false,
      weekend: false,
      text: "29",
    },
    {
      fill: false,
      strok: false,
      weekend: false,
      text: "30",
    },
    {
      fill: false,
      strok: false,
      weekend: false,
      text: "1",
    },
    {
      fill: false,
      strok: false,
      weekend: false,
      text: "2",
    },
    {
      fill: false,
      strok: false,
      weekend: false,
      text: "3",
    },
    {
      fill: false,
      strok: false,
      weekend: true,
      text: "4",
    },
  ]);
  const [deyNumberItems1] = useState([
    {
      fill: false,
      strok: false,
      weekend: true,
      text: "5",
    },
    {
      fill: false,
      strok: false,
      weekend: false,
      text: "6",
    },
    {
      fill: false,
      strok: false,
      weekend: false,
      text: "7",
    },
    {
      fill: false,
      strok: false,
      weekend: false,
      text: "8",
    },
    {
      fill: false,
      strok: false,
      weekend: false,
      text: "9",
    },
    {
      fill: false,
      strok: false,
      weekend: false,
      text: "10",
    },
    {
      fill: false,
      strok: false,
      weekend: true,
      text: "11",
    },
  ]);
  const [deyNumberItems2] = useState([
    {
      fill: false,
      strok: false,
      weekend: true,
      text: "12",
    },
    {
      fill: false,
      strok: false,
      weekend: false,
      text: "13",
    },
    {
      fill: false,
      strok: false,
      weekend: false,
      text: "14",
    },
    {
      fill: false,
      strok: false,
      weekend: false,
      text: "15",
    },
    {
      fill: false,
      strok: false,
      weekend: false,
      text: "16",
    },
    {
      fill: false,
      strok: false,
      weekend: false,
      text: "17",
    },
    {
      fill: false,
      strok: false,
      weekend: true,
      text: "18",
    },
  ]);
  const [deyNumberItems3] = useState([
    {
      fill: false,
      strok: false,
      weekend: true,
      text: "19",
    },
    {
      fill: false,
      strok: false,
      weekend: false,
      text: "20",
    },
    {
      fill: false,
      strok: false,
      weekend: false,
      text: "21",
    },
    {
      fill: false,
      strok: false,
      weekend: false,
      text: "22",
    },
    {
      fill: false,
      strok: false,
      weekend: false,
      text: "23",
    },
    {
      fill: false,
      strok: false,
      weekend: false,
      text: "24",
    },
    {
      fill: false,
      strok: false,
      weekend: true,
      text: "25",
    },
  ]);
  const [deyNumberItems4] = useState([
    {
      fill: false,
      strok: false,
      weekend: true,
      text: "26",
    },
    {
      fill: false,
      strok: false,
      weekend: false,
      text: "27",
    },
    {
      fill: false,
      strok: false,
      weekend: false,
      text: "28",
    },
    {
      fill: false,
      strok: false,
      weekend: false,
      text: "29",
    },
    {
      fill: false,
      strok: false,
      weekend: false,
      text: "30",
    },
    {
      fill: false,
      strok: false,
      weekend: false,
      text: "31",
    },
    {
      fill: false,
      strok: false,
      weekend: true,
      text: "1",
    },
  ]);
  const [deyNumberItems5] = useState([
    {
      fill: false,
      strok: false,
      weekend: true,
      text: "2",
    },
    {
      fill: false,
      strok: false,
      weekend: false,
      text: "3",
    },
    {
      fill: false,
      strok: false,
      weekend: false,
      text: "4",
    },
    {
      fill: false,
      strok: false,
      weekend: false,
      text: "5",
    },
    {
      fill: false,
      strok: false,
      weekend: false,
      text: "6",
    },
    {
      fill: false,
      strok: false,
      weekend: false,
      text: "7",
    },
    {
      fill: false,
      strok: false,
      weekend: true,
      text: "8",
    },
  ]);
  return (
    <Box className={[styles.month202510October, className].join(" ")}>
      <Box className={styles.header}>
        <Mouth fill={fill} />
      </Box>
      <Box className={styles.grid}>
        <Box className={styles.line}>
          <Box className={styles.atomsMonthNamber}>
            <div className={styles.text}>10</div>
          </Box>
          {weekDeyItems.map((item, index) => (
            <WeekDey key={index} weekend={item.weekend} text={item.text} />
          ))}
        </Box>
        <Box className={styles.line2}>
          <Box className={styles.atomsWeekNamber}>
            <div className={styles.text}>40</div>
          </Box>
          {deyNumberItems.map((item, index) => (
            <DeyNumber
              key={index}
              fill={item.fill}
              strok={item.strok}
              weekend={item.weekend}
              text={item.text}
            />
          ))}
        </Box>
        <Box className={styles.line2}>
          <Box className={styles.atomsWeekNamber2}>
            <div className={styles.text}>41</div>
          </Box>
          {deyNumberItems1.map((item, index) => (
            <DeyNumber
              key={index}
              fill={item.fill}
              strok={item.strok}
              weekend={item.weekend}
              text={item.text}
            />
          ))}
        </Box>
        <Box className={styles.line2}>
          <Box className={styles.atomsWeekNamber2}>
            <div className={styles.text}>42</div>
          </Box>
          {deyNumberItems2.map((item, index) => (
            <DeyNumber
              key={index}
              fill={item.fill}
              strok={item.strok}
              weekend={item.weekend}
              text={item.text}
            />
          ))}
        </Box>
        <Box className={styles.line2}>
          <Box className={styles.atomsWeekNamber2}>
            <div className={styles.text}>43</div>
          </Box>
          {deyNumberItems3.map((item, index) => (
            <DeyNumber
              key={index}
              fill={item.fill}
              strok={item.strok}
              weekend={item.weekend}
              text={item.text}
            />
          ))}
        </Box>
        <Box className={styles.line2}>
          <Box className={styles.atomsWeekNamber2}>
            <div className={styles.text}>44</div>
          </Box>
          {deyNumberItems4.map((item, index) => (
            <DeyNumber
              key={index}
              fill={item.fill}
              strok={item.strok}
              weekend={item.weekend}
              text={item.text}
            />
          ))}
        </Box>
        <Box className={styles.line2}>
          <Box className={styles.atomsWeekNamber2}>
            <div className={styles.text}>45</div>
          </Box>
          {deyNumberItems5.map((item, index) => (
            <DeyNumber
              key={index}
              fill={item.fill}
              strok={item.strok}
              weekend={item.weekend}
              text={item.text}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default October;
