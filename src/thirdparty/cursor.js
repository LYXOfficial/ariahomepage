// cursor.js
export default class Cursor {
  constructor() {
    this.cursor = document.createElement("div");
    this.cursor.id = "cursor";
    this.cursor.style.position = "fixed";
    this.cursor.style.pointerEvents = "none";
    this.cursor.style.zIndex = "9999";
    document.body.appendChild(this.cursor);
    this.inner = document.createElement("div"); 
    this.inner.id = "cursor-inner";
    this.cursor.appendChild(this.inner);

    this.pos = { x: 0, y: 0 };
    this.target = { x: 0, y: 0 };

    this.bindEvents();
    requestAnimationFrame(() => this.render());
  }

  bindEvents() {
    this.pointerMoveHandler = (e) => {
      this.target.x = e.clientX;
      this.target.y = e.clientY;
      this.inner.classList.remove("hidden");
    };

    this.mouseEnterHandler = (e) => {
      if (this.isInteractiveElement(e.target)) {
        this.inner.classList.add("hover");
      }
    };

    this.mouseLeaveHandler = (e) => {
      if (this.isInteractiveElement(e.target)) {
        this.inner.classList.remove("hover");
      }
    };

    this.pointerDownHandler = (e) => {
      this.inner.classList.add("active");
    };

    this.pointerUpHandler = (e) => {
      this.inner.classList.remove("active");
    };

    document.addEventListener("pointermove", this.pointerMoveHandler);
    document.addEventListener("mouseenter", this.mouseEnterHandler, true);
    document.addEventListener("mouseleave", this.mouseLeaveHandler, true);
    document.addEventListener("pointerdown", this.pointerDownHandler);
    document.addEventListener("pointerup", this.pointerUpHandler);
  }

  isInteractiveElement(el) {
    if (!el || el.nodeType !== 1) return false;
    const tag = el.tagName.toLowerCase();
    return (
      ["a", "button", "input", "textarea", "select", "label"].includes(tag) ||
      el.hasAttribute("data-cursor-hover")
    );
  }

  render() {
    // 缓动，让光标平滑跟随
    this.pos.x += (this.target.x - this.pos.x) * 0.15;
    this.pos.y += (this.target.y - this.pos.y) * 0.15;

    this.cursor.style.transform = `translate3d(${this.pos.x}px, ${this.pos.y}px, 0)`;

    requestAnimationFrame(() => this.render());
  }
}
