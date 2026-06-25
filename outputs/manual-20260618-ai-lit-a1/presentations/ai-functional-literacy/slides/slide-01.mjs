import { renderSlide } from "./content.mjs";

export async function slide01(presentation, ctx) {
  return renderSlide(presentation, ctx, 0);
}
