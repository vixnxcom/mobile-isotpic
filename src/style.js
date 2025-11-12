const styles = {
  boxWidth: "xl:max-w-[1440px] w-full",

  heading1: "aeon-bold text-center xs:text-[44px] text-[40px] shadoww text-white xs:leading-[76.8px] leading-[66.8px] w-full",
  heading5: "aeon-bold text-center xs:text-[44px] text-[40px] shadoww text-black xs:leading-[76.8px] leading-[66.8px] w-full",
  heading2: "aeon-bold text-center xs:text-[20px] shadowy text-[24px] text-white xs:leading-[76.8px] leading-[66.8px] w-full",
  heading4: "aeon-bold text-center xs:text-[20px] shadowy text-[24px] text-black xs:leading-[76.8px] leading-[66.8px] w-full",
  heading6: "aeon-bold text-center xs:text-[20px] shadowy text-[24px] bluey xs:leading-[76.8px] leading-[66.8px] w-full",

  heading9: "aeon-bold text-center xs:text-[20px] shade text-[20px] bluey xs:leading-[76.8px] leading-[66.8px] w-full tracking-wide",
  heading3: "aeon-bold text-center xs:text-[20px] shadowy text-[24px] text-white xs:leading-[66.8px] leading-[56.8px] w-full",
  heading7: "aeon-bold text-center xs:text-[20px] shadowy text-[24px] text-black xs:leading-[66.8px] leading-[56.8px] w-full",
  subHeading: "noto text-center xs:text-[28px] text-[24px] text-white mt-5 w-full shade",
  subHeadingy: "noto text-center xs:text-[28px] text-[24px] text-black mt-5 w-full shade tracking-wide",
 
 
  subHeadingc: "noto text-left xs:text-[28px] text-[24px]  text-white mt-5 w-full",
  subHeadingb: "noto text-left xs:text-[28px] text-[24px] text-black mt-5 w-full",
  subHeadingx: "noto text-left xs:text-[28px] text-[24px] text-white mt-5 w-full",
  subHeadingxy: "noto text-left xs:text-[24px] text-[20px] text-white mt-5 w-full tracking-wide",

  paragraph: "noto font-normal text-white md:text-[14px] text-[16px] leading-[30.8px]",
  paragraphx: "noto font-normal  md:text-[14px] text-[16px] leading-[30.8px]",
  paragraphi: "italic md:text-[14px] text-[16px] leading-[30.8px]",
  paragraphy: "noto text-left md:text-[14px] font-normal text-[16px] coal mt-5 w-full tracking-wide leading-[30.8px]",


  flexCenter: "flex justify-center items-center",
  flexStart: "flex justify-center items-start",

  paddingX: "sm:px-16 px-6",
  paddingY: "sm:py-16 py-6",
  padding: "sm:px-16 px-6 sm:py-12 py-4",

  marginX: "sm:mx-16 mx-6",
  marginY: "sm:my-16 my-6",
};

export const layout = {
  section: `flex md:flex-row flex-col ${styles.paddingY}`,
  sectionReverse: `flex md:flex-row flex-col-reverse ${styles.paddingY}`,

  sectionImgReverse: `flex-1 flex ${styles.flexCenter} md:mr-10 mr-0 md:mt-0 mt-10 relative`,
  sectionImg: `flex-1 flex ${styles.flexCenter} md:ml-10 ml-0 md:mt-0 mt-10 relative`,

  sectionInfo: `flex-1 ${styles.flexStart} flex-col`,
};

export default styles;
