import React from 'react';
import { Platform, TextInput } from 'react-native';
import WizardFrame from '../../components/WizardFrame';
import { useWizard } from '../../context/WizardContext';
import { colors as C } from '../../constants/colors';
import ViewComponent from '../../components/ViewComponent';
import TextComponent from '../../components/TextComponent';

/* ==== Khuyến nghị ==== */
const REC_LOSS_PACE = { min: 0.5, max: 1.0 }; // kg/tuần
const REC_GAIN_PACE = { min: 0.25, max: 0.5 }; // kg/tuần
const REC_GAIN_SURPLUS = { min: 300, max: 500 }; // kcal/ngày
const LOSS_HARD_DEFICIT_KCAL = 1000; // kcal/ngày
const GAIN_HARD_PACE = 1.0; // kg/tuần

const calcDailyAdjustment = (kgChange: number, weeks: number) => {
  const days = Math.max(1, Math.round(weeks * 7));
  return (kgChange * 7700) / days; // kcal/day (unsigned)
};
const fmt = (n: number, d = 2) =>
  Number.isFinite(n) ? Number(n.toFixed(d)).toString() : '—';

const INPUT_HEIGHT = 50;

const StepTargetPlanScreen: React.FC = () => {
  const { form, updateForm } = useWizard();
  const isLoss = form.target === 'lose';
  const isGain = form.target === 'gain';

  // preset khi mở/đổi mục tiêu
  const [kg, setKg] = React.useState<string>('');
  const [weeks, setWeeks] = React.useState<string>('');
  React.useEffect(() => {
    if (isLoss) {
      setKg('6'); // ~0.75 kg/tuần cho 8 tuần
      setWeeks('8');
    } else if (isGain) {
      setKg('3'); // ~0.375 kg/tuần cho 8 tuần
      setWeeks('8');
    } else {
      setKg('0');
      setWeeks('0');
    }
  }, [isLoss, isGain]);

  // parse & tính toán
  const kgNum = Math.max(0, Number(kg) || 0);
  const weeksNum = Math.max(0, Number(weeks) || 0); // cho phép 0 nếu maintain

  const pacePerWeek = weeksNum > 0 ? kgNum / weeksNum : 0;
  const dailyAdjUnsigned =
    weeksNum > 0 ? calcDailyAdjustment(kgNum, weeksNum) : 0;

  // điều kiện an toàn
  const withinLossPace =
    isLoss && weeksNum > 0
      ? pacePerWeek >= REC_LOSS_PACE.min && pacePerWeek <= REC_LOSS_PACE.max
      : true;

  const lossOverHardDeficit =
    isLoss && dailyAdjUnsigned > LOSS_HARD_DEFICIT_KCAL;

  const withinGainPace =
    isGain && weeksNum > 0
      ? pacePerWeek >= REC_GAIN_PACE.min && pacePerWeek <= REC_GAIN_PACE.max
      : true;

  const withinGainSurplus =
    isGain && weeksNum > 0
      ? dailyAdjUnsigned >= REC_GAIN_SURPLUS.min &&
        dailyAdjUnsigned <= REC_GAIN_SURPLUS.max
      : true;

  const gainOverHardPace = isGain && pacePerWeek > GAIN_HARD_PACE;

  const withinSafe = isLoss
    ? withinLossPace && !lossOverHardDeficit
    : isGain
    ? withinGainPace && withinGainSurplus && !gainOverHardPace
    : true; // maintain

  // 👉 GHI VÀO FORM: delta có dấu (âm nếu giảm, dương nếu tăng), weeks
  React.useEffect(() => {
    const signedDelta = isLoss ? -kgNum : isGain ? +kgNum : 0; // maintain = 0
    updateForm({
      targetWeightDeltaKg: signedDelta,
      targetDurationWeeks: weeksNum,
      targetPlanValid: withinSafe,
    });
  }, [kgNum, weeksNum, isLoss, isGain, withinSafe, updateForm]);

  const tipText = isLoss
    ? `Khuyến nghị: giảm ${REC_LOSS_PACE.min}–${REC_LOSS_PACE.max} kg/tuần. ` +
      `Tốc độ hiện tại: ${fmt(pacePerWeek)} kg/tuần. ` +
      `Mức cắt ước tính: ${fmt(dailyAdjUnsigned, 0)} kcal/ngày.`
    : isGain
    ? `Khuyến nghị: tăng ${REC_GAIN_PACE.min}–${REC_GAIN_PACE.max} kg/tuần ` +
      `và thặng dư khoảng ${REC_GAIN_SURPLUS.min}–${REC_GAIN_SURPLUS.max} kcal/ngày. ` +
      `Tốc độ hiện tại: ${fmt(pacePerWeek)} kg/tuần. ` +
      `Thặng dư ước tính: ${fmt(dailyAdjUnsigned, 0)} kcal/ngày.`
    : 'Giữ cân: mục tiêu thay đổi cân nặng là 0.';

  return (
    <WizardFrame
      title={
        isLoss
          ? 'Bạn muốn giảm bao nhiêu & trong bao lâu?'
          : isGain
          ? 'Bạn muốn tăng bao nhiêu & trong bao lâu?'
          : 'Bạn muốn giữ cân'
      }
      subtitle="Chúng tôi sẽ kiểm tra an toàn và tính lượng calo cần điều chỉnh mỗi ngày."
    >
      <ViewComponent style={{ width: '100%' }} gap={14}>
        {/* Hàng nhập: kg & tuần */}
        <ViewComponent row alignItems="center" style={{ columnGap: 10 as any }}>
          {/* KG */}
          <ViewComponent style={{ width: '48%' }}>
            <TextComponent
              text={
                isLoss
                  ? 'Muốn giảm'
                  : isGain
                  ? 'Muốn tăng'
                  : 'Thay đổi cân nặng'
              }
              variant="subtitle"
              style={{ marginBottom: 5 }}
            />
            <ViewComponent
              row
              between
              center
              radius={10}
              border
              borderColor={C.slate300}
              backgroundColor={C.white}
              px={10}
              style={{ height: INPUT_HEIGHT, justifyContent: 'center' }}
            >
              <TextInput
                value={kg}
                onChangeText={setKg}
                editable={form.target !== 'maintain'}
                keyboardType={Platform.OS === 'ios' ? 'decimal-pad' : 'numeric'}
                placeholder="0"
                accessibilityLabel="Số kg mục tiêu"
                returnKeyType="done"
                style={{
                  flex: 1,
                  fontSize: 15,
                  color: form.target === 'maintain' ? C.slate300 : C.slate900,
                  paddingVertical: Platform.OS === 'ios' ? 10 : 8,
                  paddingRight: 8,
                }}
              />
              <TextComponent text="kg" weight="semibold" tone="muted" />
            </ViewComponent>
          </ViewComponent>

          {/* WEEKS */}
          <ViewComponent style={{ width: '48%' }}>
            <TextComponent
              text="Thời gian"
              variant="subtitle"
              style={{ marginBottom: 5 }}
            />
            <ViewComponent
              row
              between
              center
              radius={10}
              border
              borderColor={C.slate300}
              backgroundColor={C.white}
              px={10}
              style={{ height: INPUT_HEIGHT, justifyContent: 'center' }}
            >
              <TextInput
                value={weeks}
                onChangeText={setWeeks}
                editable={form.target !== 'maintain'}
                keyboardType={Platform.OS === 'ios' ? 'decimal-pad' : 'numeric'}
                placeholder="0"
                accessibilityLabel="Số tuần"
                returnKeyType="done"
                style={{
                  flex: 1,
                  fontSize: 15,
                  color: form.target === 'maintain' ? C.slate300 : C.slate900,
                  paddingVertical: Platform.OS === 'ios' ? 10 : 8,
                  paddingRight: 8,
                }}
              />
              <TextComponent text="tuần" weight="semibold" tone="muted" />
            </ViewComponent>
          </ViewComponent>
        </ViewComponent>

        {/* Banner an toàn/cảnh báo */}
        <ViewComponent
          radius={10}
          p={10}
          border
          borderColor={withinSafe ? C.emerald200 : '#FACC15'}
          backgroundColor={withinSafe ? C.emerald50 : '#FFF7E6'}
        >
          <TextComponent
            text={tipText}
            size={13.5}
            weight="semibold"
            color={withinSafe ? C.emerald700 : C.amber700}
            style={{ lineHeight: 18 }}
          />

          {form.target === 'lose' ? (
            <>
              {weeksNum > 0 && !withinLossPace && (
                <TextComponent
                  text={`⚠️ Tốc độ không trong khoảng khuyến nghị ${REC_LOSS_PACE.min}–${REC_LOSS_PACE.max} kg/tuần.`}
                  size={12.5}
                  color={C.red}
                  style={{ marginTop: 4 }}
                />
              )}
              {lossOverHardDeficit && (
                <TextComponent
                  text={`⚠️ Không nên cắt quá ${LOSS_HARD_DEFICIT_KCAL} kcal/ngày. Hãy kéo dài thời gian hoặc giảm mục tiêu.`}
                  size={12.5}
                  color={C.red}
                  style={{ marginTop: 4 }}
                />
              )}
              <TextComponent
                text="*Không nên ăn dưới ~1200 kcal/ngày (nữ) hoặc ~1500 kcal/ngày (nam)."
                variant="caption"
                tone="muted"
                style={{ marginTop: 2 }}
              />
            </>
          ) : form.target === 'gain' ? (
            <>
              {weeksNum > 0 && !withinGainPace && (
                <TextComponent
                  text={`⚠️ Tốc độ tăng nên trong ${REC_GAIN_PACE.min}–${REC_GAIN_PACE.max} kg/tuần để ưu tiên tăng nạc.`}
                  size={12.5}
                  color={C.red}
                  style={{ marginTop: 4 }}
                />
              )}
              {weeksNum > 0 && !withinGainSurplus && (
                <TextComponent
                  text={`⚠️ Thặng dư nên khoảng ${REC_GAIN_SURPLUS.min}–${REC_GAIN_SURPLUS.max} kcal/ngày so với TDEE.`}
                  size={12.5}
                  color={C.red}
                  style={{ marginTop: 4 }}
                />
              )}
              {gainOverHardPace && (
                <TextComponent
                  text={`⚠️ Tăng > ${GAIN_HARD_PACE} kg/tuần dễ tích mỡ. Hãy tăng số tuần hoặc giảm mục tiêu mỗi tuần.`}
                  size={12.5}
                  color={C.red}
                  style={{ marginTop: 4 }}
                />
              )}
            </>
          ) : null}
        </ViewComponent>

        {/* Cards tóm tắt */}
        <ViewComponent row gap={10} mt={6}>
          <ViewComponent flex={1} variant="card" p={10} radius={10} border>
            <TextComponent text="Tốc độ" variant="caption" tone="muted" />
            <TextComponent
              text={`${fmt(pacePerWeek)} kg/tuần`}
              size={16.5}
              weight="bold"
              color={C.slate900}
            />
          </ViewComponent>

          <ViewComponent flex={1} variant="card" p={10} radius={10} border>
            <TextComponent
              text={form.target === 'lose' ? 'Mức cắt calo' : 'Thặng dư calo'}
              variant="caption"
              tone="muted"
            />
            <TextComponent
              text={`${form.target === 'lose' ? '−' : '+'}${fmt(
                dailyAdjUnsigned,
                0,
              )} kcal/ngày`}
              size={16.5}
              weight="bold"
              color={C.slate900}
            />
            <TextComponent
              text={
                form.target === 'lose'
                  ? `Dựa trên 7.700 kcal/kg • Không cắt > ${LOSS_HARD_DEFICIT_KCAL} kcal/ngày`
                  : `Dựa trên 7.700 kcal/kg • Khuyến nghị ${REC_GAIN_SURPLUS.min}–${REC_GAIN_SURPLUS.max} kcal/ngày`
              }
              variant="caption"
              tone="muted"
              style={{ marginTop: 2 }}
            />
          </ViewComponent>
        </ViewComponent>

        <TextComponent
          text="*Tốc độ quá nhanh có thể gây mất cơ, rối loạn chuyển hoá hoặc tích mỡ thừa. Tăng/giảm từ từ giúp kiểm soát dinh dưỡng tốt hơn."
          variant="caption"
          tone="muted"
          style={{ marginTop: 4 }}
        />
      </ViewComponent>
    </WizardFrame>
  );
};

export default StepTargetPlanScreen;
