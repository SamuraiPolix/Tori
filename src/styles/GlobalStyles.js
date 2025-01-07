/* fonts */
export const FontFamily = {
  assistantRegular: "Assistant-Regular",
  assistantExtraLight: "Assistant-ExtraLight",
  assistantBold: "Assistant-Bold",
  poppinsThin: "Poppins-Thin",
  poppinsRegular: "Poppins-Regular",
  poppinsBold: "Poppins-Bold",
  callout16: "Lato-Bold",
  interMedium: "Inter-Medium"
};

/* font sizes */
export const FontSize = {
  callout16_size: 16,
  size_lg: 18,
  size_2xs: 11,
  size_3xs: 10,
  size_3xl_5: 20,
  size_5xl: 24,
  size_6xl: 28
};

/* Colors */
export const Color = {
  grayscaleColorWhite: "#fff",
  black: "#000",
  primaryColorAmaranthPurple: "#156779",
  grayscaleColorSpanishGray: "#9b9b9b",
  colorGainsboro: "#dedede",
  grayscaleColorJet: "#333333",
  grayscaleColorBlack: "#000000",
  colorLightgray: "#d1d5db",
  colorGray_100: "#f2f2f2"
};

/* border radiuses */
export const Border = {
  br_xl: 20,
  br_3xs: 10,
  br_8xs: 5,
  br_8xs_6: 4,
  br_81xl: 100
};

/* padding */
export const Padding = {
  p_11xl: 30,
  p_xs: 12,
  p_base: 16,
  p_5xl: 24
};

/* spacing/gap */
export const Gap = {
  gap_sm: 2,
  gap_md: 4,
  gap_lg: 8,
  gap_xl: 16
};

/* box shadows */
export const Shadow = {
  elevation1: {
    shadowColor: "#898a8d",
    shadowOffset: {
      width: 0,
      height: 1
    },
    shadowRadius: 0,
    shadowOpacity: 1,
    elevation: 1
  },
  elevation5: {
    shadowColor: "rgba(130, 164, 131, 0.22)",
    shadowOffset: {
      width: 0,
      height: 7
    },
    shadowRadius: 33,
    shadowOpacity: 1,
    elevation: 5
  }
};

/* layout dimensions */
export const Layout = {
  containerPadding: '5%',
  buttonHeight: '7%',
  inputHeight: '7%',
  headerSpacing: '4%',
  iconSize: {
    small: 20,
    medium: 24,
    large: 32
  }
};

/* common styles */
export const CommonStyles = {
  flexCenter: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  flexRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  input: {
    borderWidth: 1,
    borderColor: Color.colorGainsboro,
    borderRadius: Border.br_xl,
    padding: Padding.p_base
  },
  button: {
    backgroundColor: Color.primaryColorAmaranthPurple,
    borderRadius: Border.br_xl,
    padding: Padding.p_base,
    ...Shadow.elevation5
  },
  buttonText: {
    color: Color.grayscaleColorWhite,
    fontFamily: FontFamily.assistantBold,
    fontSize: FontSize.size_lg
  },
  headerText: {
    fontFamily: FontFamily.assistantBold,
    fontSize: FontSize.size_5xl,
    textAlign: 'center'
  },
  subHeaderText: {
    fontFamily: FontFamily.assistantRegular,
    fontSize: FontSize.callout16_size,
    color: Color.grayscaleColorSpanishGray,
    textAlign: 'center'
  }
};

// RTL Support
export const RTL = {
  textAlign: 'right',
  writingDirection: 'rtl',
  flexDirection: 'row-reverse'
};