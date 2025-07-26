export interface RgbServiceI {
  updateColors(comb: string, hl: boolean): Promise<void>;
  setup(): Promise<void>;
}