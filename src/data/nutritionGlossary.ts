// src/data/nutritionGlossary.ts

export type GlossaryQuickGroup = {
    id: string;
    label: string;
    items: string[];
};

export const QUICK_GROUPS: GlossaryQuickGroup[] = [
    {
        id: 'basic',
        label: 'Khái niệm cơ bản',
        items: [
            'Calorie là gì?',
            'Protein là gì?',
            'Carb là gì?',
            'Chất béo tốt là gì?',
            'Chất xơ là gì?',
        ],
    },
    {
        id: 'energy_weight',
        label: 'Năng lượng & cân nặng',
        items: [
            'BMR là gì?',
            'TDEE là gì?',
            'Cách tính TDEE để giảm cân',
            'Mức giảm cân an toàn mỗi tuần',
            'Mức tăng cân / tăng cơ an toàn mỗi tuần',
        ],
    },
    {
        id: 'macro_food',
        label: 'Macro & thực phẩm',
        items: [
            'Macro là gì?',
            'Tỷ lệ macro cho giảm mỡ',
            'Tỷ lệ macro cho tăng cơ',
            'Thực phẩm giàu protein là gì?',
            'Thực phẩm nhiều chất xơ là gì?',
        ],
    },
    {
        id: 'health_index',
        label: 'Chỉ số sức khoẻ & bệnh lý',
        items: [
            'Chỉ số BMI là gì?',
            'Thế nào là BMI bình thường?',
        ],
    },
];

/* ========= RULE Q&A: dễ bổ sung ========= */

type GlossaryEntry = {
    id: string;
    patterns: string[]; // các cụm text để match (đã normalize)
    answer: string;
};

function normalize(text: string) {
    return text.toLowerCase().trim();
}

const ENTRIES: GlossaryEntry[] = [
    /* ====== CƠ BẢN ====== */
    {
        id: 'calorie',
        patterns: ['calorie là gì', 'kcal là gì'],
        answer:
            'Calorie (kcal) là đơn vị đo năng lượng.\n' +
            '- Khi ăn uống, ta nạp năng lượng qua thức ăn.\n' +
            '- Khi vận động, cơ thể “đốt” năng lượng đó.\n\n' +
            'Về lâu dài:\n' +
            '- Muốn giảm cân: tổng kcal nạp < tổng kcal tiêu hao.\n' +
            '- Muốn tăng cân: tổng kcal nạp > tổng kcal tiêu hao.',
    },
    {
        id: 'protein_basic',
        patterns: ['protein là gì', 'đạm là gì'],
        answer:
            'Protein (đạm) là chất dinh dưỡng chính giúp:\n' +
            '- Xây dựng & duy trì cơ bắp\n' +
            '- Hồi phục sau tập luyện\n' +
            '- Hỗ trợ hệ miễn dịch, hóc-môn, enzym\n\n' +
            'Nguồn protein tốt: thịt nạc, cá, trứng, sữa chua Hy Lạp, đậu, đậu phụ, whey protein (nếu phù hợp).',
    },
    {
        id: 'carb_basic',
        patterns: ['carb là gì', 'tinh bột là gì'],
        answer:
            'Carb (carbohydrate, tinh bột + đường + chất xơ) là nguồn năng lượng chính cho cơ thể.\n\n' +
            'Có thể chia đơn giản:\n' +
            '- Carb tốt: gạo lứt, yến mạch, khoai, ngũ cốc nguyên hạt, rau, trái cây.\n' +
            '- Carb kém: nước ngọt, bánh kẹo, đồ ngọt nhiều đường tinh luyện.\n\n' +
            'Ưu tiên carb tốt sẽ giúp no lâu, ổn định đường huyết hơn.',
    },
    {
        id: 'fat_good',
        patterns: ['chất béo tốt là gì', 'fat là gì'],
        answer:
            'Chất béo là một trong 3 nhóm macro chính (cùng với protein & carb).\n\n' +
            'Chất béo tốt (unsaturated fat):\n' +
            '- Có trong: cá béo (cá hồi, cá thu), quả bơ, dầu olive, các loại hạt, óc chó...\n' +
            '- Vai trò: hỗ trợ hấp thu vitamin A, D, E, K; tốt cho tim mạch & hormone.\n\n' +
            'Nên hạn chế chất béo xấu (trans fat, nhiều đồ chiên rán, đồ ăn nhanh).',
    },
    {
        id: 'fiber_basic',
        patterns: ['chất xơ là gì', 'xơ đạm là gì', 'xơ là gì'],
        answer:
            'Chất xơ là phần của thực phẩm thực vật mà cơ thể không tiêu hoá được nhưng rất có lợi cho sức khoẻ:\n' +
            '- Hỗ trợ tiêu hoá, giảm táo bón\n' +
            '- Giúp no lâu hơn, hỗ trợ kiểm soát cân nặng\n' +
            '- Hỗ trợ kiểm soát đường huyết & cholesterol\n\n' +
            'Nguồn xơ tốt: rau xanh, trái cây, ngũ cốc nguyên hạt, các loại đậu, hạt.',
    },

    /* ====== NĂNG LƯỢNG & CÂN NẶNG ====== */
    {
        id: 'bmr',
        patterns: ['bmr là gì'],
        answer:
            'BMR (Basal Metabolic Rate) là lượng năng lượng cơ thể cần để duy trì các hoạt động sống cơ bản ' +
            '(thở, tim đập, duy trì thân nhiệt...) khi bạn hoàn toàn nghỉ ngơi.\n\n' +
            'Nói đơn giản: đây là “mức tiêu hao tối thiểu” mỗi ngày, chưa tính đi lại hay tập luyện.\n' +
            'App NutriCare có thể dùng BMR để tính TDEE & gợi ý khẩu phần phù hợp.',
    },
    {
        id: 'tdee',
        patterns: ['tdee là gì'],
        answer:
            'TDEE (Total Daily Energy Expenditure) là tổng năng lượng bạn tiêu hao trong một ngày, gồm:\n' +
            '- BMR (năng lượng nền)\n' +
            '- Hoạt động hàng ngày (đi lại, làm việc, sinh hoạt)\n' +
            '- Tập luyện (gym, chạy bộ, thể thao...)\n\n' +
            'TDEE là mốc quan trọng để thiết kế thực đơn giảm cân / tăng cân.',
    },
    {
        id: 'calc_tdee',
        patterns: ['cách tính tdee', 'tdee để giảm cân', 'cách tính tdee để giảm cân'],
        answer:
            'TDEE ≈ BMR × hệ số hoạt động.\n\n' +
            'Ví dụ hệ số hoạt động:\n' +
            '- Ít vận động: ×1.2\n' +
            '- Vận động nhẹ (1–3 buổi/tuần): ×1.375\n' +
            '- Vận động vừa (3–5 buổi/tuần): ×1.55\n' +
            '- Vận động nhiều (6–7 buổi/tuần): ×1.725\n\n' +
            'Muốn giảm cân an toàn: ăn thấp hơn TDEE khoảng 300–500 kcal/ngày.\n' +
            'App NutriCare có thể tính TDEE và gợi ý mức kcal phù hợp với mục tiêu.',
    },
    {
        id: 'safe_weight_loss',
        patterns: ['mức giảm cân an toàn mỗi tuần', 'giảm cân an toàn mỗi tuần'],
        answer:
            'Mức giảm cân an toàn (tham khảo chung):\n' +
            '- Khoảng 0.5–1.0 kg mỗi tuần đối với người thừa cân/béo phì.\n' +
            '- Tương ứng thâm hụt khoảng 500–1000 kcal/ngày so với TDEE.\n\n' +
            'Giảm quá nhanh có thể:\n' +
            '- Mất cơ nhiều, mệt mỏi, thiếu chất\n' +
            '- Khó duy trì lâu dài, dễ tăng lại.\n\n' +
            'Mỗi người khác nhau, nên tham khảo thêm ý kiến bác sĩ/chuyên gia nếu có bệnh nền.',
    },
    {
        id: 'safe_weight_gain',
        patterns: ['mức tăng cân an toàn mỗi tuần', 'tăng cân an toàn mỗi tuần', 'tăng cơ an toàn mỗi tuần'],
        answer:
            'Mức tăng cân/tăng cơ an toàn (tham khảo):\n' +
            '- Tăng khoảng 0.25–0.5 kg mỗi tuần.\n' +
            '- Thặng dư kcal nhẹ: +200–300 kcal/ngày so với TDEE.\n\n' +
            'Nếu tăng quá nhanh:\n' +
            '- Dễ tăng mỡ nhiều hơn tăng cơ.\n\n' +
            'Kết hợp ăn đủ protein, tập luyện sức mạnh và ngủ đủ là chìa khoá để tăng cơ lành mạnh.',
    },

    /* ====== MACRO & KẾ HOẠCH ĂN ====== */
    {
        id: 'macro',
        patterns: ['macro là gì'],
        answer:
            'Macro (macronutrients) là 3 nhóm chất dinh dưỡng chính:\n' +
            '- Protein (đạm)\n' +
            '- Carb (tinh bột, đường, chất xơ)\n' +
            '- Fat (chất béo)\n\n' +
            'Tỷ lệ macro (protein/carb/fat) ảnh hưởng nhiều đến việc bạn:\n' +
            '- Tăng cơ tốt hay không\n' +
            '- Giữ được cơ khi giảm mỡ\n' +
            '- Điều hoà năng lượng & cảm giác đói/no.',
    },
    {
        id: 'macro_cut',
        patterns: ['macro cho giảm mỡ', 'macro cho giảm cân', 'tỷ lệ macro cho giảm mỡ'],
        answer:
            'Ví dụ một tỷ lệ macro tham khảo cho giảm mỡ:\n' +
            '- Protein: ~1.6–2.2 g/kg cân nặng\n' +
            '- Fat: ~25–30% tổng kcal\n' +
            '- Phần còn lại là carb (ưu tiên carb tốt)\n\n' +
            'Tỷ lệ chính xác nên được cá nhân hoá theo:\n' +
            '- Mục tiêu (giảm mỡ nhẹ, mạnh)\n' +
            '- Cường độ tập luyện\n' +
            '- Tình trạng sức khoẻ & thói quen ăn uống.',
    },
    {
        id: 'macro_bulk',
        patterns: ['macro cho tăng cơ', 'tỷ lệ macro cho tăng cơ'],
        answer:
            'Ví dụ macro tham khảo cho tăng cơ (lean bulk):\n' +
            '- Protein: ~2.0 g/kg cân nặng\n' +
            '- Fat: ~20–25% tổng kcal\n' +
            '- Carb: phần còn lại (thường khá cao để hỗ trợ tập luyện)\n\n' +
            'Đi kèm:\n' +
            '- Thặng dư kcal nhẹ (~+200–300 kcal trên TDEE)\n' +
            '- Tập luyện sức mạnh đều đặn (progressive overload)\n' +
            '- Ngủ đủ & hồi phục tốt.',
    },
    {
        id: 'high_protein_food',
        patterns: ['thực phẩm giàu protein', 'thực phẩm nhiều protein'],
        answer:
            'Một số thực phẩm giàu protein:\n' +
            '- Thịt nạc: ức gà, thịt bò nạc, thịt lợn nạc\n' +
            '- Cá: cá hồi, cá thu, cá ngừ\n' +
            '- Trứng, sữa chua Hy Lạp, phô mai tươi\n' +
            '- Đậu, đậu lăng, đậu phụ\n' +
            '- Whey protein (nếu phù hợp với sức khoẻ mỗi người)\n\n' +
            'Kết hợp nhiều nguồn protein khác nhau giúp đa dạng dinh dưỡng.',
    },
    {
        id: 'high_fiber_food',
        patterns: ['thực phẩm nhiều chất xơ', 'giàu chất xơ'],
        answer:
            'Thực phẩm giàu chất xơ:\n' +
            '- Rau xanh: bông cải, rau bina, mồng tơi, cải bó xôi\n' +
            '- Trái cây: táo, lê, cam, bưởi, các loại quả mọng\n' +
            '- Ngũ cốc nguyên hạt: yến mạch, gạo lứt, bánh mì nguyên cám\n' +
            '- Các loại đậu: đậu đen, đậu đỏ, đậu xanh, đậu lăng\n' +
            '- Hạt: hạt chia, hạt lanh, hạt hướng dương...\n\n' +
            'Tăng chất xơ nên đi kèm uống đủ nước để tránh đầy bụng, khó tiêu.',
    },

    /* ====== CHỈ SỐ SỨC KHOẺ & BỆNH LÝ ====== */
    {
        id: 'bmi',
        patterns: ['bmi là gì', 'chỉ số bmi là gì'],
        answer:
            'BMI = cân nặng (kg) / [chiều cao (m)]².\n' +
            'Ví dụ: 60 kg, cao 1.65 m ⇒ BMI ≈ 22.0.\n\n' +
            'Đây là chỉ số nhanh để phân loại gầy/bình thường/thừa cân, nhưng không phân biệt mỡ hay cơ.\n' +
            'Người tập luyện nhiều cơ bắp có thể có BMI “cao” nhưng vẫn khoẻ mạnh.',
    },
    {
        id: 'bmi_normal',
        patterns: ['thế nào là bmi bình thường', 'bmi bình thường là bao nhiêu'],
        answer:
            'Khoảng BMI “bình thường” thường được tham khảo:\n' +
            '- Khoảng 18.5 – 23 đối với nhiều người châu Á (bao gồm người Việt).\n\n' +
            'Tuy nhiên, BMI chỉ là một trong nhiều chỉ số. Cần nhìn thêm:\n' +
            '- Vòng eo, tỷ lệ mỡ, huyết áp, đường huyết…\n' +
            'Nếu có bệnh nền, nên hỏi bác sĩ để được tư vấn phù hợp.',
    },
];

const FALLBACK_ANSWER =
    'Mình là “Từ điển dinh dưỡng mini” 🤖.\n\n' +
    'Mình có thể giải thích nhanh các thuật ngữ & công thức cơ bản như: calorie, protein, BMR, TDEE, BMI, GI, macro, mức giảm/tăng cân an toàn, món ăn cho người tiểu đường...\n' +
    'Hãy thử chạm vào một câu ở phía trên nhé!';

export function getNutritionGlossaryAnswer(prompt: string): string {
    const p = normalize(prompt);

    for (const entry of ENTRIES) {
        if (entry.patterns.some(pattern => p.includes(pattern))) {
            return entry.answer;
        }
    }

    return FALLBACK_ANSWER;
}
