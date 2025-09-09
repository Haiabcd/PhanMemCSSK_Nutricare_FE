// features/WizardScreens.tsx
import React from "react";
import { View, Text, StyleSheet, Pressable, Platform } from "react-native";
import ProfilePhoto from "../../components/ProfilePhoto";
import WizardFrame from "../../components/WizardFrame";
import { useWizard } from "../../context/WizardContext";
import { colors } from "../../constants/colors";

export const StepGenderScreen = () => {
  const { form, updateForm } = useWizard();


  const options = [
    { 
      key: "male" as const, 
      label: "Nam", 
      icon: "👨",
      description: "Giới tính nam"
    },
    { 
      key: "female" as const, 
      label: "Nữ", 
      icon: "👩",
      description: "Giới tính nữ"
    },
    { 
      key: "other" as const, 
      label: "Khác", 
      icon: "😊",
      description: "Giới tính khác"
    },
  ];

  return (
    <WizardFrame 
      title="Giới Tính Của Bạn?" 
      subtitle="Hãy chọn giới tính phù hợp để chúng tôi cá nhân hóa trải nghiệm của bạn tốt hơn"
    >

      <View style={styles.radioGroup}>
        {options.map((opt) => {
          const selected = form.gender === opt.key;
          return (
            <Pressable
              key={opt.key}
              onPress={() => {
                if (__DEV__) {
                  console.log('[Gender] chọn:', opt.key);
                  console.log(`[Gender] prev=${form.gender} -> next=${opt.key}`);
                }
                updateForm({ gender: opt.key });
              }}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              style={({ pressed }) => [
                styles.radioItem,
                selected && styles.radioItemSelected,
                pressed && styles.radioItemPressed,
              ]}
            >
              <View style={styles.radioContent}>
                <Text style={styles.icon}>{opt.icon}</Text>
                
                <View style={styles.textContainer}>
                  <Text style={[styles.radioLabel, selected && styles.radioLabelSelected]}>
                    {opt.label}
                  </Text>
                  <Text style={[styles.radioDescription, selected && styles.radioDescriptionSelected]}>
                    {opt.description}
                  </Text>
                </View>
                
                <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
                  {selected && <View style={styles.radioInner} />}
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>
    </WizardFrame>
  );
};

/** Styles */
const styles = StyleSheet.create({
  imageWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 30,
    marginBottom: 20,
  },
  radioGroup: {
    width: "100%",
    // paddingHorizontal: 20,
    gap: 12,
  },
  radioItem: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    padding: 16,
    
    // Shadow
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
  radioItemSelected: {
    borderColor: colors.green || "#22C55E",
    backgroundColor:"#ECFDF5",
    shadowColor: colors.green || "#22C55E",
    shadowOpacity: 0.1,
    elevation: 4,
  },
  radioItemPressed: {
    transform: [{ scale: 0.99 }],
    opacity: Platform.OS === "ios" ? 0.9 : 1,
  },
  radioContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  icon: {
    fontSize: 28,
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  radioLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
  },
  radioLabelSelected: {
    color: "#065F46",
    fontWeight: "700",
  },
  radioDescription: {
    fontSize: 13,
    color:  "#64748B",
  },
  radioDescriptionSelected: {
    color:"#047857",
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: "#94A3B8",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterSelected: {
    borderColor: "#16A34A",
    backgroundColor: "#D1FAE5",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.green,
  },
});