"use client";

import { useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";
import { toPng } from "html-to-image";
import { ProcessedData } from "@/lib/types";

interface RidgelineChartProps {
  data: ProcessedData;
  title?: string;
}

export default function RidgelineChart({ data, title }: RidgelineChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const handleSave = useCallback(async () => {
    if (!containerRef.current) return;

    try {
      const dataUrl = await toPng(containerRef.current, {
        backgroundColor: "#fafafa",
        pixelRatio: 2,
      });

      const link = document.createElement("a");
      link.download = `${title || "chart"}-${data.year}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to save image:", err);
    }
  }, [data.year, title]);

  useEffect(() => {
    if (!svgRef.current || !data.items.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Calculate left margin based on longest label (capped)
    const longestLabel = Math.max(...data.items.map(item => item.label.length));
    const leftMargin = Math.min(350, Math.max(120, longestLabel * 5.5 + 20)); // cap at 350px

    const margin = { top: 50, right: 50, bottom: 50, left: leftMargin };
    const width = leftMargin + 750; // Chart area stays consistent
    const rowSpacing = 22;
    const peakHeight = 50;
    const height = margin.top + margin.bottom + data.items.length * rowSpacing + peakHeight;

    svg
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .style("max-width", "100%")
      .style("height", "auto")
      .style("font-family", "var(--font-tiktok-sans), 'TikTok Sans', sans-serif");

    const defs = svg.append("defs");

    // Colors - teal at bottom, orange/yellow at top
    const baseColor = "#96C9D6";
    const peakColor = "#FFB804";
    const borderColor = "#B4A996";

    // Single vertical gradient - bottom to top
    const areaGradient = defs
      .append("linearGradient")
      .attr("id", "area-gradient")
      .attr("x1", "0%")
      .attr("y1", "100%")
      .attr("x2", "0%")
      .attr("y2", "0%");

    areaGradient.append("stop").attr("offset", "0%").attr("stop-color", baseColor);
    areaGradient.append("stop").attr("offset", "100%").attr("stop-color", peakColor);

    // X scale
    const xScale = d3
      .scaleTime()
      .domain([data.weeks[0], data.weeks[data.weeks.length - 1]])
      .range([margin.left, width - margin.right]);

    // Draw each item
    data.items.forEach((item, i) => {
      const baselineY = margin.top + i * rowSpacing + peakHeight;
      const peak = item.peakMinutes || 1;

      const yScale = d3
        .scaleLinear()
        .domain([0, 1])
        .range([0, peakHeight]);

      const area = d3
        .area<{ week: Date; minutes: number }>()
        .x((d) => xScale(d.week))
        .y0(baselineY)
        .y1((d) => baselineY - yScale(d.minutes / peak))
        .curve(d3.curveBasis);

      const line = d3
        .line<{ week: Date; minutes: number }>()
        .x((d) => xScale(d.week))
        .y((d) => baselineY - yScale(d.minutes / peak))
        .curve(d3.curveBasis);

      // Baseline
      svg
        .append("line")
        .attr("x1", margin.left)
        .attr("x2", width - margin.right)
        .attr("y1", baselineY)
        .attr("y2", baselineY)
        .attr("stroke", borderColor)
        .attr("stroke-width", 0.5)
        .attr("opacity", 0.3);

      // Area fill with subtle border
      svg
        .append("path")
        .datum(item.data)
        .attr("d", area)
        .attr("fill", "url(#area-gradient)")
        .attr("stroke", borderColor)
        .attr("stroke-width", 0.5)
        .attr("opacity", 0.92);

      // Label - no truncation, full song name
      svg
        .append("text")
        .attr("x", margin.left - 15)
        .attr("y", baselineY + 4)
        .attr("text-anchor", "end")
        .attr("font-size", "11px")
        .attr("font-weight", "400")
        .attr("fill", "#444")
        .text(item.label);
    });

    // X axis with explicit month ticks
    const tickMonths = [0, 3, 6, 9, 11].map(m => new Date(data.year, m, 1));

    svg
      .append("g")
      .attr("transform", `translate(0, ${height - margin.bottom + 15})`)
      .call(
        d3
          .axisBottom(xScale)
          .tickValues(tickMonths)
          .tickFormat((d) => {
            const date = d as Date;
            if (date.getMonth() === 0) {
              return d3.timeFormat("%b '%y")(date);
            }
            return d3.timeFormat("%b")(date);
          })
          .tickSize(0)
      )
      .call((g) => g.select(".domain").remove())
      .call((g) => g.selectAll(".tick text").attr("font-size", "12px").attr("fill", "#888"));

    // Legend - top left above the chart
    const legendG = svg.append("g").attr("transform", `translate(${margin.left}, 15)`);

    // Legend gradient
    const legendGrad = defs
      .append("linearGradient")
      .attr("id", "legend-grad")
      .attr("x1", "0%")
      .attr("x2", "0%")
      .attr("y1", "100%")
      .attr("y2", "0%");

    legendGrad.append("stop").attr("offset", "0%").attr("stop-color", baseColor);
    legendGrad.append("stop").attr("offset", "100%").attr("stop-color", peakColor);

    // Rounded triangle - starts at y=0, ends at y=28
    legendG
      .append("path")
      .attr("d", "M0,28 Q14,-4 28,28 Z")
      .attr("fill", "url(#legend-grad)");

    legendG
      .append("text")
      .attr("x", 36)
      .attr("y", 4)
      .attr("font-size", "10px")
      .attr("fill", "#888")
      .text("100");

    legendG
      .append("text")
      .attr("x", 36)
      .attr("y", 28)
      .attr("font-size", "10px")
      .attr("fill", "#888")
      .text("0");

    legendG
      .append("text")
      .attr("x", 60)
      .attr("y", 16)
      .attr("font-size", "10px")
      .attr("fill", "#999")
      .text("Height is listening time, indexed to peak");

  }, [data]);

  return (
    <div className="inline-block">
      <div ref={containerRef} className="bg-[#fafafa] rounded-lg p-4 inline-block">
        <svg ref={svgRef} className="block"></svg>
      </div>
      <div>
        <button
          onClick={handleSave}
          className="mt-4 px-4 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
        >
          Save as Image
        </button>
      </div>
    </div>
  );
}
