import type { NextPage } from 'next';
import styles from './bar-graph.module.css';

export type BarGraphType = {
    className?: string;
    onClose?: () => void;
}



const Frame146: NextPage<BarGraphType> = ({ className = "" }) => {
    return (
        <div className={[styles.barGraphParent, className].join(' ')}>
            <div className={styles.barGraph}>
                <div className={styles.barGraphChild} />
                <div className={styles.groupParent}>
                    <div className={styles.week1040126100126Parent}>
                        <div className={styles.week1040126100126}>
                            <span className={styles.week1040126100126TxtContainer}>
                                <span className={styles.week1}>week1<br /></span>
                                <span className={styles.span}>04/01/26-10/01/26</span>
                            </span>
                        </div>
                        <div className={styles.groupChild} />
                        <div className={styles.xp}>175 XP</div>
                    </div>
                    <div className={styles.week2040126100126Parent}>
                        <div className={styles.week2040126100126}>
                            <span className={styles.week1040126100126TxtContainer}>
                                <span className={styles.week1}>week2<br /></span>
                                <span className={styles.span}>04/01/26-10/01/26</span>
                            </span>
                        </div>
                        <div className={styles.groupItem} />
                        <div className={styles.xp}>90 XP</div>
                    </div>
                    <div className={styles.week3040126100126Parent}>
                        <div className={styles.week3040126100126}>
                            <span className={styles.week1040126100126TxtContainer}>
                                <span className={styles.week1}>week3<br /></span>
                                <span className={styles.span}>04/01/26-10/01/26</span>
                            </span>
                        </div>
                        <div className={styles.groupInner} />
                        <div className={styles.xp}>150 XP</div>
                    </div>
                    <div className={styles.week4040126100126Parent}>
                        <div className={styles.week4040126100126}>
                            <span className={styles.week1040126100126TxtContainer}>
                                <span className={styles.week1}>week4<br /></span>
                                <span className={styles.span}>04/01/26-10/01/26</span>
                            </span>
                        </div>
                        <div className={styles.rectangleDiv} />
                        <div className={styles.xp}>110 XP</div>
                    </div>
                    <div className={styles.week5040126100126Parent}>
                        <div className={styles.week5040126100126}>
                            <span className={styles.week1040126100126TxtContainer}>
                                <span className={styles.week1}>week5<br /></span>
                                <span className={styles.span}>04/01/26-10/01/26</span>
                            </span>
                        </div>
                        <div className={styles.groupChild2} />
                        <div className={styles.xp}>185 XP</div>
                    </div>
                </div>
            </div>
            <div className={styles.periodButton}>
                <div className={styles.periodButtonChild} />
                <div className={styles.rectangleParent}>
                    <div className={styles.groupChild3} />
                    <div className={styles.weekly}>weekly</div>
                </div>
                <div className={styles.rectangleGroup}>
                    <div className={styles.groupChild4} />
                    <div className={styles.daily}>daily</div>
                </div>
                <div className={styles.periodButtonItem} />
            </div>
        </div>);
};

export default Frame146;
