export function bindEnterSubmit(el: HTMLElement, onSubmit: () => void): () => void {
  const onKeyDown = (ev: KeyboardEvent) => {
    if (ev.key !== "Enter") return;
    if (ev.isComposing) return;
    if (ev.shiftKey) return;
    ev.preventDefault();
    ev.stopPropagation();
    onSubmit();
  };

  el.addEventListener("keydown", onKeyDown);
  return () => {
    el.removeEventListener("keydown", onKeyDown);
  };
}
