// Trả về chuỗi YYYY-MM-DD
export function toISODateOnly(d: Date): string {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

// Trả về chuỗi định dạng ngày tháng tiếng Việt, ví dụ: "Thứ 2, 01 Tháng 01"
export function fmtVNFull(d: Date): string{
    const dow = [
      'Chủ nhật',
      'Thứ 2',
      'Thứ 3',
      'Thứ 4',
      'Thứ 5',
      'Thứ 6',
      'Thứ 7',
    ][d.getDay()];
    const dd = `${d.getDate()}`.padStart(2, '0');
    const mm = `${d.getMonth() + 1}`.padStart(2, '0');
    return `${dow}, ${dd} Tháng ${mm}`;
};