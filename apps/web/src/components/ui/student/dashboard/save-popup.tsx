import type { NextPage } from 'next';
import Image from "next/image";
import styles from './save-popup.module.css';

export type SavePopupType = {
    className?: string;
    onClose?: () => void;
}



const Frame143: NextPage<SavePopupType> = ({ className = "" }) => {
    return (
        <div className={[styles.rectangleParent, className].join(' ')}>
            <div className={styles.frameChild} />
            <Image className={styles.interfaceDelete2RemoveBolIcon} src="/images/placeholder.png" width={60} height={60} sizes="100vw" alt="" />
            <Image className={styles.line1Stroke} src="/images/placeholder.png" width={60} height={60} sizes="100vw" alt="" />
            <div className={styles.title1}>
                <div className={styles.title12}>Save</div>
            </div>
        </div>);
};

export default Frame143;
