// Shared random collaborator nicknames/colors for chat and meeting rooms
// (mirrors the lists in doc-room.js).

const ADJECTIVES = ["敏捷的", "沉静的", "闪耀的", "温暖的", "睿智的", "灵动的", "勇敢的", "悠然的", "专注的", "快乐的"];
const ANIMALS = ["狐狸", "熊猫", "海豚", "猫头鹰", "松鼠", "企鹅", "长颈鹿", "考拉", "老虎", "兔子"];
const COLORS = ["#e74c3c", "#e67e22", "#f1c40f", "#2ecc71", "#1abc9c", "#3498db", "#9b59b6", "#e84393", "#16a085", "#d35400"];

export function randomName() {
  const a = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const b = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  return a + b;
}

export function pickColor(index) {
  return COLORS[index % COLORS.length];
}
