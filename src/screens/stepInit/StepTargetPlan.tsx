import React from 'react';
import { View, Text, StyleSheet, Platform, TextInput } from 'react-native';
import WizardFrame from '../../components/WizardFrame';
import { useWizard } from '../../context/WizardContext';
import { colors } from '../../constants/colors';

const SAFE_RANGES = {
  lose: { min: 0.25, max: 1.0 },
  gain: { min: 0.25, max: 0.5 },
};

function calcDailyAdjustment(kgChange: number, weeks: number) {
  const days = Math.max(1, Math.round(weeks * 7));
  return (kgChange * 7700) / days; // kcal/day
}
function fmt(n: number, d = 2) {
  return Number.isFinite(n) ? Number(n.toFixed(d)).toString() : '—';
}

/* ==== Compact layout constants ==== */
const INPUT_HEIGHT = 50;
const FIELD_MIN_WIDTH = 120; // nếu màn rất hẹp có thể hạ xuống 110
const SUFFIX_PAD_RIGHT = 36;

const StepTargetPlanScreen: React.FC = () => {
  const { form, updateForm } = useWizard();
  const isLoss = form.target === 'lose';

  // Mặc định an toàn ~0.5 kg/tuần (4 kg trong 8 tuần)
  const [kg, setKg] = React.useState<string>(
    form?.targetAmountKg ? String(form.targetAmountKg) : '4',
  );
  const [weeks, setWeeks] = React.useState<string>(
    form?.targetDurationWeeks ? String(form.targetDurationWeeks) : '8',
  );

  // Tính toán & cập nhật form khi input thay đổi
  React.useEffect(() => {
    const kgNum = Math.max(0, Number(kg) || 0);
    const weeksNum = Math.max(1, Number(weeks) || 0);
    const pacePerWeek = kgNum / weeksNum;

    const safe = isLoss ? SAFE_RANGES.lose : SAFE_RANGES.gain;
    const hardLimit = isLoss ? 1.5 : 1.0;

    const withinSafe = pacePerWeek >= safe.min && pacePerWeek <= safe.max;
    const isOverHardCap = pacePerWeek > hardLimit;
    const dailyAdjUnsigned = calcDailyAdjustment(kgNum, weeksNum);

    updateForm({
      targetAmountKg: kgNum,
      targetDurationWeeks: weeksNum,
      goalRatePerWeekKg: pacePerWeek * (isLoss ? -1 : 1),
      dailyCalorieAdjustment: (isLoss ? -1 : 1) * dailyAdjUnsigned,
      targetPlanValid: withinSafe && !isOverHardCap,
    });
  }, [kg, weeks, isLoss, updateForm]);

  // Dùng để hiển thị
  const kgNum = Math.max(0, Number(kg) || 0);
  const weeksNum = Math.max(1, Number(weeks) || 0);
  const pacePerWeek = kgNum / weeksNum;
  const dailyAdjUnsigned = calcDailyAdjustment(kgNum, weeksNum);
  const safe = isLoss ? SAFE_RANGES.lose : SAFE_RANGES.gain;
  const hardLimit = isLoss ? 1.5 : 1.0;
  const withinSafe = pacePerWeek >= safe.min && pacePerWeek <= safe.max;
  const isOverHardCap = pacePerWeek > hardLimit;

  const tipText = isLoss
    ? `Khuyến nghị y tế: giảm ${SAFE_RANGES.lose.min}–${
        SAFE_RANGES.lose.max
      } kg/tuần. Tốc độ hiện tại: ${fmt(pacePerWeek)} kg/tuần.`
    : `Khuyến nghị y tế: tăng ${SAFE_RANGES.gain.min}–${
        SAFE_RANGES.gain.max
      } kg/tuần. Tốc độ hiện tại: ${fmt(pacePerWeek)} kg/tuần.`;

  return (
    <WizardFrame
      title={
        isLoss
          ? 'Bạn muốn giảm bao nhiêu & trong bao lâu?'
          : 'Bạn muốn tăng bao nhiêu & trong bao lâu?'
      }
      subtitle="Chúng tôi sẽ kiểm tra an toàn và tính lượng calo cần điều chỉnh mỗi ngày."
    >
      <View style={s.group}>
        {/* Row chỉ còn 2 ô: kg & tuần */}
        <View style={s.row}>
          {/* KG */}
          <View style={s.field}>
            <Text style={s.label}>{isLoss ? 'Muốn giảm' : 'Muốn tăng'}</Text>
            <View style={s.inputWrap}>
              <TextInput
                value={kg}
                onChangeText={setKg}
                keyboardType={Platform.OS === 'ios' ? 'decimal-pad' : 'numeric'}
                placeholder="0"
                style={s.input}
                accessibilityLabel="Số kg mục tiêu"
                returnKeyType="done"
              />
              <Text style={s.suffix}>kg</Text>
            </View>
          </View>

          {/* WEEKS */}
          <View style={s.field}>
            <Text style={s.label}>Thời gian</Text>
            <View style={s.inputWrap}>
              <TextInput
                value={weeks}
                onChangeText={setWeeks}
                keyboardType={Platform.OS === 'ios' ? 'decimal-pad' : 'numeric'}
                placeholder="0"
                style={s.input}
                accessibilityLabel="Số tuần"
                returnKeyType="done"
              />
              <Text style={s.suffix}>tuần</Text>
            </View>
          </View>
        </View>

        {/* Banner an toàn/cảnh báo */}
        <View style={[s.banner, withinSafe ? s.bannerSafe : s.bannerWarn]}>
          <Text
            style={[
              s.bannerText,
              { color: withinSafe ? colors.emerald700 : colors.amber700 },
            ]}
          >
            {tipText}
          </Text>
          {isOverHardCap && (
            <Text style={s.hardCap}>
              ⚠️ Vượt giới hạn an toàn {hardLimit} kg/tuần. Hãy tăng số tuần
              hoặc giảm số kg.
            </Text>
          )}
        </View>

        {/* Cards tóm tắt */}
        <View style={s.cards}>
          <View style={s.cardMini}>
            <Text style={s.cardTitle}>Tốc độ</Text>
            <Text style={s.cardValue}>{fmt(pacePerWeek)} kg/tuần</Text>
          </View>
          <View style={s.cardMini}>
            <Text style={s.cardTitle}>Điều chỉnh calo</Text>
            <Text style={s.cardValue}>
              {isLoss ? '−' : '+'}
              {fmt(dailyAdjUnsigned, 0)} kcal/ngày
            </Text>
            <Text style={s.cardNote}>Dựa trên 7.700 kcal/kg</Text>
          </View>
        </View>

        <Text style={s.disclaimer}>
          *Khuyến nghị y tế chung: giảm 0.25–1.0 kg/tuần; tăng 0.25–0.5 kg/tuần.
          Tốc độ quá nhanh có thể gây mất cơ, rối loạn chuyển hóa hoặc tăng mỡ
          không mong muốn.
        </Text>
      </View>
    </WizardFrame>
  );
};

const s = StyleSheet.create({
  group: { width: '100%', gap: 14 },

  // Ép cùng 1 hàng: mỗi field ~48%, còn lại cho gap
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
    columnGap: 10 as any, // RN mới; nếu RN cũ: bỏ và dùng margin
  },

  field: {
    width: '48%', // đảm bảo 2 ô nằm một hàng
    minWidth: FIELD_MIN_WIDTH,
  },

  label: {
    color: colors.slate700,
    marginBottom: 4,
    fontWeight: '600',
    fontSize: 13.5,
  },

  inputWrap: {
    position: 'relative',
    height: INPUT_HEIGHT,
    borderWidth: 1.2,
    borderColor: colors.slate300,
    backgroundColor: colors.white,
    borderRadius: 10,
    paddingLeft: 10,
    paddingRight: SUFFIX_PAD_RIGHT,
    justifyContent: 'center',
  },

  input: {
    fontSize: 15,
    color: colors.slate900,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
  },

  suffix: {
    position: 'absolute',
    right: 10,
    top: 0,
    bottom: 0,
    includeFontPadding: false,
    textAlign: 'right',
    ...Platform.select({
      ios: { lineHeight: INPUT_HEIGHT },
      android: { lineHeight: INPUT_HEIGHT },
    }),
    color: colors.slate600,
    fontSize: 14,
    fontWeight: '500',
  },

  banner: { borderRadius: 10, padding: 10, marginTop: 12 },
  bannerSafe: {
    backgroundColor: colors.emerald50,
    borderWidth: 1,
    borderColor: colors.emerald200,
  },
  bannerWarn: {
    backgroundColor: '#FFF7E6',
    borderWidth: 1,
    borderColor: '#FACC15',
  },
  bannerText: { fontSize: 13.5, lineHeight: 18, fontWeight: '600' },
  hardCap: { marginTop: 4, color: colors.red, fontSize: 12.5 },

  cards: { flexDirection: 'row', gap: 10, marginTop: 6 },
  cardMini: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.slate200,
    padding: 10,
  },
  cardTitle: {
    color: colors.slate700,
    fontWeight: '600',
    marginBottom: 2,
    fontSize: 13.5,
  },
  cardValue: { fontSize: 16.5, fontWeight: '700', color: colors.slate900 },
  cardNote: { marginTop: 1, fontSize: 11.5, color: colors.slate500 },

  disclaimer: { fontSize: 12, color: colors.slate600, marginTop: 4 },
});

export default StepTargetPlanScreen;
