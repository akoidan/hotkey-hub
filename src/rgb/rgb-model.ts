export interface RgbServiceI {
  updateColors(comb: string, hl: boolean): void;
  setup(): Promise<void>;
}