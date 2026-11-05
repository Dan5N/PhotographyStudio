"use client";
import React, { useEffect, useRef } from "react";
import { type Card } from "../conts";
import { type CountUp } from "countup.js";
import {
  Card as CardContainer,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTranslation } from "react-i18next";

function HomeCard({ info }: { info: Card }) {
  const { t } = useTranslation("dashboard");
  const countupRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    let disposed = false;
    let animation: CountUp | undefined;
    void import("countup.js").then(({ CountUp }) => {
      if (disposed || !countupRef.current) return;
      animation = new CountUp(countupRef.current, info.numb);
      if (!animation.error) animation.start();
    });
    return () => { disposed = true; animation?.reset(); };
  }, [info.numb]);
  return (
    <CardContainer className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{t(info.name)}</CardTitle>
        {info.icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          +<span ref={countupRef}>0</span>
        </div>
        <p className="text-xs text-muted-foreground">
          {info.desc} {t("from last month")}
        </p>
      </CardContent>
    </CardContainer>
  );
}

export default HomeCard;
