export class FpsService {
  private element: HTMLElement | null = null;
  private frames = 0;
  private time = 0;

  public setElement(element: HTMLElement | null): void {
    this.element = element;
  }

  public update(delta: number): void {
    if (!this.element) return;

    this.frames++;
    this.time += delta;

    if (this.time >= 0.5) {
      const fps = Math.round(this.frames / this.time);
      this.element.innerText = `${fps}`;
      this.frames = 0;
      this.time = 0;
    }
  }
}
