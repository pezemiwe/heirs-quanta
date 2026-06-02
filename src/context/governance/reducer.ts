let _eid = 100;

export function nextId() {
  return `a${String(++_eid).padStart(3, "0")}`;
}
