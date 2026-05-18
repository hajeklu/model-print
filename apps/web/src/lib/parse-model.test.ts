import { describe, it, expect } from "vitest";
import {
  estimateMaterialUsage,
  estimatePrice,
  meetsMinimumPrintSize,
  parseScaleLinearRatio,
  scaledVolumeCm3,
  smallestScaledAxisMm,
} from "./parse-model";

describe("scale geometry", () => {
  it("parses 1:N as linear ratio 1/N", () => {
    expect(parseScaleLinearRatio("1:1")).toBe(1);
    expect(parseScaleLinearRatio("1:100")).toBe(0.01);
    expect(parseScaleLinearRatio("1:200")).toBe(0.005);
  });

  it("scales volume by linear ratio cubed", () => {
    expect(scaledVolumeCm3(1000, "1:100")).toBe(0);
    expect(scaledVolumeCm3(1_000_000, "1:100")).toBe(1);
  });
});

describe("minimum print size", () => {
  const bbox = { x: 80, y: 50, z: 30 };

  it("rejects scale when smallest axis would be under 1 mm", () => {
    expect(smallestScaledAxisMm(bbox, "1:100")).toBe(0.3);
    expect(meetsMinimumPrintSize(bbox, "1:100")).toBe(false);
    expect(meetsMinimumPrintSize(bbox, "1:1")).toBe(true);
  });
});

describe("estimateMaterialUsage", () => {
  it("treats full scaled mesh volume as 100% infill PLA", () => {
    const { grams } = estimateMaterialUsage(100, "1:1");
    expect(grams).toBe(Math.round(100 * 1.24));
  });

  it("reduces grams when print scale shrinks", () => {
    const full = estimateMaterialUsage(1000, "1:1");
    const small = estimateMaterialUsage(1000, "1:100");
    expect(small.grams).toBeLessThan(full.grams);
  });

  it("prices as base 95 EUR plus grams / 10", () => {
    const { grams } = estimateMaterialUsage(100, "1:1");
    expect(estimatePrice(100, "1:1")).toBe(Math.round(95 + grams / 10));
  });
});
