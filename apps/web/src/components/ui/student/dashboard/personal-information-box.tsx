import type { NextPage } from 'next';
import { useState, useRef, useCallback } from 'react';
// import Frame111 from "./frame111";
import PortalPopup from "./portal-popup";
import Image from "next/image";
import SavePopup from "./save-popup";
import styles from './personal-information-box.module.css';

export type PersonalInformationBoxType = {
    className?: string;
    onClose?: () => void;
}



const PersonalInformationBox: NextPage<PersonalInformationBoxType> = ({ className = "", onClose }) => {
    const groupContainerRef = useRef<HTMLDivElement>(null);
    const [isFrameOpen, setFrameOpen] = useState(false);
    const okButtonIconRef = useRef<HTMLDivElement>(null);
    const [isFrame1Open, setFrame1Open] = useState(false);

    const openFrame = useCallback(() => {
        setFrameOpen(true);
    }, []);

    const closeFrame = useCallback(() => {
        setFrameOpen(false);
    }, []);


    const openFrame1 = useCallback(() => {
        setFrame1Open(true);
    }, []);

    const closeFrame1 = useCallback(() => {
        setFrame1Open(false);
    }, []);


    const onFrameContainerClick = useCallback(() => {
        const anchor = document.querySelector("[data-scroll-to='textBoxContainer']");
        if (anchor) {
            anchor.scrollIntoView({ "block": "start", "behavior": "smooth" })
        }
    }, []);

    return (<>
        <div className={[styles.personalInformationBox, className].join(' ')}>
            <div className={styles.rectangleParent}>
                <div className={styles.groupChild} />
                <div className={styles.title1}>
                    <div className={styles.title12}>Personal Information</div>
                </div>
                <div className={styles.textBoxWrapper} onClick={onFrameContainerClick}>
                    <div className={styles.textBox} data-scroll-to="textBoxContainer">
                        <div className={styles.longMessageBoxParent}>
                            <div className={styles.longMessageBox}>
                                <div className={styles.longMessageBoxChild} />
                                <div className={styles.body}>
                                    <div className={styles.body2} />
                                </div>
                            </div>
                            <div className={styles.body3}>
                                <div className={styles.body2}>Firsr name</div>
                            </div>
                        </div>
                        <div className={styles.longMessageBoxParent}>
                            <div className={styles.longMessageBox}>
                                <div className={styles.longMessageBoxChild} />
                                <div className={styles.body}>
                                    <div className={styles.body2} />
                                </div>
                            </div>
                            <div className={styles.body3}>
                                <div className={styles.body2}>Last name</div>
                            </div>
                        </div>
                        <div className={styles.longMessageBoxParent}>
                            <div className={styles.shortMessageBoxParent} ref={groupContainerRef} onClick={openFrame}>
                                <div className={styles.shortMessageBox}>
                                    <div className={styles.longMessageBoxChild} />
                                    <div className={styles.body9}>
                                        <div className={styles.body2} />
                                    </div>
                                </div>
                                <div className={styles.body3}>
                                    <div className={styles.body2}>Birth date</div>
                                </div>
                            </div>
                            <div className={styles.shortMessageBoxGroup}>
                                <div className={styles.shortMessageBox}>
                                    <div className={styles.longMessageBoxChild} />
                                    <div className={styles.body9}>
                                        <div className={styles.body2} />
                                    </div>
                                </div>
                                <div className={styles.body3}>
                                    <div className={styles.body2}>Phone number</div>
                                </div>
                            </div>
                        </div>
                        <div className={styles.longMessageBoxParent}>
                            <div className={styles.longMessageBox}>
                                <div className={styles.longMessageBoxChild} />
                                <div className={styles.body}>
                                    <div className={styles.body2} />
                                </div>
                            </div>
                            <div className={styles.body3}>
                                <div className={styles.body2}>Email</div>
                            </div>
                        </div>
                        <div className={styles.longMessageBoxParent}>
                            <div className={styles.longMessageBox}>
                                <div className={styles.longMessageBoxChild} />
                                <div className={styles.body}>
                                    <div className={styles.body2} />
                                </div>
                            </div>
                            <div className={styles.body3}>
                                <div className={styles.body2}>Address</div>
                            </div>
                        </div>
                        <div className={styles.longMessageBoxParent2}>
                            <div className={styles.longMessageBox5}>
                                <div className={styles.longMessageBoxChild} />
                                <div className={styles.body}>
                                    <div className={styles.body2} />
                                </div>
                            </div>
                            <div className={styles.body27}>
                                <div className={styles.body2}>About me</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className={styles.confirmButton}>
                <div className={styles.okButtonIcon} ref={okButtonIconRef} onClick={openFrame1}>
                    <div className={styles.okButtonIconChild} />
                    <Image className={styles.line1Stroke} src="/images/placeholder.png" width={30} height={30} sizes="100vw" alt="" />
                </div>
                <div className={styles.cancelButtonIcon} onClick={onClose}>
                    <div className={styles.okButtonIconChild} />
                    <Image className={styles.interfaceDelete2RemoveBolIcon} src="/images/placeholder.png" width={30} height={30} sizes="100vw" alt="" />
                </div>
            </div>
        </div>
        {isFrameOpen && (
            <PortalPopup
                overlayColor="rgba(0, 0, 0, 0.1)"
                placement="Bottom left"




                relativeLayerRef={groupContainerRef}
                onOutsideClick={closeFrame}
            >
                {/* <Frame111 onClose={closeFrame} /> */}
            </PortalPopup>
        )}
        {isFrame1Open && (
            <PortalPopup
                overlayColor="rgba(0, 0, 0, 0.1)"
                placement="Bottom left"

                left={-129}

                bottom={-483}
                relativeLayerRef={okButtonIconRef}
                onOutsideClick={closeFrame1}
            >
                <SavePopup onClose={closeFrame1} />
            </PortalPopup>
        )}</>);
};

export default PersonalInformationBox;
